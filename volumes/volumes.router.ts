
import * as restify from "restify";
import * as mongoose from "mongoose";
import * as cluster from 'cluster';
import * as child_process from 'child_process';
import amqp = require('amqplib/callback_api');

import { ModelRouter } from "../common/model-router";
import { NotFoundError, MethodNotAllowedError, NotExtendedError } from 'restify-errors';
import { Volume } from "./volumes.model";
import { authorize } from "../security/authz.handler";
import { Archive } from "../archives/archives.model";
import { authenticate } from '../security/auth.handler';
import { User } from "../users/users.model";
import { ObjectId } from 'bson';
import { Departament } from '../departaments/departaments.model';
import { Sheetvolume } from "../sheetvolumes/sheetvolumes.model";

import { Position } from '../positions/positions.model';
import { Storehouse } from '../storehouses/storehouses.model';
import { environment } from '../common/environment'
import { sendRabbitmq } from "../queues/sendRabbitmq";
import { ImportSheet } from "../importsheets/importsheets.model";
import { setCronDepartaments } from "../libary/flagDepartaments";
var XLSX = require('xlsx')
import { Audit } from '../audits/audits.model'
import { cachedvolumes } from "./cachedvolumes";
import { Email } from "../emails/emails.model";
import { sendFirebase } from "../firebase/sendFirebase";
const bufferFrom = require('buffer-from')
const moment = require('moment-timezone');
const cache = require('../cache/cache')











class VolumesRouter extends ModelRouter<Volume> {
  constructor() {
    super(Volume);
  }

  protected prepareOne(
    query: mongoose.DocumentQuery<Volume, Volume>
  ): mongoose.DocumentQuery<Volume, Volume> {
    return query
      .populate("storehouse", "name")
      .populate("company", "name")
      .populate("departament", "name")
      .populate("volumeLoan.stastatLoan");
  }

  envelop(document) {
    let resource = super.envelope(document);
    resource._links.listSeal = `${this.basePath}/${resource._id}/listSeal`;
    return resource;
  }



  findSeal = (req, resp, next) => {
    Volume.findById(req.params.id, "+listSeal")
      .then(vol => {
        if (!vol) {
          throw new NotFoundError("Lacre não encontrada!");
        } else {
          resp.json(vol.listSeal);
          return next();
        }
      })
      .catch(next);
  };

  find = (req, resp, next) => {
    let page = parseInt(req.query._page || 1);
    page += 1;
    const skip = (page - 1) * this.pageSize;
    Volume.count({
      mailSignup: req.authenticated.mailSignup,
      company: req.authenticated.company
    })
      .exec()
      .then(count =>
        Volume.find({
          mailSignup: req.authenticated.mailSignup,
          company: req.authenticated.company
        })
          .populate("storehouse", "name")
          .populate("company", "name")
          .populate("departament", "name")
          .skip(skip)
          .limit(this.pageSize)
          .then(
            this.renderAll(resp, next, {
              page,
              count,
              pageSize: this.pageSize,
              url: req.url
            })
          )
      )
      .catch(next);
  };

  replaceSeal = (req, resp, next) => {
    Volume.findById(req.params.id)
      .then(vol => {
        if (!vol) {
          throw new NotFoundError("Caixa não encontrado!");
        } else {
          vol.listSeal = req.body;
          return vol.save();
        }
      })
      .then(vol => {
        resp.json(vol.listSeal);
        return next;
      })
      .catch(next);
  };

