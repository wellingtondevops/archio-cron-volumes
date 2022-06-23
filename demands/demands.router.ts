import { ModelRouter } from '../common/model-router'
import * as restify from 'restify'
import { NotFoundError, MethodNotAllowedError } from 'restify-errors'
import * as mongoose from 'mongoose'
import { authorize } from '../security/authz.handler'
import { Demand } from './demands.model';
import { User } from '../users/users.model'
import { Company } from '../companies/companies.model'
import { Archive } from '../archives/archives.model'
import { Volume } from '../volumes/volumes.model';
import { Departament } from '../departaments/departaments.model'
import { Doct } from '../docts/docts.model'
import { archivesRouter } from '../archives/archives.router';
import * as moment from 'moment-timezone'
import { CompanyService } from '../companyservices/companyservices.model'
import { changeKeyObjects } from '../utils/convertObjets'
import { removeDuplicates } from '../utils/uniqueObjects'




class DemandsRouter extends ModelRouter<Demand>{

  constructor() {
    super(Demand)
  }

  protected prepareOne(query: mongoose.DocumentQuery<Demand, Demand>): mongoose.DocumentQuery<Demand, Demand> {
    return query
      .populate('company', 'name')
      .populate('author', 'name')
      .populate('requester', 'name email')
    // .populate('itens.archive', 'tag')
  }