  delete = async (req, resp, next) => {


    Archive.find({ volume: req.params.id })
      .then(async doc => {
        if (doc.length === 0) {
          const v = await Volume.find({ _id: req.params.id })
          setCronDepartaments(v.map(el => { return el.departament }).toString())

          const stor =v.map(el=>{return el.storehouse}).toString()

          this.model
            .remove({ _id: req.params.id })
            .exec()
            .then((cmdResult: any) => {
              if (cmdResult.result.n) {
                resp.send(204);
              } else {
                throw new NotFoundError("Caixa não encontrada!");
              }
              return next();
            })
            .catch(next);
          let loc = await (await Volume.find({ "_id": req.params.id }))
            .map(el => { return el.location }).toString()
          

          let pos = await (await Position.find({ "position": { "$eq": loc },storehouse:stor }))
            .map(el => { return el.position }).toString()

          if (loc === pos) {
            await Position.update({ storehouse:stor,position: pos  }, {
              $set: {
                used: false,
               
              },
              $unset:{company:1,departament:1},
            },
            ).catch(next)
          }

        } else {
          throw new MethodNotAllowedError(
            "Esta Caixa não pode ser excluída pois possui registros Associdados"
          );
        }
      })
      .catch(next);
  };

  filter = async (req, resp, next) => {
    const _location = req.body.location;
    // const initDate = req.body.initDate || "1900-01-01";
    // const endDate = req.body.endDate || "2900-01-01";
    let _initDate = req.body.initDate || "1900-01-01";
    let _endDate = req.body.endDate || "2900-01-01";

    let initDate = new Date(_initDate)
    const t = 1
    let __endDate = new Date(_endDate)
    let endDate = __endDate.setDate(__endDate.getDate() + 1)
    const filters = req.body;
    const filter =
      delete filters.location &&
      delete filters.initDate &&
      delete filters.endDate;
    const recebe = _location;



    const keybords = JSON.stringify(req.body).replace("{", "").replace("}", "") // tudo q o user digitou nos filtros.


    // let params = `searchvolumes-${req.authenticated.mailSignup}:userid-${req.authenticated._id}-terms-${keybords}-location-${_location}-initDate${initDate}-endDate${endDate}-page-${req.query._page}`

    // const cached = await cache.get(params)
    // if (cached) {
    //   resp.send(cached)

    // } else {

      let page = parseInt(req.query._page || 1);
      let Size = parseInt(req.query.size || 10);
      this.pageSize = Size;
      page += 1;
      const skip = (page - 1) * this.pageSize;

      let profile = req.authenticated.profiles.toString()



      try {
        if (req.body.company !== undefined || null) {
          if (profile === 'DAENERYS') {
            let query = {
              mailSignup: req.authenticated.mailSignup,
              location: new RegExp(recebe, "ig"),
              $and: [
                filters,
                {
                  dateCreated: {
                    $gte: initDate,
                    $lte: endDate
                  }
                }
              ]
            }


            Volume.count(
              Volume.find(query)
            )
              .exec()
              .then(
                async count =>
                  await Volume.find(query)
                    .populate("storehouse", "name")
                    .populate("company", "name")
                    .populate("departament", "name")
                    .sort('location')
                    .skip(skip)
                    .limit(this.pageSize)
                    .then(
                      this.renderAll(resp, next, {
                        page,
                        count,
                        pageSize: this.pageSize,
                        url: req.url
                      })
                    )
              )
              .catch(next);

            // cachedvolumes(query, params, req.url, req.query._page, req.query.size)


          } else {
            // let user = await User.find({ _id: req.authenticated._id })
            //   .select("permissions.docts")
            //   .select("permissions.company");
            // let data = user[0].permissions.map(item => {
            //   return item.docts;
            // });

            // let doct = data;

            // let data2 = user[0].permissions.map(item => {
            //   return item.company;
            // });

            // let company = data2;

            let query = {
              mailSignup: req.authenticated.mailSignup,
              location: new RegExp(recebe, "ig"),
              company: req.body.company,
              $and: [
                filters,
                {
                  dateCreated: {
                    $gte: initDate,
                    $lte: endDate
                  }
                }
              ]
            }


            Volume.count(
              Volume.find(query)
            )
              .exec()
              .then(
                async count =>
                  await Volume.find(query)
                    .populate("storehouse", "name")
                    .populate("company", "name")
                    .populate("departament", "name")
                    .sort('location')
                    .skip(skip)
                    .limit(this.pageSize)
                    .then(
                      this.renderAll(resp, next, {
                        page,
                        count,
                        pageSize: this.pageSize,
                        url: req.url
                      })
                    )
              )
              .catch(next);
            // cachedvolumes(query, params, req.url, req.query._page, req.query.size)

          }

        } else {
          // console.log("opa agora digitaram")
          throw new MethodNotAllowedError(
            "Por favor Escolha uma Empresa válida!"
          );
        }

      } catch (error) {
        // console.log("erro Interno ----------")
        resp.send(error)

      }
    }

  

  save = async (req, resp, next) => {


    let stor = await Storehouse.find({ _id: req.body.storehouse })
    let checkStore = stor.map(el => { return el.mapStorehouse }).pop()



    if (checkStore === true) {

      let controlPos = await Position.find({ storehouse: req.body.storehouse, used: false, position: { $eq: req.body.location } })
      let idPosition = controlPos.map(el => { return el._id }).toString()
      let checkPosition = controlPos.map(el => { return el.used }).toString()


      if (idPosition !== '') {

        if (JSON.parse(checkPosition) === false) {
          let document = new Volume({
            location: req.body.location,
            volumeType: req.body.volumeType,
            guardType: req.body.guardType,
            status: req.body.status,
            storehouse: req.body.storehouse,
            uniqueField: req.body.uniqueField,
            company: req.body.company,
            departament: req.body.departament,
            comments: req.body.comments,
            seal: req.body.seal,
            listSeal: req.body.listSeal,
            reference: req.body.reference,
            author: req.authenticated._id,
            mailSignup: req.authenticated.mailSignup,
            dateCreated: moment().tz('America/Sao_Paulo'),
            lastUpdateVolume:moment().tz('America/Sao_Paulo'),
          });
          setCronDepartaments(req.body.departament)

          await document.save()
            .then(await Position.update({ _id: idPosition }, { $set: { used: true, company: req.body.company, departament: req.body.departament } }))
            .then(this.render(resp, next));
        } else {
          resp.send(new MethodNotAllowedError(
            "Caixa já Cadastrado, por favor cadastro uma outra..."
          ))
        }
      } else {
        resp.send(new MethodNotAllowedError(
          "Nâo foi possivel criar Está Caixa verifique o nome da Caixa, Posição não Cadastrada!"
        ))
      }
    } else {

      let document = new Volume({
        location: req.body.location,
        volumeType: req.body.volumeType,
        guardType: req.body.guardType,
        status: req.body.status,
        storehouse: req.body.storehouse,
        uniqueField: req.body.uniqueField,
        company: req.body.company,
        departament: req.body.departament,
        comments: req.body.comments,
        listSeal: req.body.listSeal,
        reference: req.body.reference,
        author: req.authenticated._id,
        mailSignup: req.authenticated.mailSignup,
        dateCreated: moment().tz('America/Sao_Paulo'),
        lastUpdateVolume:moment().tz('America/Sao_Paulo'),
      });
      Volume.find({
        mailSignup: req.authenticated.mailSignup,
        uniqueField: req.body.uniqueField,
        status: { $ne: "BAIXADO" }
      })
        .then(async com => {
          if (com.length === 0) {
            setCronDepartaments(req.body.departament)
            await document.save().then(this.render(resp, next));
          } else {
            throw new MethodNotAllowedError(
              "Caixa já Cadastrado, por favor cadastro uma outra..."
            );
          }
        })
        .catch(next);
    }
  };