  envelop(document) {
    let resource = super.envelope(document)
    resource._links.demand = `${this.basePath}/${resource._id}`
    return resource

  }
  saveDemand = async (req, resp, next) => {

    try {
      let _nr = await Demand.findOne({ mailSignup: req.authenticated.mailSignup, }).sort({ demandDate: -1 })
      if (_nr === null) {

        let document = new this.model({
          rn: 1,
          company: req.body.company,
          requester: req.body.requester,
          author: req.authenticated._id,
          mailSignup: req.authenticated.mailSignup,
          loan: req.body.loan || false,
          low: req.body.low || false,
          withdraw: req.body.withdraw || false,
          delivery: req.body.delivery || false,
          moveArchive: req.body.moveArchive || false,
          moveVolume: req.body.moveVolume || false,
          emergency: req.body.emergency || false,
          normal: req.body.normal || false,
          demandDate: Date.now(),
          processed: req.body.processed || false,
          processedDate: req.body.processedDate,
        })
        document.save()
          .then(this.render(resp, next))
          .catch(next)

      } else {
        let addNr = Number(_nr.nr) + 1
        let document = new this.model({
          nr: addNr || 1,
          company: req.body.company,
          requester: req.body.requester,
          author: req.authenticated._id,
          mailSignup: req.authenticated.mailSignup,
          loan: req.body.loan || false,
          low: req.body.low || false,
          withdraw: req.body.withdraw || false,
          delivery: req.body.delivery || false,
          moveArchive: req.body.moveArchive || false,
          moveVolume: req.body.moveVolume || false,
          emergency: req.body.emergency || false,
          normal: req.body.normal || false,
          demandDate: Date.now(),
          processed: req.body.processed || false,
          processedDate: req.body.processedDate,
          itens: []
        })
        document.save()
          .then(this.render(resp, next))
          .catch(next)

      }
    } catch (e) {
      console.log(e)
    }
  }
  show = (req, resp, next) => {
    this.prepareOne(this.model.findById(req.params.id))
      .select("company requester author demandDate processedDate processed title demand normal emergency moveVolume moveArchive digital delivery withdraw low loan nr itens moveVolume moveArchive servicesDemand totalValueDemand")
      .populate("company", "name adress province city fone")
      .then(this.render(resp, next))
      .catch(next)
  }
  registrationDemands = async (req, resp, next) => {

    const dateAction = Date.now()

    try {

      const data = await Demand.findById(req.params.id)

      if (req.body.itens.length === 0) {
        return next(new MethodNotAllowedError(`POR FAVOR SELECIONE UM REGISTRO!`))
      } else {
        if (data.moveArchive === false) {
          try {
            let volumes = req.body.itens
            for (let i = 0; volumes.length > i; i++) {

              let _vtype = await Volume.find({ _id: volumes[i] })
              let vtype = _vtype.map(el => { return el.volumeType }).toString()
              let nv = _vtype.map(el => { return el.location }).toString()
              Demand.update({ _id: req.params.id },
                {
                  $addToSet:
                  {
                    itens:
                    {
                      isMovVolum: true,
                      moveArchive: false,
                      company: data.company,
                      volume: volumes[i],
                      location: nv,
                      volumeType: vtype,
                    }

                  }
                }).then(async any =>
                  await Volume.update({ _id: volumes[i] }, {
                    $set: {
                      indDemand: true,
                      demand: req.params.id
                    }
                  })
                ).then(
                  await Archive.updateMany({ volume: volumes[i] }, { $set: { demand: req.params.id, indDemand: true } }, function (err, res) {
                    if (err) throw err;
                    console.log("document(s) updated")
                  })
                ).catch()
              await Archive.updateMany({ volume: volumes[i] }, { $addToSet: { demands: { demand: req.params.id, dateDemands: dateAction } } }, function (err, res) {
                if (err) throw err;
                console.log("Arquivos devolvidos e atualizados")
              })
              await Volume.updateMany({ _id: volumes[i] }, { $addToSet: { demands: { demand: req.params.id, dateDemands: dateAction } } }, function (err, res) {
                if (err) throw err;
                console.log("Volumes devolvidos e atualizados")
              })

            }

            resp.send({ message: "Volumes Solicitados com suscesso!" })

          } catch (e) {

            console.log("Erro na Movimentação de Volumes-->", e)

          }



        } else {


          let arcIds = req.body.itens

          let geralVol = []

          for (let i = 0; arcIds.length > i; i++) {

            let archive = await Archive.find({ _id: arcIds[i] })
            let archObjTag = archive.map(el => { return el.tag }).toString()
            let archObjVol = archive.map(el => { return el.volume }).toString()
            let objlocation = await Volume.find({ _id: archObjVol })
            let location = objlocation.map(el => { return el.location }).toString()
            let vType = objlocation.map(el => { return el.volumeType }).toString()

            geralVol.push(objlocation.map(el => { return el._id }).toString())

            await Demand.update({ _id: req.params.id },
              {
                $addToSet:
                {
                  itens:
                  {
                    isMovVolum: false,
                    isMovArchive: true,
                    company: data.company,
                    volume: archObjVol,
                    location: location,
                    volumeType: vType,
                    archive: arcIds[i],
                    tagArchive: archObjTag
                  }
                }
              }).then(async any =>
                await Archive.update({ _id: arcIds[i] }, {
                  $set: {
                    indDemand: true,
                    demand: req.params.id
                  }
                })
              ).catch()

            await Archive.update({ _id: arcIds[i] }, { $addToSet: { demands: { demand: req.params.id, dateDemands: dateAction } } })
          }


          // const newArraVolumes =[...new Set(geralVol)]


          resp.send({ message: "Arquivos Solicitados com suscesso!" })
        }
      }

    } catch (e) {

      console.log(e)

    }


  }
  filter = async (req, resp, next) => {


    let page = parseInt(req.query._page || 1);
    let Size = parseInt(req.query.size || 10);
    this.pageSize = Size;
    page += 1;
    const skip = (page - 1) * this.pageSize;


    try {
      let nR = undefined
      let D = undefined
      let P = undefined
      const user = req.body.name || undefined;

      if (req.body.nr === "") {
        nR = undefined
      } else {
        nR = req.body.nr
      }
      if (req.body.demand === false) {
        D = undefined
      } else {
        D = req.body.demand
      }
      if (req.body.processed === false) {
        P = undefined
      } else {
        P = req.body.processed
      }

      const filters = []
      let c = {}
      let n = {}
      let r = {}
      let d = {}
      let p = {}

      let _initDate = req.body.initDate || "1900-01-01";
      let _endDate = req.body.endDate || "2900-01-01";

      let initDate = new Date(_initDate)
      const t = 1
      let __endDate = new Date(_endDate)
      let endDate = __endDate.setDate(__endDate.getDate() + 1)


      let dateQueryDemand = {
        demandDate: {
          $gte: initDate,
          $lte: endDate
        }
      }
      filters.push(dateQueryDemand)


      let dateQueryProcess = {
        demandDate: {
          $gte: initDate,
          $lte: endDate
        }
      }
      filters.push(dateQueryProcess)


      if (nR !== undefined) {
        n = { nr: nR }
        filters.push(n)
      } if (req.body.company !== undefined) {
        c = { company: req.body.company }
        filters.push(c)


        filters.push(r)
      } if (D !== undefined) {
        d = { demand: D }
        filters.push(d)
      } if (P !== undefined) {
        p = { processed: P }
        filters.push(p)
      }




      if (user === undefined) {

        Demand

          .count(Demand.find({
            mailSignup: req.authenticated.mailSignup, $and: filters
          })).exec()
          .then(count => Demand.find({
            mailSignup: req.authenticated.mailSignup, $and: filters
          })
            .select("_id nr company requester author name demandDate processedDate processed demand title moveArchive moveVolume itens")
            .populate("company", "name")
            .populate("requester", "name")
            .sort('nr')
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


      } else {

        const users = await User.find({
          mailSignup: req.authenticated.mailSignup,
          name: new RegExp(user, "ig")
        }).select("_id");
        console.log("aqui vai ter user")


        Demand

          .count(Demand.find({
            mailSignup: req.authenticated.mailSignup, $and: filters, requester: users
          })).exec()
          .then(count => Demand.find({
            mailSignup: req.authenticated.mailSignup, $and: filters, requester: users
          })
            .select("_id nr company requester author name demandDate processedDate processed demand title moveArchive moveVolume itens")
            .populate("company", "name")
            .populate("requester", "name")
            .sort('nr')
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
      }

    } catch (e) {
      console.log("message Error Search", e)
    }


  }

  deleteDemand = async (req, resp, next) => {

    try {
      let data = await Demand.find({ _id: req.params.id })
      let statusProcessed = await data.map(el => { return el.processed }).toString()
      let movType = await data.map(el => { return el.moveVolume }).toString()

      if (JSON.parse(statusProcessed) === false) {

        if (JSON.parse(movType) === true) {

          let idv = await (await Volume.find({ demand: req.params.id }).select("_id"))
          let volumes = idv.map(el => { return el._id })
          let ida = await (await Archive.find({ demand: req.params.id }).select("_id"))
          let archives = ida.map(el => { return el._id })

          for (let i = 0; volumes.length > i; i++) {

            await Volume.update({ _id: volumes[i] }, {
              $unset: {
                demand: 1,
                indDemand: 1
              }
            })
          }
          for (let x = 0; archives.length > x; x++) {

            await Archive.update({ _id: archives[x] }, {
              $unset: {
                demand: 1,
                indDemand: 1
              }
            })
          }
          await Demand.remove({ _id: req.params.id }).catch(next)

          resp.send("Solicitação Deletada Com suscesso!")

        } else {

          let ida = await (await Archive.find({ demand: req.params.id }).select("_id"))
          let archives = ida.map(el => { return el._id })

          for (let x = 0; archives.length > x; x++) {

            await Archive.update({ _id: archives[x] }, {
              $unset: {
                demand: 1,
                indDemand: 1
              }
            })
          }
          await Demand.remove({ _id: req.params.id }).catch(next)

          resp.send("Solicitação Deletada Com suscesso!")
        }
      } else {

        resp.send("Solicitação já foi processada e não pode ser Deletada")


      }

    } catch (e) {

      console.log(e)

    }
  }

  filterVolumes = async (req, resp, next) => {



    const _location = req.body.location || "";
    let _initDate = req.body.initDate || "1900-01-01";
    let _endDate = req.body.endDate || "2900-01-01";
    let initDate = new Date(_initDate)
    const t = 1
    let __endDate = new Date(_endDate)
    let endDate = __endDate.setDate(__endDate.getDate() + 1)
    const filters = req.body;


    if (req.body.departament === "") {
      const filter =
        delete filters.location &&
        delete filters.initDate &&
        delete filters.endDate;
      delete filters.departament

    }
    else {
      const filter =
        delete filters.location &&
        delete filters.initDate &&
        delete filters.endDate;
    }



    if (req.body.storehouse === "") {
      const filter =
        delete filters.location &&
        delete filters.initDate &&
        delete filters.endDate;
      delete filters.storehouse

    }
    else {
      const filter =
        delete filters.location &&
        delete filters.initDate &&
        delete filters.endDate;

    }

    if (req.body.reference === "") {
      const filter =
        delete filters.location &&
        delete filters.initDate &&
        delete filters.endDate;
      delete filters.reference

    }
    else {
      const filter =
        delete filters.location &&
        delete filters.initDate &&
        delete filters.endDate;

    }
    const recebe = _location;
    const regex = new RegExp(recebe, "ig");



    let page = parseInt(req.query._page || 1);
    let Size = parseInt(req.query.size || 10);
    this.pageSize = Size;
    page += 1;
    const skip = (page - 1) * this.pageSize;




    const demandData = await Demand.find({ "_id": req.params.id })
    let demandRequesterDate = demandData.map(el => { return el.requester }).toString()

    let user = await User.find({ _id: demandRequesterDate })
      .select("permissions.docts")
      .select("permissions.company")
      .select("profiles")
    //Id company select in this.Demand
    let companySelectDemand = demandData.map(el => { return el.company }).toString()
    // Profiles this user in Demand select
    let requesterProfiles = user.map(el => { return el.profiles }).toString()

    if (requesterProfiles === 'DAENERYS') {
      Volume.count(
        Volume.find({
          mailSignup: req.authenticated.mailSignup,
          location: regex,

          company: companySelectDemand,
          status: "ATIVO",
          $and: [
            filters,
            {
              dateCreated: {
                $gte: initDate,
                $lte: endDate
              }
            }
          ]
        })
      )
        .exec()
        .then(
          async count =>
            await Volume.find({
              mailSignup: req.authenticated.mailSignup,
              location: regex,

              company: companySelectDemand,
              status: "ATIVO",
              $and: [
                filters,
                {
                  dateCreated: {
                    $gte: initDate,
                    $lte: endDate
                  }
                }
              ]
            })
              .populate("storehouse", "name")
              .populate("company", "name")
              .populate("departament", "name")
              .populate("demand", "nr")
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
    } else {


      Volume.count(
        Volume.find({
          mailSignup: req.authenticated.mailSignup,
          location: regex,

          company: companySelectDemand,
          status: "ATIVO",
          $and: [
            filters,
            {
              dateCreated: {
                $gte: initDate,
                $lte: endDate
              }
            }
          ]
        })
      )
        .exec()
        .then(
          async count =>
            await Volume.find({
              mailSignup: req.authenticated.mailSignup,
              company: companySelectDemand,

              status: "ATIVO",
              location: regex,
              $and: [
                filters,
                {
                  dateCreated: {
                    $gte: initDate,
                    $lte: endDate
                  }
                }
              ]
            })
              .populate("storehouse", "name")
              .populate("company", "name")
              .populate("departament", "name")
              .populate("demand", "nr")
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
    }

  }

  filterArchives = async (req, resp, next) => {

    const text = req.body.search || "";
    let _initDate = req.body.initDate || "1900-01-01";
    let _endDate = req.body.endDate || "2900-01-01";
    let initDate = new Date(_initDate)
    const t = 1
    let __endDate = new Date(_endDate)
    let endDate = __endDate.setDate(__endDate.getDate() + 1)
    const _status = req.body.status || "ATIVO";
    const location = req.body.location || undefined;
    const recebe = req.body.status;
    const regex = new RegExp(recebe, "ig");
    const order = Archive.create || req.body.order;
    const filters = req.body;
    const filter = delete filters.search && delete filters.initDate;
    delete filters.endDate && delete filters.location;

    let page = parseInt(req.query._page || 1);
    let Size = parseInt(req.query.size || 50);
    this.pageSize = Size;
    page += 1;
    const skip = (page - 1) * this.pageSize;


    const demandData = await Demand.find({ "_id": req.params.id })
    let demandRequesterDate = demandData.map(el => { return el.requester }).toString()



    let user = await User.find({ _id: demandRequesterDate })
      .select("permissions.company")
      .select("permissions.docts")
      .select("profiles")

    let requesterProfiles = user.map(el => { return el.profiles }).toString() // profile do solicitante
    //Id company select in this.Demand
    let companySelectDemand = user[0].permissions.map(item => {
      return item.company;
    });
    let doctsSelectDemand = user[0].permissions.map(item => {
      return item.docts;
    });
    let doctsP = [].concat.apply([], doctsSelectDemand);  //lista de documentos do user Solicitante
    let companyP = [].concat.apply([], companySelectDemand);// lista de companhias de user Solicitantes.
    // query



    try {


      if (requesterProfiles === 'DAENERYS') {
        let demandCompany = demandData.map(el => { return el.company }).toString()


        if (text === "") {
          //---busca sem com texto em branco
          if (location === undefined) {
            Archive.count(
              Archive.find(
                {
                  mailSignup: req.authenticated.mailSignup,
                  company: demandCompany,
                  status: "ATIVO",
// <<<<<<< HEAD
                  
// =======
                  indDemand:false,
// >>>>>>> QueuesVolumesImport
                  $and: [
                    filters,
                    {
                      create: {
                        $gte: initDate,
                        $lte: endDate
                      }
                    }
                  ]
                },

              )
            )
              .exec()
              .then(
                async count =>
                  await Archive.find({
                    mailSignup: req.authenticated.mailSignup,
                    company: demandCompany,
                    status: "ATIVO",
// <<<<<<< HEAD
                    
// =======
                    indDemand:false,
// >>>>>>> QueuesVolumesImport
                    $and: [
                      filters,
                      {
                        create: {
                          $gte: initDate,
                          $lte: endDate
                        }
                      }
                    ]
                  })
                    .populate("storehouse", "name")
                    .populate("volume", "location  volumeType")
                    .populate("departament", "name")
                    .populate("author", " name email")
                    .populate("doct", "name label")
                    .populate("picture", "name page")
                    .populate("demand", "nr")
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
          } else {
            const locations = await Volume.find({
              mailSignup: req.authenticated.mailSignup,
              company: demandCompany,
              status: "ATIVO",

              location: new RegExp(location, "ig")
            }).select("_id");
            Archive.count(
              Archive.find({
                mailSignup: req.authenticated.mailSignup,
                company: demandCompany,
                status: "ATIVO",
                volume: locations,
// <<<<<<< HEAD
                
// =======
                indDemand:false,
// >>>>>>> QueuesVolumesImport
                $and: [
                  filters,

                  {
                    create: {
                      $gte: initDate,
                      $lte: endDate
                    }
                  }
                ]
              })
            )
              .exec()
              .then(
                async count =>
                  await Archive.find({
                    mailSignup: req.authenticated.mailSignup,
                    company: demandCompany,
// <<<<<<< HEAD
                    
// =======
                    indDemand:false,
// >>>>>>> QueuesVolumesImport
                    volume: locations,
                    status: "ATIVO",
                    $and: [
                      filters,

                      {
                        create: {
                          $gte: initDate,
                          $lte: endDate
                        }
                      }
                    ]
                  })
                    .populate("storehouse", "name")
                    .populate("volume", "location  volumeType")
                    .populate("departament", "name")
                    .populate("author", " name email")
                    .populate("doct", "name label")
                    .populate("picture", "name page")
                    .populate("demand", "nr")
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
          }
          //----------------------------------------------------------------------------------
        } else {

          let text2 = '"' + text.split(" ").join('" "') + '"' || ""
          // ---busca com indice preenchido
          // console.log(text2)
          if (location === undefined) {
            Archive.count(
              Archive.find(
                {
                  mailSignup: req.authenticated.mailSignup,
                  company: demandCompany,
                  status: "ATIVO",
// <<<<<<< HEAD
                  
// =======
                  indDemand:false,
// >>>>>>> QueuesVolumesImport
                  $and: [
                    filters,
                    {
                      $text: {
                        $search: text2
                      }
                    },
                    {
                      create: {
                        $gte: initDate,
                        $lte: endDate
                      }
                    }
                  ]
                },
                {
                  score: {
                    $meta: "textScore"
                  }
                }
              )
            )
              .exec()
              .then(
                async count =>
                  await Archive.find(
                    {
                      mailSignup: req.authenticated.mailSignup,
                      company: demandCompany,
                      status: "ATIVO",
// <<<<<<< HEAD
                      
// =======
                      indDemand:false,
// >>>>>>> QueuesVolumesImport
                      $and: [
                        filters,
                        {
                          $text: {
                            $search: text2
                          }
                        },
                        {
                          create: {
                            $gte: initDate,
                            $lte: endDate
                          }
                        }
                      ]
                    },
                    {
                      score: {
                        $meta: "textScore"
                      }
                    }
                  )
                    .sort({
                      score: {
                        $meta: "textScore"
                      }
                    })
                    .populate("storehouse", "name")
                    .populate("volume", "location  volumeType")
                    .populate("departament", "name")
                    .populate("author", " name email")
                    .populate("doct", "name label")
                    .populate("picture", "name page")
                    .populate("demand", "nr")
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


          } else {
            // console.log("Opa Opa opa aqui tem sim");
            const locations = await Volume.find({
              mailSignup: req.authenticated.mailSignup,
              status: "ATIVO",
              company: demandCompany,

              location: new RegExp(location, "ig")
            }).select("_id");
            Archive.count(
              Archive.find(
                {
                  mailSignup: req.authenticated.mailSignup,
                  company: demandCompany,
                  volume: locations,
// <<<<<<< HEAD
                  
// =======
                  indDemand:false,
// >>>>>>> QueuesVolumesImport
                  status: "ATIVO",
                  $and: [
                    filters,
                    {
                      $text: {
                        $search: text2
                      }
                    },
                    {
                      create: {
                        $gte: initDate,
                        $lte: endDate
                      }
                    }
                  ]
                },
                {
                  score: {
                    $meta: "textScore"
                  }
                }
              )
            )
              .exec()
              .then(
                async count =>
                  await Archive.find(
                    {
                      mailSignup: req.authenticated.mailSignup,
                      company: demandCompany,

                      volume: locations,
                      status: "ATIVO",
// <<<<<<< HEAD
                      
// =======
                      indDemand:false,
// >>>>>>> QueuesVolumesImport
                      $and: [
                        filters,
                        {
                          $text: {
                            $search: text2
                          }
                        },
                        {
                          create: {
                            $gte: initDate,
                            $lte: endDate
                          }
                        }
                      ]
                    },
                    {
                      score: {
                        $meta: "textScore"
                      }
                    }
                  )
                    .sort({
                      score: {
                        $meta: "textScore"
                      }
                    })
                    .populate("storehouse", "name")
                    .populate("volume", "location  volumeType")
                    .populate("departament", "name")
                    .populate("author", " name email")
                    .populate("doct", "name label")
                    .populate("demand", "nr")
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
            // console.log(text)
          }
        }
      } else {
        if (text === "") {
          //---busca sem com texto em branco
          if (location === undefined) {
            Archive.count(
              Archive.find(
                {
                  mailSignup: req.authenticated.mailSignup,
                  company: companyP,
                  doct: doctsP,
                  status: "ATIVO",
// <<<<<<< HEAD
                  
// =======
                  indDemand:false,
// >>>>>>> QueuesVolumesImport
                  $and: [
                    filters,
                    {
                      create: {
                        $gte: initDate,
                        $lte: endDate
                      }
                    }
                  ]
                },
                {}
              )
            )
              .exec()
              .then(
                async count =>
                  await Archive.find({
                    mailSignup: req.authenticated.mailSignup,
                    company: companyP,

                    doct: doctsP,
// <<<<<<< HEAD
                    
// =======
                    indDemand:false,
// >>>>>>> QueuesVolumesImport
                    status: "ATIVO",

                    $and: [
                      filters,
                      {
                        create: {
                          $gte: initDate,
                          $lte: endDate
                        }
                      }
                    ]
                  })
                    .populate("storehouse", "name")
                    .populate("volume", "location  volumeType")
                    .populate("departament", "name")
                    .populate("author", " name email")
                    .populate("doct", "name label")
                    .populate("picture", "name page")
                    .populate("demand", "nr")
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
          } else {

            const locations = await Volume.find({
              mailSignup: req.authenticated.mailSignup,
              company: companyP,
// <<<<<<< HEAD
              
// =======
              indDemand:false,
// >>>>>>> QueuesVolumesImport

              status: "ATIVO",
              location: new RegExp(location, "ig")
            }).select("_id");
            Archive.count(
              Archive.find({
                mailSignup: req.authenticated.mailSignup,
                company: companyP,

                doct: doctsP,
                volume: locations,
                status: "ATIVO",
// <<<<<<< HEAD
                
// =======
                indDemand:false,
// >>>>>>> QueuesVolumesImport
                $and: [
                  filters,
                  {
                    create: {
                      $gte: initDate,
                      $lte: endDate
                    }
                  }
                ]
              })
            )
              .exec()
              .then(
                async count =>
                  await Archive.find({
                    mailSignup: req.authenticated.mailSignup,
                    company: companyP,
                    doct: doctsP,
                    volume: locations,
                    status: "ATIVO",
// <<<<<<< HEAD
                    
// =======
                    indDemand:false,
// >>>>>>> QueuesVolumesImport
                    $and: [
                      filters,

                      {
                        create: {
                          $gte: initDate,
                          $lte: endDate
                        }
                      }
                    ]
                  })
                    .populate("storehouse", "name")
                    .populate("volume", "location  volumeType")
                    .populate("departament", "name")
                    .populate("author", " name email")
                    .populate("doct", "name label")
                    .populate("picture", "name page")
                    .populate("demand", "nr")
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
          }
          //----------------------------------------------------------------------------------
        } else {
          // let text2 = '"' + text.split(" ").join('"') + '"' || ""
          let text2 = '"' + text.split(" ").join('" "') + '"' || ""
          // ---busca com indice preenchido
          if (location === undefined) {

            Archive.count(
              Archive.find(
                {
                  mailSignup: req.authenticated.mailSignup,
                  company: companyP,
                  doct: doctsP,
                  status: "ATIVO",
// <<<<<<< HEAD
                  
// =======
                  indDemand:false,
// >>>>>>> QueuesVolumesImport
                  $and: [
                    filters,
                    {
                      $text: {
                        $search: text2,
                      }
                    },
                    {
                      create: {
                        $gte: initDate,
                        $lte: endDate
                      }
                    }
                  ]
                },
                {
                  score: {
                    $meta: "textScore"
                  }
                }
              )
            )
              .exec()
              .then(
                async count =>
                  await Archive.find(
                    {
                      mailSignup: req.authenticated.mailSignup,
                      company: companyP,
                      doct: doctsP,
                      status: "ATIVO",
// <<<<<<< HEAD
                      
// =======
                      indDemand:false,
// >>>>>>> QueuesVolumesImport
                      $and: [
                        filters,
                        {
                          $text: {
                            $search: text2
                          }
                        },
                        {
                          create: {
                            $gte: initDate,
                            $lte: endDate
                          }
                        }
                      ]
                    },
                    {
                      score: {
                        $meta: "textScore"
                      }
                    }
                  )
                    .sort({
                      score: {
                        $meta: "textScore"
                      }
                    })
                    .populate("storehouse", "name")
                    .populate("volume", "location  volumeType")
                    .populate("departament", "name")
                    .populate("author", " name email")
                    .populate("doct", "name label")
                    .populate("picture", "name page")
                    .populate("demand", "nr")
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
            // console.log(text)
          } else {

            const locations = await Volume.find({
              mailSignup: req.authenticated.mailSignup,
              company: companyP,
              status: "ATIVO",
              location: new RegExp(location, "ig")
            }).select("_id");
            Archive.count(
              Archive.find(
                {
                  mailSignup: req.authenticated.mailSignup,
                  company: companyP,
                  doct: doctsP,
                  status: "ATIVO",
                  volume: locations,
// <<<<<<< HEAD
                  
// =======
                  indDemand:false,
// >>>>>>> QueuesVolumesImport
                  $and: [
                    filters,
                    {
                      $text: {
                        $search: text2
                      }
                    },
                    {
                      create: {
                        $gte: initDate,
                        $lte: endDate
                      }
                    }
                  ]
                },
                {
                  score: {
                    $meta: "textScore"
                  }
                }
              )
            )
              .exec()
              .then(
                async count =>
                  await Archive.find(
                    {
                      mailSignup: req.authenticated.mailSignup,
                      company: companyP,
                      doct: doctsP,
                      status: "ATIVO",
                      volume: locations,
// <<<<<<< HEAD
                      
// =======
                      indDemand:false,
// >>>>>>> QueuesVolumesImport
                      $and: [
                        filters,
                        {
                          $text: {
                            $search: text2
                          }
                        },
                        {
                          create: {
                            $gte: initDate,
                            $lte: endDate
                          }
                        }
                      ]
                    },
                    {
                      score: {
                        $meta: "textScore"
                      }
                    }
                  )
                    .sort({
                      score: {
                        $meta: "textScore"
                      }
                    })
                    .populate("storehouse", "name")
                    .populate("volume", "location  volumeType")
                    .populate("departament", "name")
                    .populate("author", " name email")
                    .populate("doct", "name label")
                    .populate("picture", "name page")
                    .populate("demand", "nr")
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
          }
        }
      }
    } catch (error) {
      // console.log("erro Interno ----------")
      resp.send(error)
    }

  }

  listDepartaments = async (req, resp, next) => {


    let page = parseInt(req.query._page || 1);
    let Size = parseInt(req.query.size || 50);
    this.pageSize = Size;
    page += 1;
    const skip = (page - 1) * this.pageSize;

    const demandData = await Demand.find({ "_id": req.params.id })

    //Id company select in this.Demand
    let companySelectDemand = demandData.map(el => { return el.company }).toString()


    Departament.find({
      mailSignup: req.authenticated.mailSignup,
      company: companySelectDemand
      // company:req.authenticated.company

    }).select('name')
      .populate('company', 'name')
      .sort('name')
      .then(this.renderAll(resp, next))
      .catch(next)







  }
  listDocuments = async (req, resp, next) => {

    let page = parseInt(req.query._page || 1);
    let Size = parseInt(req.query.size || 50);
    this.pageSize = Size;
    page += 1;
    const skip = (page - 1) * this.pageSize;

    const demandData = await Demand.find({ "_id": req.params.id })
    let demandRequesterDate = demandData.map(el => { return el.requester }).toString()

    let user = await User.find({ _id: demandRequesterDate })
      .select("permissions.company")
      .select("permissions.docts")
      .select("profiles")

    let requesterProfiles = user.map(el => { return el.profiles }).toString() // profile do solicitante
    //Id company select in this.Demand

    let doctsSelectDemand = user[0].permissions.map(item => {
      return item.docts;
    });
    let doctsP = [].concat.apply([], doctsSelectDemand);  //lista de documentos do user Solicitante


    let companySelectDemand = demandData.map(el => { return el.company }).toString()



    if (requesterProfiles === 'DAENERYS') {
      Doct.find({
        mailSignup: req.authenticated.mailSignup,
        company: companySelectDemand,

      })
        .select("name")
        .sort('name')
        .populate("company", "name")
        .then(this.renderAll(resp, next))
        .catch(next);
    } else {
      Doct.find({
        mailSignup: req.authenticated.mailSignup,
        _id: doctsP,
        company: companySelectDemand
      })
        .select("name")
        .sort('name')
        .populate("company", "name")
        .then(this.renderAll(resp, next))
        .catch(next);
    }
  }
  showItensVolumes = async (req, resp, next) => {

    const _location = req.body.location || "";
    let _initDate = req.body.initDate || "1900-01-01";
    let _endDate = req.body.endDate || "2900-01-01";
    let initDate = new Date(_initDate)
    const t = 1
    let __endDate = new Date(_endDate)
    let endDate = __endDate.setDate(__endDate.getDate() + 1)
    const filters = req.body;



    if (req.body.departament === "") {
      const filter =
        delete filters.location &&
        delete filters.initDate &&
        delete filters.endDate;
      delete filters.departament

    }
    else {
      const filter =
        delete filters.location &&
        delete filters.initDate &&
        delete filters.endDate;
    }



    if (req.body.storehouse === "") {
      const filter =
        delete filters.location &&
        delete filters.initDate &&
        delete filters.endDate;
      delete filters.storehouse

    }
    else {
      const filter =
        delete filters.location &&
        delete filters.initDate &&
        delete filters.endDate;

    }

    if (req.body.reference === "") {
      const filter =
        delete filters.location &&
        delete filters.initDate &&
        delete filters.endDate;
      delete filters.reference

    }
    else {
      const filter =
        delete filters.location &&
        delete filters.initDate &&
        delete filters.endDate;

    }
    const recebe = _location;
    const regex = new RegExp(recebe, "ig");


    let page = parseInt(req.query._page || 0);
    let Size = parseInt(req.query.size || 1000000);
    this.pageSize = Size;
    page += 1;
    const skip = (page - 1) * this.pageSize;

    const demandData = await Demand.find({ "_id": req.params.id })

      .select("requester")
      .select("company")
    let demandRequesterDate = demandData.map(el => { return el.requester }).toString()

    let user = await User.find({ _id: demandRequesterDate })
    //Id company select in this.Demand
    let companySelectDemand = demandData.map(el => { return el.company }).toString()
    let requesterProfiles = user.map(el => { return el.profiles }).toString()

    if (requesterProfiles === 'DAENERYS') {
      Volume.count(
        Volume.find({
          mailSignup: req.authenticated.mailSignup,
          location: regex,
          company: companySelectDemand,
          "demands.demand": req.params.id,
          $and: [
            filters,
            {
              dateCreated: {
                $gte: initDate,
                $lte: endDate
              }
            }
          ]
        })
      )
        .exec()
        .then(
          async count =>
            await Volume.find({
              mailSignup: req.authenticated.mailSignup,
              location: regex,
              company: companySelectDemand,
              "demands.demand": req.params.id,
              $and: [
                filters,
                {
                  dateCreated: {
                    $gte: initDate,
                    $lte: endDate
                  }
                }
              ]
            })
              .populate("storehouse", "name")
              .populate("company", "name")
              .populate("departament", "name")
              .populate("demand", "nr")
              .populate({ path: 'loans.demand', match: { _id: { $eq: req.params.id } }, options: { limit: 1 }, select: 'nr dateLoan' })
              .populate({ path: 'devolutions.demand', match: { _id: { $eq: req.params.id } }, options: { limit: 1 }, select: 'nr dateDevolution' })
              .populate({ path: 'lows.demand', match: { _id: { $eq: req.params.id } }, options: { limit: 1 }, select: 'nr dateLow', })
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
    } else {
      Volume.count(
        Volume.find({
          mailSignup: req.authenticated.mailSignup,
          location: regex,
          company: companySelectDemand,
          "demands.demand": req.params.id,
          $and: [
            filters,
            {
              dateCreated: {
                $gte: initDate,
                $lte: endDate
              }
            }
          ]
        })
      )
        .exec()
        .then(
          async count =>
            await Volume.find({
              mailSignup: req.authenticated.mailSignup,
              company: companySelectDemand,
              location: regex,
              "demands.demand": req.params.id,
              $and: [
                filters,
                {
                  dateCreated: {
                    $gte: initDate,
                    $lte: endDate
                  }
                }
              ]
            })
              .populate("storehouse", "name")
              .populate("company", "name")
              .populate("departament", "name")
              .populate("demand", "nr")
              .populate({ path: 'loans.demand', match: { _id: { $eq: req.params.id } }, options: { limit: 1 }, select: 'nr dateLoan' })
              .populate({ path: 'devolutions.demand', match: { _id: { $eq: req.params.id } }, options: { limit: 1 }, select: 'nr dateDevolution' })
              .populate({ path: 'lows.demand', match: { _id: { $eq: req.params.id } }, options: { limit: 1 }, select: 'nr dateLow', })
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
    }





  }
  showItensArchives = async (req, resp, next) => {


    const text = req.body.search || "";
    let _initDate = req.body.initDate || "1900-01-01";
    let _endDate = req.body.endDate || "2900-01-01";

    let initDate = new Date(_initDate)
    const t = 1
    let __endDate = new Date(_endDate)
    let endDate = __endDate.setDate(__endDate.getDate() + 1)

    const _status = req.body.status || "ATIVO";
    const location = req.body.location || undefined;
    const recebe = req.body.status;
    const regex = new RegExp(recebe, "ig");
    const order = Archive.create || req.body.order;
    const filters = req.body;
    const filter = delete filters.search && delete filters.initDate;
    delete filters.endDate && delete filters.location;

    let page = parseInt(req.query._page || 0);
    let Size = parseInt(req.query.size || 1000000);
    this.pageSize = Size;
    page += 1;
    const skip = (page - 1) * this.pageSize;

    const demandData = await Demand.find({ "_id": req.params.id })

      .select("requester")
      .select("company")
    let demandRequesterDate = demandData.map(el => { return el.requester }).toString()

    let user = await User.find({ _id: demandRequesterDate })

    //Id company select in this.Demand
    let companySelectDemand = demandData.map(el => { return el.company }).toString()
    // Profiles this user in Demand select
    let requesterProfiles = user.map(el => { return el.profiles }).toString()




    try {




      if (requesterProfiles === 'DAENERYS') {
        let demandCompany = demandData.map(el => { return el.company }).toString()


        if (text === "") {
          //---busca sem com texto em branco
          if (location === undefined) {
            Archive.count(
              Archive.find(
                {
                  mailSignup: req.authenticated.mailSignup,
                  company: companySelectDemand,
                  "demands.demand": req.params.id,
                  $and: [
                    filters,
                    {
                      create: {
                        $gte: initDate,
                        $lte: endDate
                      }
                    }
                  ]
                },
                {}
              )
            )
              .exec()
              .then(
                async count =>
                  await Archive.find({
                    mailSignup: req.authenticated.mailSignup,
                    company: companySelectDemand,
                    "demands.demand": req.params.id,

                    $and: [
                      filters,
                      {
                        create: {
                          $gte: initDate,
                          $lte: endDate
                        }
                      }
                    ]
                  })
                    .populate("storehouse", "name")
                    .populate("volume", "location  volumeType")
                    .populate("departament", "name")
                    .populate("author", " name email")
                    .populate("doct", "name label")
                    .populate("picture", "name page")
                    .populate({ path: 'loans.demand', match: { _id: { $eq: req.params.id } }, options: { limit: 1 }, select: 'nr dateLoan' })
                    .populate({ path: 'devolutions.demand', match: { _id: { $eq: req.params.id } }, options: { limit: 1 }, select: 'nr dateDevolution' })
                    .populate({ path: 'lows.demand', match: { _id: { $eq: req.params.id } }, options: { limit: 1 }, select: 'nr dateLow', })
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
          } else {
            const locations = await Volume.find({
              mailSignup: req.authenticated.mailSignup,
              company: companySelectDemand,
              location: new RegExp(location, "ig")
            }).select("_id");
            Archive.count(
              Archive.find({
                mailSignup: req.authenticated.mailSignup,
                company: companySelectDemand,
                "demands.demand": req.params.id,

                volume: locations,
                $and: [
                  filters,

                  {
                    create: {
                      $gte: initDate,
                      $lte: endDate
                    }
                  }
                ]
              })
            )
              .exec()
              .then(
                async count =>
                  await Archive.find({
                    mailSignup: req.authenticated.mailSignup,
                    company: companySelectDemand,
                    volume: locations,
                    "demands.demand": req.params.id,

                    $and: [
                      filters,

                      {
                        create: {
                          $gte: initDate,
                          $lte: endDate
                        }
                      }
                    ]
                  })
                    .populate("storehouse", "name")
                    .populate("volume", "location  volumeType")
                    .populate("departament", "name")
                    .populate("author", " name email")
                    .populate("doct", "name label")
                    .populate("picture", "name page")
                    .populate({ path: 'loans.demand', match: { _id: { $eq: req.params.id } }, options: { limit: 1 }, select: 'nr dateLoan' })
                    .populate({ path: 'devolutions.demand', match: { _id: { $eq: req.params.id } }, options: { limit: 1 }, select: 'nr dateDevolution' })
                    .populate({ path: 'lows.demand', match: { _id: { $eq: req.params.id } }, options: { limit: 1 }, select: 'nr dateLow', })
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
          }
          //----------------------------------------------------------------------------------
        } else {

          let text2 = '"' + text.split(" ").join('" "') + '"' || ""
          // ---busca com indice preenchido
          // console.log(text2)
          if (location === undefined) {
            Archive.count(
              Archive.find(
                {
                  mailSignup: req.authenticated.mailSignup,
                  company: companySelectDemand,
                  "demands.demand": req.params.id,

                  $and: [
                    filters,
                    {
                      $text: {
                        $search: text2
                      }
                    },
                    {
                      create: {
                        $gte: initDate,
                        $lte: endDate
                      }
                    }
                  ]
                },
                {
                  score: {
                    $meta: "textScore"
                  }
                }
              )
            )
              .exec()
              .then(
                async count =>
                  await Archive.find(
                    {
                      mailSignup: req.authenticated.mailSignup,
                      company: companySelectDemand,
                      "demands.demand": req.params.id,

                      $and: [
                        filters,
                        {
                          $text: {
                            $search: text2
                          }
                        },
                        {
                          create: {
                            $gte: initDate,
                            $lte: endDate
                          }
                        }
                      ]
                    },
                    {
                      score: {
                        $meta: "textScore"
                      }
                    }
                  )
                    .sort({
                      score: {
                        $meta: "textScore"
                      }
                    })
                    .populate("storehouse", "name")
                    .populate("volume", "location  volumeType")
                    .populate("departament", "name")
                    .populate("author", " name email")
                    .populate("doct", "name label")
                    .populate("picture", "name page")
                    .populate({ path: 'loans.demand', match: { _id: { $eq: req.params.id } }, options: { limit: 1 }, select: 'nr dateLoan' })
                    .populate({ path: 'devolutions.demand', match: { _id: { $eq: req.params.id } }, options: { limit: 1 }, select: 'nr dateDevolution' })
                    .populate({ path: 'lows.demand', match: { _id: { $eq: req.params.id } }, options: { limit: 1 }, select: 'nr dateLow', })
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


          } else {
            // console.log("Opa Opa opa aqui tem sim");
            const locations = await Volume.find({
              mailSignup: req.authenticated.mailSignup,
              company: companySelectDemand,
              location: new RegExp(location, "ig"),

            }).select("_id");
            Archive.count(
              Archive.find(
                {
                  mailSignup: req.authenticated.mailSignup,
                  company: companySelectDemand,
                  volume: locations,
                  "demands.demand": req.params.id,

                  $and: [
                    filters,
                    {
                      $text: {
                        $search: text2
                      }
                    },
                    {
                      create: {
                        $gte: initDate,
                        $lte: endDate
                      }
                    }
                  ]
                },
                {
                  score: {
                    $meta: "textScore"
                  }
                }
              )
            )
              .exec()
              .then(
                async count =>
                  await Archive.find(
                    {
                      mailSignup: req.authenticated.mailSignup,
                      company: companySelectDemand,
                      volume: locations,
                      "demands.demand": req.params.id,

                      $and: [
                        filters,
                        {
                          $text: {
                            $search: text2
                          }
                        },
                        {
                          create: {
                            $gte: initDate,
                            $lte: endDate
                          }
                        }
                      ]
                    },
                    {
                      score: {
                        $meta: "textScore"
                      }
                    }
                  )
                    .sort({
                      score: {
                        $meta: "textScore"
                      }
                    })
                    .populate("storehouse", "name")
                    .populate("volume", "location  volumeType")
                    .populate("departament", "name")
                    .populate("author", " name email")
                    .populate("doct", "name label")
                    .populate({ path: 'loans.demand', match: { _id: { $eq: req.params.id } }, options: { limit: 1 }, select: 'nr dateLoan' })
                    .populate({ path: 'devolutions.demand', match: { _id: { $eq: req.params.id } }, options: { limit: 1 }, select: 'nr dateDevolution' })
                    .populate({ path: 'lows.demand', match: { _id: { $eq: req.params.id } }, options: { limit: 1 }, select: 'nr dateLow', })
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
            // console.log(text)
          }
        }
      } else {
        if (text === "") {
          //---busca sem com texto em branco
          if (location === undefined) {
            Archive.count(
              Archive.find(
                {
                  mailSignup: req.authenticated.mailSignup,
                  company: companySelectDemand,
                  "demands.demand": req.params.id,

                  $and: [
                    filters,
                    {
                      create: {
                        $gte: initDate,
                        $lte: endDate
                      }
                    }
                  ]
                },
                {}
              )
            )
              .exec()
              .then(
                async count =>
                  await Archive.find({
                    mailSignup: req.authenticated.mailSignup,
                    company: companySelectDemand,
                    "demands.demand": req.params.id,

                    $and: [
                      filters,
                      {
                        create: {
                          $gte: initDate,
                          $lte: endDate
                        }
                      }
                    ]
                  })
                    .populate("storehouse", "name")
                    .populate("volume", "location  volumeType")
                    .populate("departament", "name")
                    .populate("author", " name email")
                    .populate("doct", "name label")
                    .populate("picture", "name page")
                    .populate({ path: 'loans.demand', match: { _id: { $eq: req.params.id } }, options: { limit: 1 }, select: 'nr dateLoan' })
                    .populate({ path: 'devolutions.demand', match: { _id: { $eq: req.params.id } }, options: { limit: 1 }, select: 'nr dateDevolution' })
                    .populate({ path: 'lows.demand', match: { _id: { $eq: req.params.id } }, options: { limit: 1 }, select: 'nr dateLow', })
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
          } else {

            const locations = await Volume.find({
              mailSignup: req.authenticated.mailSignup,
              company: companySelectDemand,
              location: new RegExp(location, "ig")
            }).select("_id");
            Archive.count(
              Archive.find({
                mailSignup: req.authenticated.mailSignup,
                company: companySelectDemand,
                "demands.demand": req.params.id,

                volume: locations,
                $and: [
                  filters,
                  {
                    create: {
                      $gte: initDate,
                      $lte: endDate
                    }
                  }
                ]
              })
            )
              .exec()
              .then(
                async count =>
                  await Archive.find({
                    mailSignup: req.authenticated.mailSignup,
                    company: companySelectDemand,
                    "demands.demand": req.params.id,

                    volume: locations,
                    status: "ATIVO",
                    $and: [
                      filters,

                      {
                        create: {
                          $gte: initDate,
                          $lte: endDate
                        }
                      }
                    ]
                  })
                    .populate("storehouse", "name")
                    .populate("volume", "location  volumeType")
                    .populate("departament", "name")
                    .populate("author", " name email")
                    .populate("doct", "name label")
                    .populate("picture", "name page")
                    .populate({ path: 'loans.demand', match: { _id: { $eq: req.params.id } }, options: { limit: 1 }, select: 'nr dateLoan' })
                    .populate({ path: 'devolutions.demand', match: { _id: { $eq: req.params.id } }, options: { limit: 1 }, select: 'nr dateDevolution' })
                    .populate({ path: 'lows.demand', match: { _id: { $eq: req.params.id } }, options: { limit: 1 }, select: 'nr dateLow', })
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
          }
          //----------------------------------------------------------------------------------
        } else {
          // let text2 = '"' + text.split(" ").join('"') + '"' || ""
          let text2 = '"' + text.split(" ").join('" "') + '"' || ""
          // ---busca com indice preenchido
          if (location === undefined) {

            Archive.count(
              Archive.find(
                {
                  mailSignup: req.authenticated.mailSignup,
                  company: companySelectDemand,
                  "demands.demand": req.params.id,

                  status: "ATIVO",
                  $and: [
                    filters,
                    {
                      $text: {
                        $search: text2,
                      }
                    },
                    {
                      create: {
                        $gte: initDate,
                        $lte: endDate
                      }
                    }
                  ]
                },
                {
                  score: {
                    $meta: "textScore"
                  }
                }
              )
            )
              .exec()
              .then(
                async count =>
                  await Archive.find(
                    {
                      mailSignup: req.authenticated.mailSignup,
                      company: companySelectDemand,
                      "demands.demand": req.params.id,

                      $and: [
                        filters,
                        {
                          $text: {
                            $search: text2
                          }
                        },
                        {
                          create: {
                            $gte: initDate,
                            $lte: endDate
                          }
                        }
                      ]
                    },
                    {
                      score: {
                        $meta: "textScore"
                      }
                    }
                  )
                    .sort({
                      score: {
                        $meta: "textScore"
                      }
                    })
                    .populate("storehouse", "name")
                    .populate("volume", "location  volumeType")
                    .populate("departament", "name")
                    .populate("author", " name email")
                    .populate("doct", "name label")
                    .populate("picture", "name page")
                    .populate({ path: 'loans.demand', match: { _id: { $eq: req.params.id } }, options: { limit: 1 }, select: 'nr dateLoan' })
                    .populate({ path: 'devolutions.demand', match: { _id: { $eq: req.params.id } }, options: { limit: 1 }, select: 'nr dateDevolution' })
                    .populate({ path: 'lows.demand', match: { _id: { $eq: req.params.id } }, options: { limit: 1 }, select: 'nr dateLow', })
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
            // console.log(text)
          } else {

            const locations = await Volume.find({
              mailSignup: req.authenticated.mailSignup,
              company: companySelectDemand,
              location: new RegExp(location, "ig")
            }).select("_id");
            Archive.count(
              Archive.find(
                {
                  mailSignup: req.authenticated.mailSignup,
                  company: companySelectDemand,
                  "demands.demand": req.params.id,

                  volume: locations,
                  $and: [
                    filters,
                    {
                      $text: {
                        $search: text2
                      }
                    },
                    {
                      create: {
                        $gte: initDate,
                        $lte: endDate
                      }
                    }
                  ]
                },
                {
                  score: {
                    $meta: "textScore"
                  }
                }
              )
            )
              .exec()
              .then(
                async count =>
                  await Archive.find(
                    {
                      mailSignup: req.authenticated.mailSignup,
                      company: companySelectDemand,
                      "demands.demand": req.params.id,

                      volume: locations,
                      $and: [
                        filters,
                        {
                          $text: {
                            $search: text2
                          }
                        },
                        {
                          create: {
                            $gte: initDate,
                            $lte: endDate
                          }
                        }
                      ]
                    },
                    {
                      score: {
                        $meta: "textScore"
                      }
                    }
                  )
                    .sort({
                      score: {
                        $meta: "textScore"
                      }
                    })
                    .populate("storehouse", "name")
                    .populate("volume", "location  volumeType")
                    .populate("departament", "name")
                    .populate("author", " name email")
                    .populate("doct", "name label")
                    .populate("picture", "name page")
                    .populate({ path: 'loans.demand', match: { _id: { $eq: req.params.id } }, options: { limit: 1 }, select: 'nr dateLoan' })
                    .populate({ path: 'devolutions.demand', match: { _id: { $eq: req.params.id } }, options: { limit: 1 }, select: 'nr dateDevolution' })
                    .populate({ path: 'lows.demand', match: { _id: { $eq: req.params.id } }, options: { limit: 1 }, select: 'nr dateLow', })
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
          }
        }
      }
    } catch (error) {
      // console.log("erro Interno ----------")
      resp.send(error)
    }

  }
  companyName = async (req, resp, next) => {


    const demandData = await await Demand.find({ "_id": req.params.id })
      .select("company")

    let companySelectDemand = demandData.map(el => { return el.company })

    Company.find({
      mailSignup: req.authenticated.mailSignup,
      _id: companySelectDemand
    })
      .select("name")
      .populate("company", "name")
      .then(this.renderAll(resp, next))
      .catch(next);

  }
  removeItensDemand = async (req, resp, next) => {

    const data = await Demand.findById(req.params.id)

    console.log(req.body)

    if (data.moveArchive === false) {

      //Remoção de Volumes e Arquivos

      let volumes = req.body.itens

      for (let i = 0; volumes.length > i; i++) {

        await Demand.update(
          {
            _id: req.params.id
          },
          {
            $pull: {
              itens: {
                volume: volumes[i]
              }
            }
          }
        ).then(
          await Volume.updateMany({ _id: volumes[i] }, {

            $unset: {
              demand: 1,
              indDemand: 1
            },

            $pull: {
              demands: {
                demand: req.params.id
              },

            }
          }, function (err, res) {
            if (err) throw err;
            console.log("document(s) updated")
          })
        ).catch(next)

          .then(
            await Archive.updateMany({ volume: volumes[i] }, {

              $unset: {
                demand: 1,
                indDemand: 1
              }, $pull: {
                demands: {
                  demand: req.params.id
                }
              }

            }, function (err, res) {
              if (err) throw err;
              console.log("document(s) updated")
            })
          ).catch(next)
      }
    } else {
      //Remoção de arquivos
      let arcIds = req.body.itens

      for (let i = 0; arcIds.length > i; i++) {

        await Demand.update(
          {
            _id: req.params.id
          },
          {
            $pull: {
              itens: {
                archive: arcIds[i]
              }
            },


          }
        ).then(await Archive.update({
          _id: arcIds[i]
        },
          {

            $unset: {
              demand: 1,
              indDemand: 1
            }
            , $pull: {
              demands: {
                demand: req.params.id
              }
            }
          }
        )
        ).catch()
      }
    }
    resp.send({ message: "Itens removidos com suscesso" })


  }
  processMove = async (req, resp, next) => {
    const dateAction = Date.now()

    const data = await Demand.findById(req.params.id)
    let services = req.body.servicesDemand

    if (data.low === false) {     //emprestimo

      if (data.moveArchive === false) {

        //caixas

        await Archive.updateMany({ demand: req.params.id }, { $addToSet: { loans: { demand: req.params.id, dateLoan: dateAction } } }, function (err, res) {
          if (err) throw err;
          console.log(" 1 document(s) updated Archivos")
        })
        await Archive.updateMany({ demand: req.params.id }, { $set: { status: "EMPRESTADO", indDemand: false } }, function (err, res) {
          if (err) throw err;
          console.log("2 document(s) updatedArchivos")
        })

        await Volume.updateMany({ demand: req.params.id }, { $addToSet: { loans: { demand: req.params.id, dateLoan: dateAction } } }, function (err, res) {
          if (err) throw err;
          console.log(" 3 document(s) updated CAixas ")
        })
        await Volume.updateMany({ demand: req.params.id }, { $set: { status: "EMPRESTADO", indDemand: false } }, function (err, res) {
          if (err) throw err;
          console.log("4 document(s) updated CAixas")
        })


      } else {
        //arquivos

        await Archive.updateMany({ demand: req.params.id }, { $addToSet: { loans: { demand: req.params.id, dateLoan: dateAction } } }, function (err, res) {
          if (err) throw err;
          console.log(" 1 document(s) updated ")
        })
        await Archive.updateMany({ demand: req.params.id }, { $set: { status: "EMPRESTADO", indDemand: false } }, function (err, res) {
          if (err) throw err;
          console.log("2 document(s) updated")
        })

      }

    } else {
      //baixas      
      if (data.moveArchive === false) {
        //caixas

        await Archive.updateMany({ demand: req.params.id }, { $addToSet: { lows: { demand: req.params.id, dateLows: dateAction } } }, function (err, res) {
          if (err) throw err;
          console.log(" 1 document(s) updated Caixas")
        })
        await Archive.updateMany({ demand: req.params.id }, { $set: { status: "BAIXADO", indDemand: false } }, function (err, res) {
          if (err) throw err;
          console.log("2 document(s) updated Caixas")
        })
        await Volume.updateMany({ demand: req.params.id }, { $addToSet: { lows: { demand: req.params.id, dateLows: dateAction } } }, function (err, res) {
          if (err) throw err;
          console.log(" 3 document(s) updated Caixas")
        })
        await Volume.updateMany({ demand: req.params.id }, { $set: { status: "BAIXADO", indDemand: false } }, function (err, res) {
          if (err) throw err;
          console.log("4 document(s) updated Caixas")
        })




      } else {

        await Archive.updateMany({ demand: req.params.id }, { $addToSet: { lows: { demand: req.params.id, dateLows: dateAction } } }, function (err, res) {
          if (err) throw err;
          console.log(" 1 document(s) updated ")
        })
        await Archive.updateMany({ demand: req.params.id }, { $set: { status: "BAIXADO", indDemand: false } }, function (err, res) {
          if (err) throw err;
          console.log("2 document(s) updated")
        })




        // await Archive.update({
        //   demand: req.params.id
        // },
        //   {

        //     $unset: {
        //       demand: 1,
        //       indDemand: 1
        //     }
        //   }
        // )

        //arquivos

      }

    }
    /// update na demanda
    for (let service of services) {

      await Demand.update({ _id: req.params.id }, {
        $addToSet: {
          servicesDemand: {
            quantityItem: service.quantityItem,
            itemValue: service.itemValue,
            totalItem: service.totalItem,
            item: service.item
          }
        }
      })
    }



    await Volume.updateMany({
      demand: req.params.id
    },
      {

        $unset: {
          demand: 1,
          indDemand: 1
        }
      }, function (err, res) {
        if (err) throw err;
        console.log("4 document(s) updated Caixas")
      })


    await Archive.updateMany({
      demand: req.params.id
    },
      {

        $unset: {
          demand: 1,
          indDemand: 1
        }
      }, function (err, res) {
        if (err) throw err;
        console.log("4 document(s) updated Caixas")
      })



    await Demand.update({ _id: req.params.id }, {
      $set: {
        demand: false, processed: true, processedDate: dateAction,
        totalValueDemand: req.body.totalValueDemand, title: "MOVIMENTAÇÃO"
      }
    })
    resp.send({ message: "Movimentação feita com Suscesso!" })

  }
  devolutions = async (req, resp, next) => {

    const data = await Demand.findById(req.params.id)
    const _dateDevolution = req.body.dateAction
    let dateDevolution = Date.now()

    if (req.body.itens.length === 0 || _dateDevolution === "Invalid date") {
      return next(new MethodNotAllowedError(`POR FAVOR VERIFIQUE A DATA DE DEVOLUÇÃO E SE SELECIONOU AGUM ITEM!`))
    } else {
      try {
        if (data.moveArchive === false) {


          let volumes = req.body.itens
          for (let volume of volumes) {
            await Archive.updateMany({ volume: volume }, { $set: { status: "ATIVO", indDemand: false } }, function (err, res) {
              if (err) throw err;
              console.log("Arquivos devolvidos")
            })

            await Archive.updateMany({ volume: volume }, { $addToSet: { devolutions: { demand: req.params.id, dateDevolution: dateDevolution } } }, function (err, res) {
              if (err) throw err;
              console.log("Arquivos devolvidos e atualizados")
            })




            await Volume.updateMany({ _id: volume }, {

              $unset: {
                demand: 1,
                indDemand: 1
              }
            }, function (err, res) {
              if (err) throw err;
              console.log("Arquivos devolvidos e atualizados")
            })

            await Archive.updateMany({ volume: volume }, {

              $unset: {
                demand: 1,
                indDemand: 1
              }
            }, function (err, res) {
              if (err) throw err;
              console.log("Arquivos devolvidos e atualizados")
            })

            await Volume.updateMany({ _id: volume }, { $set: { status: "ATIVO", indDemand: false } }, function (err, res) {
              if (err) throw err;
              console.log("volumes devolvidos")
            })

            await Volume.updateMany({ _id: volume }, { $addToSet: { devolutions: { demand: req.params.id, dateDevolution: dateDevolution } } }, function (err, res) {
              if (err) throw err;
              console.log("volumes devolvidos e atualizados")
            })
          }
          //volume
        } else {
          let archives = req.body.itens
          // archivos
          for (let archive of archives) {
            await Archive.updateMany({ _id: archive }, { $set: { status: "ATIVO", indDemand: false } }, function (err, res) {
              if (err) throw err;
              console.log("Arquivos devolvidos")
            })

            await Archive.updateMany({ _id: archive }, { $addToSet: { devolutions: { demand: req.params.id, dateDevolution: dateDevolution } } }, function (err, res) {
              if (err) throw err;
              console.log("Arquivos devolvidos e atualizados")
            })
            await Archive.update({
              _id: archive
            },
              {

                $unset: {
                  demand: 1,
                  indDemand: 1
                }
              }
            )
          }
        }
      } catch (e) {

        console.log(e)

      }

    }


    resp.send({ "message": "Itens devolvidos com suscesso!" })

  }
  lows = async (req, resp, next) => {

    const data = await Demand.findById(req.params.id)
    const _dateLow = req.body.dateAction

    let dateLow = moment.tz(_dateLow, "DD/MM/YYYY HH:mm", 'America/Sao_Paulo')

    if (req.body.itens.length === 0 || _dateLow === "Invalid date") {
      return next(new MethodNotAllowedError(`POR FAVOR VERIFIQUE A DATA DA BAIXA E SE SELECIONOU AGUM ITEM!`))
    } else {
      try {
        if (data.moveArchive === false) {


          let volumes = req.body.itens
          for (let volume of volumes) {
            await Archive.updateMany({ volume: volume }, { $set: { status: "BAIXADO", indDemand: false } }, function (err, res) {
              if (err) throw err;
              console.log("Arquivos Baixados")
            })

            await Archive.updateMany({ volume: volume }, { $addToSet: { devolutions: { lows: req.params.id, dateLows: dateLow } } }, function (err, res) {
              if (err) throw err;
              console.log("Arquivos Baixados e atualizados")
            })





            await Volume.updateMany({ _id: volume }, {

              $unset: {
                demand: 1,
                indDemand: 1
              }
            }, function (err, res) {
              if (err) throw err;
              console.log("Arquivos devolvidos e atualizados")
            })

            await Archive.updateMany({ volume: volume }, {

              $unset: {
                demand: 1,
                indDemand: 1
              }
            }, function (err, res) {
              if (err) throw err;
              console.log("Arquivos devolvidos e atualizados")
            })
            await Volume.updateMany({ _id: volume }, { $set: { status: "BAIXADO", indDemand: false } }, function (err, res) {
              if (err) throw err;
              console.log("volumes Baixados")
            })

            await Volume.updateMany({ _id: volume }, { $addToSet: { lows: { demand: req.params.id, dateLows: dateLow } } }, function (err, res) {
              if (err) throw err;
              console.log("volumes Baixados e atualizados")
            })
          }
          //volume
        } else {
          let archives = req.body.itens
          // archivos
          for (let archive of archives) {
            await Archive.updateMany({ _id: archive }, { $set: { status: "BAIXADO", indDemand: false } }, function (err, res) {
              if (err) throw err;
              console.log("Arquivos Baixados")
            })

            await Archive.updateMany({ _id: archive }, { $addToSet: { lows: { demand: req.params.id, dateLows: dateLow } } }, function (err, res) {
              if (err) throw err;
              console.log("Arquivos Baixados e atualizados")
            })
            await Archive.update({
              _id: archive
            },
              {

                $unset: {
                  demand: 1,
                  indDemand: 1
                }
              }
            )
          }
        }
      } catch (e) {

        console.log(e)

      }

    }


    resp.send({ "message": "Itens Baixados com suscesso!" })


  }
  listServices = async (req, resp, next) => {

    const data = await Demand.findById(req.params.id)

    let dateService = await CompanyService.find({ company: data.company }).populate("services.description", "descriptionService")



    let lists = dateService.map(el => { return el.services })

    let newList = dateService.map(el => { return el.services }).pop()



    let newListP = newList.map(el => { return el.price })
    let nov = newList.map(el => { return el.description.descriptionService })



    let listServices = []


    for (let i = 0; nov.length > i && newListP.length > 1; i++) {


      let obj = {
        description: nov[i],
        price: newListP[i]
      }// aqui adiciona o id e locatin para serem pesquisados.
      listServices.push(obj)
    }




    resp.send(listServices)
  }

  countMove = async (req, resp, next) => {


    let dataItens = await Demand.find({ _id: req.params.id }).select('itens')

    const arrUnique = [...new Set(dataItens)];

    let novaArr = arrUnique.filter((volume, i) => dataItens.indexOf(volume) === i);

    let itens = novaArr.map(el => { return el.itens })

    let _itens = [].concat.apply([], itens)

    var uniqueArray = removeDuplicates(_itens, "volume");

    let types = uniqueArray.map(el => { return el.volumeType })

    let counts = {};

    for (let i = 0; i < types.length; i++) {
      let num = types[i];
      counts[num] = counts[num] ? counts[num] + 1 : 1;

    }

    let countArquivos = await Archive.find({ demands: { $elemMatch: { demand: mongoose.Types.ObjectId(req.params.id) } }, }).count()

    console.log(counts)

    let totaisMove = {
      box: counts["BOX"] || 0,
      container: counts["CONTAINER"] || 0,
      mapoteca: counts["MAPOTECA"] || 0,
      gaveta: counts["GAVETA"] || 0,
      totalArchiveMove: countArquivos || 0
    }
    resp.send(totaisMove)
  }


  applyRoutes(applycation: restify.Server) {

    applycation.post(`${this.basePath}/search`, [authorize('SNOW', 'TYWIN', 'DAENERYS'), this.filter])
    applycation.post(`${this.basePath}/:id/processMove`, [authorize('SNOW', 'TYWIN', 'DAENERYS'), this.processMove])
    applycation.get(`${this.basePath}/:id`, [authorize('DAENERYS'), this.show])
    applycation.get(`${this.basePath}/:id/listSevices`, [authorize('DAENERYS'), this.listServices])
    applycation.get(`${this.basePath}/:id/countMove`, [authorize('DAENERYS'), this.countMove])
    applycation.get(`${this.basePath}/:id/listDepartaments`, [authorize('DAENERYS'), this.listDepartaments])
    applycation.get(`${this.basePath}/:id/listDocuments`, [authorize('DAENERYS'), this.listDocuments])
    applycation.get(`${this.basePath}/:id/companyDemand`, [authorize('DAENERYS'), this.companyName])
    applycation.del(`${this.basePath}/:id`, [authorize('DAENERYS'), this.deleteDemand])
    applycation.post(`${this.basePath}`, [authorize('DAENERYS'), this.saveDemand])
    applycation.post(`${this.basePath}/:id/generatDemand`, [authorize('DAENERYS'), this.registrationDemands])
    applycation.post(`${this.basePath}/:id/removeItensDemand`, [authorize('DAENERYS'), this.removeItensDemand])
    applycation.post(`${this.basePath}/:id/searchVolumes`, [authorize('DAENERYS'), this.filterVolumes])
    applycation.post(`${this.basePath}/:id/searchArchives`, [authorize('DAENERYS'), this.filterArchives])
    applycation.post(`${this.basePath}/:id/showItensVolumes`, [authorize('DAENERYS'), this.showItensVolumes])
    applycation.post(`${this.basePath}/:id/showItensArchives`, [authorize('DAENERYS'), this.showItensArchives])
    applycation.post(`${this.basePath}/:id/lows`, [authorize('DAENERYS'), this.lows])
    applycation.post(`${this.basePath}/:id/devolutions`, [authorize('DAENERYS'), this.devolutions])
  }

}

export const demandsRouter = new DemandsRouter()