  importnew = async (req, resp, next) => {

    const { volumeType, company, departament, storehouse, guardType } = req.body
    let workbook = XLSX.readFile(req.files.uploaded_file.path);
    let sheet_name_list = workbook.SheetNames;

    let xlData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
    const plan = `${Date.now().toString()}-${req.files.uploaded_file.name}`
    const sheet = plan.toString()
    let _titles = xlData[0]
    let titles = Object.keys(_titles)
    let oneTitle = ""
    let headers = []


    try {
      for (let i = 0; titles.length > i; i++) {
        oneTitle = titles[i]

        headers.push(oneTitle)

      }

      let locationTitle = headers[0].toString()
      let obs = headers[1].toString()
      let ref = ""
      let seal = ""

      if (guardType == "SIMPLES") {
        ref = headers[2].toString()
        seal = headers[3].toString()
      } else {
        ref = ""
        seal = ""
      }

      let arr = []
      let vol = []
      let err = []
      const u = await User.find({ _id: req.authenticated._id })
      const username = u.map(el => { return el.name })
      // const sheetname = Date.now() + "-" + username.toString() + "-" + req.body.sheetName
      const stor = await Storehouse.find({ _id: storehouse })
      const checkStore = stor.map(el => { return el.mapStorehouse }).pop()
      let documentError = new Sheetvolume({
        sheet: sheet,
        mailSignup: req.authenticated.mailSignup,

      })
      setCronDepartaments(departament)
      await documentError.save()

      for (let i = 0; xlData.length > i; i++) {

        let document = new Volume({
          location: xlData[i][locationTitle],
          volumeType: volumeType,
          guardType: guardType,
          storehouse: storehouse,
          uniqueField: `${xlData[i][locationTitle]}-${storehouse}`,
          company: company,
          departament: departament,
          comments: xlData[i][obs] || " ",
          seal: xlData[i][seal] || "",
          reference: xlData[i][ref] || "",
          author: req.authenticated._id,
          sheetImport: sheet,
          mailSignup: req.authenticated.mailSignup,
          dateCreated: moment().tz('America/Sao_Paulo'),
          lastUpdateVolume:moment().tz('America/Sao_Paulo')
        })

        if (checkStore === true) {


          let controlPos = await Position.find({ storehouse: storehouse, position: { $eq: xlData[i][locationTitle] } })
          let idPosition = controlPos.map(el => { return el._id }).toString()
          let checkPosition = controlPos.map(el => { return el.used }).toString()


          if (idPosition !== '') {
            if (JSON.parse(checkPosition) === false) {


              vol.push(document)
              setCronDepartaments(departament)
              document.save()
              await Position.update({ _id: idPosition }, { $set: { used: true, company: company, departament: departament } })
                .catch(next)
            } else {

              err.push(xlData[i][locationTitle])
              let row = i + 1

              let log =
              {

                "row": row,
                "msgError": "ESTA CAIXA NÃO ESTÁ CADASTRADA NO MAPA DE DEPÓSITO!",
                "location": xlData[i][locationTitle],

              }
              Sheetvolume.findOneAndUpdate(
                { _id: documentError },
                { $push: { logErrors: log } },
                function (error, success) {
                  if (error) {
                    // console.log(error);
                  } else {
                    return next(new MethodNotAllowedError(`OPSS ALGO DE ARREDADO ACONTECEU!`))
                  }
                })
            }

          } else {

            err.push(xlData[i][locationTitle])
            let row = i + 1
            let log2 =
            {
              "row": row,
              "msgError": "ESTÁ CAIXA JÁ ESTÁ EM USO!",
              "location": xlData[i][locationTitle]
            }
            Sheetvolume.findOneAndUpdate(
              { _id: documentError },
              { $push: { logErrors: log2 } },
              function (error, success) {
                if (error) {
                  return next(new MethodNotAllowedError(`OPSS ALGO DE ARREDADO ACONTECEU!`))
                  // console.log(error);
                } else {

                }
              })
          }

        } else {

          var v = await Volume.find({
            mailSignup: req.authenticated.mailSignup,
            location: { $eq: xlData[i][locationTitle] },
            storehouse: storehouse,
            departament: departament,
            status: { $ne: "BAIXADO" }
          })
          if (v.length === 0) {
            vol.push(document)
            setCronDepartaments(departament)
            await document.save()
          } else {
            err.push(xlData[i][locationTitle])
            let row = i + 1
            let log3 =
            {
              "row": row,
              "msgError": "ESTÁ CAIXA JÁ ESTÁ EM USO!",
              "location": xlData[i][locationTitle]
            }
            Sheetvolume.findOneAndUpdate(
              { _id: documentError },
              { $push: { logErrors: log3 } },
              function (error, success) {
                if (error) {
                  return next(new MethodNotAllowedError(`OPSS ALGO DE ARREDADO ACONTECEU!`))
                  // console.log(error);
                } else {

                }
              })
          }
        }

        arr.push(i.toString())
        console.log(arr.length)
        bufferFrom(arr, 'uft8')
        console.log(bufferFrom(arr, 'uft8'))

      }

      let sheetErros = ""
      let sheetID = await Sheetvolume.find({ sheet: sheet, mailSignup: req.authenticated.mailSignup })
      let _sheetID = sheetID.map(el => { return el._id });



      if (err.length === 0) {
        sheetErros = "Não foi Registrado Erros"
      } else {
        sheetErros = `/sheetvolumes/excel/${_sheetID[0]}`
      }

      let finish = {
        "Errors": err.length,
        "Imported": vol.length,
        "sheetError": sheetErros
      }
      resp.send(finish)

    } catch (e) {

      return next(new MethodNotAllowedError(`POR FAVOR VERIFIQUE A FORMATAÇÃO DA SUA PLANILHA!`))
    }
  };

  import = async (req, resp, next) => {

    



    if (req.files.file.type !== "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
      return next(new MethodNotAllowedError(`SOMENTE SÃO PERMITIDOS ARQUIVOS XLSX!`))
    }



    const { volumeType, company, departament, storehouse, guardType } = req.body
    let workbook = XLSX.readFile(req.files.file.path);

    let sheet_name_list = workbook.SheetNames;

    let xlData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
    const queue = "volumeimport"
    const idus = req.authenticated.id
    const sponsor = req.authenticated.mailSignup
    const plan = req.files.file.name
    const sheetN = plan.toString()


    let verifySheet = await ImportSheet.find({ mailSignup: sponsor, sheet: sheetN })
    console.log(verifySheet.length)

    if (verifySheet.length !== 0) {
      return next(new MethodNotAllowedError(`OPS...ESSE PLANILHA ${sheetN}, já foi utilizada, por favor coloque outro nome!`))
    }

    let document = new ImportSheet({

      sheet: sheetN,
      mailSignup: sponsor
    })
    setCronDepartaments(departament)

    await document.save()

    sendRabbitmq(queue, idus, sponsor, volumeType, company, departament, storehouse, guardType, sheetN, workbook)
      .then(resp.send({ "mssg": "Sua Planilha está sendo Processada, vc receberá uma Notificação em Breve!" }))
      .catch(next)
  };



  updateVol = async (req, resp, next) => {


    // let params = `volumeshow:${req.params.id}`
    // let prefixSearch = `searchvolumes-${req.authenticated.mailSignup}`
  

    
  

    const options = { runValidators: true, new: true }

    let volProp = await (await Volume.find({ "_id": req.params.id }))
      .map(el => { return el.storehouse }).toString()

    let volReg = await (await Volume.find({ "_id": req.params.id }))
      .map(el => { return el.location }).toString()

    let storProp = await (await Storehouse.find({ "_id": volProp }))
      .map(el => { return el.mapStorehouse }).toString()

    if (req.body.location !== volReg) {

      if (storProp === 'true') {
        // console.log("galpao controlado")
        let locProp = await (await Volume.find({ "_id": req.params.id }))
          .map(el => { return el.location }).toString()

          let company = await (await Volume.find({ "_id": req.params.id }))
          .map(el => { return el.company }).toString()
          let departament = await (await Volume.find({ "_id": req.params.id }))
          .map(el => { return el.departament }).toString()

          
        let posProp = await (await Position.find({ "position":req.body.location }))
          .map(el => { return el.position }).toString()

        if (locProp === posProp) {
          // cache.del(params).catch()
          // cache.delPrefix(prefixSearch).catch()
         await this.model.findByIdAndUpdate(req.params.id, req.body, options)
            .then(this.render(resp, next))
            .catch(next)

        } else {
          // console.log("tem q alterar no mapa")
          let positionPr = await (await Position.find({storehouse:volProp, "position": req.body.location }))

          let pos = positionPr.map(el => { return el.position }).toString()
          let use = positionPr.map(el => { return el.used }).toString()

          if (pos === '') {

            resp.send(new MethodNotAllowedError(
              `A Localização: ${req.body.location} não está Cadastrado no Mapa de Posições`
            ))

          } else {
            if (use === 'false') {
              // cache.del(params).catch()
              // cache.delPrefix(prefixSearch).catch()

              let oldLocation = await (await Volume.find({ "_id": req.params.id }))
                .map(el => { return el.location }).toString()

             await this.model.findByIdAndUpdate(req.params.id, req.body, options)
             
                
                .then(this.render(resp, next))
                .catch(next)

              await  Position.update({ storehouse:volProp,position: oldLocation  }, { $set: {used: false },$unset:{company:1,departament:1}})
              await  Position.update({ storehouse:volProp,position:  req.body.location }, { $set: { company: company, departament: departament, used: true } })


            } else {
              resp.send(new MethodNotAllowedError(
                `A Localização: ${req.body.location}, já está sendo utilizada!`
              ))
                .then(this.render(resp, next))
                .catch(next)

            }
          }
        }
      } else {
        
        // console.log("galpao  nao controlado")
       await this.model.findByIdAndUpdate(req.params.id, req.body, options)
          .then(this.render(resp, next))
          .catch(next)
      }
    }




    this.model.findByIdAndUpdate(req.params.id, req.body, options)
      .then(this.render(resp, next))
      .catch(next)




  }

  show = async (req, resp, next) => {


    // let params = `volumeshow:${req.params.id}`
    // const cached = await cache.get(params)

    // if (cached) {

    //   resp.send(
    //     cached
    //   )

    // } else {

      const show = await this.prepareOne(this.model.findById(req.params.id))
      // cache.set(params, show, 60 * 1)
      resp.send(
        show
      )

    

  }


 

 






  applyRoutes(applycation: restify.Server) {
    applycation.post(`${this.basePath}/search`, [
      authorize("SNOW", "TYWIN", "DAENERYS", 'STARK', 'TULLY'),
      this.filter
    ]);
    applycation.get(`${this.basePath}`, [
      authorize("SNOW", "TYWIN", "DAENERYS", 'STARK', 'TULLY'),
      this.find
    ]);
    applycation.get(`${this.basePath}/:id`, [
      authorize("SNOW", "TYWIN", "DAENERYS", 'STARK', 'TULLY'),
      this.validateId,
      this.show
    ]);
    applycation.post(`${this.basePath}`, [
      authorize("TYWIN", "DAENERYS"),
      this.save
    ]);


    applycation.post(`${this.basePath}/import`, [
      authorize("TYWIN", "DAENERYS"),
      this.import
    ]);
    applycation.put(`${this.basePath}/:id`, [
      authorize("TYWIN", "DAENERYS"),
      this.validateId,
      this.updateVol
    ]);
    applycation.patch(`${this.basePath}/:id`, [
      authorize("TYWIN", "DAENERYS"),
      this.validateId,
      this.replace
    ]);
    applycation.del(`${this.basePath}/:id`, [
      authorize("TYWIN", "DAENERYS"),
      this.validateId,
      this.delete
    ]);
    applycation.get(`${this.basePath}/:id/listSeal`, [
      authorize("TYWIN", "DAENERYS", 'STARK', 'TULLY'),
      this.validateId,
      this.findSeal
    ]);
    applycation.put(`${this.basePath}/:id/listSeal`, [
      authorize("TYWIN", "DAENERYS"),
      this.validateId,
      this.replaceSeal
    ]);


  }
}

export const volumesRouter = new VolumesRouter();
