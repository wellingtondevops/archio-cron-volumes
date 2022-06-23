import { SheetName } from './../sheetnames/sheetnames.model';


import { Email } from '../emails/emails.model'
import { Sheetarchive } from './../sheetarchives/sheetarchives.model';
import { ModelRouter } from "../common/model-router";
import * as restify from "restify";
import { Archive } from "../archives/archives.model";
import * as mongoose from "mongoose";
import { Volume } from "../volumes/volumes.model";
import { authorize } from "../security/authz.handler";
import { Pictures } from "../pictures/pictures.model";
import { MethodNotAllowedError, InvalidCredentialsError, NotFoundError } from "restify-errors";
import { mergePatchBodyParser } from "../server/merge-patch.parser";
import { departamentsRouter } from "../departaments/departaments.router";
import { Company } from "../companies/companies.model";
import { User } from "../users/users.model";
import { Doct } from '../docts/docts.model';

import { Audit } from '../audits/audits.model'
import { Position } from '../positions/positions.model'
import { Storehouse } from '../storehouses/storehouses.model'
import { authenticate } from '../security/auth.handler';

import * as moment from 'moment'
import 'moment/locale/pt-br';
import xl = require('excel4node')
import { Profile } from "../profiles/profiles.model";
import { sendRabbitmq } from "../queues/sendRabbitmqArchive";
import { ImportSheet } from "../importsheets/importsheets.model";
import axios from "axios";
import { environment } from '../common/environment';
import { setCronDepartaments } from '../libary/flagDepartaments';
import { setCronDocuments } from '../libary/flagDocumentos';
import { cachedarchivesScore } from './cachedarchivesScore';
import { cachedarchives } from './cachedarchives';
import { returnDocts } from '../libary/returnListDocts';
import { sendFirebase } from '../firebase/sendFirebase';
import { sendExport } from '../queues/sendExport';
import { setCronVolumes } from '../libary/flagVolumes';
var cron = require('node-cron');


var XLSX = require('xlsx')
const cache = require('../cache/cache')

class ArchivesRouter extends ModelRouter<Archive> {
  constructor() {
    super(Archive);
  }


  protected prepareOne(
    query: mongoose.DocumentQuery<Archive, Archive>
  ): mongoose.DocumentQuery<Archive, Archive> {
    return query
      .populate("company", "name")
      .populate("storehouse", "name virtualHd")
      .populate("volume", "location  volumeType")
      .populate("departament", "name")
      .populate("doct", "name label dcurrentLabel dcurrentValue dintermediateLabel dintermediateValue dfinal currentControl")
      .populate("author", "email")
      .populate("pictures", "url")
      .populate("sponsor", "name cnpj cpf")
      .populate("picture", "name page url")
  }

  envelop(document) {
    let resource = super.envelope(document);
    const archID = document.archive._id
      ? document.archive._id
      : document.archive;
    resource._links.archive = `/archives/${archID}`;
    return resource;
  }

  find = async (req, resp, next) => {

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
    let filters = req.body;
    const filter = delete filters.search && delete filters.initDate;
    delete filters.endDate && delete filters.location;

    const keybords = JSON.stringify(req.body).replace("{", "").replace("}", "") // tudo q o user digitou nos filtros.


    let page = parseInt(req.query._page || 1);
    let Size = parseInt(req.query.size || 50);
    this.pageSize = Size;
    page += 1;
    const skip = (page - 1) * this.pageSize;

    let profile = req.authenticated.profiles.toString()

    try {
      if (req.body.company !== undefined || null) {
        if (profile === 'DAENERYS') {
          if (text === "") {

            //---busca sem com texto em branco
            if (location === undefined) {

              let query = {
                mailSignup: req.authenticated.mailSignup,
                $and: [
                  filters,
                  {
                    create: {
                      $gte: initDate,
                      $lte: endDate
                    }
                  }
                ]
              }
              Archive.count(
                Archive.find(query)
              )
                .exec()
                .then(
                  async count =>
                    await Archive.find(query)
                      .populate("company", "name")
                      .populate("storehouse", "name")
                      .populate("volume", "location  volumeType")
                      .populate("departament", "name")
                      .populate("author", " name email")
                      .populate("doct", "name label")
                      .populate("picture", "name page")
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
              // cachedarchives(query, params, req.url, req.query._page, req.query.size)
            } else {


              const locations = await Volume.find({
                mailSignup: req.authenticated.mailSignup,
                location: new RegExp(location, "ig")
              }).select("_id");

              let query = {
                mailSignup: req.authenticated.mailSignup,

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
              }
              Archive.count(
                Archive.find(query)
              )
                .exec()
                .then(
                  async count =>
                    await Archive.find(query)
                      .populate("company", "name")
                      .populate("storehouse", "name")
                      .populate("volume", "location  volumeType")
                      .populate("departament", "name")
                      .populate("author", " name email")
                      .populate("doct", "name label")
                      .populate("picture", "name page")
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
              // cachedarchives(query, params, req.url, req.query._page, req.query.size)
            }
            //----------------------------------------------------------------------------------
          } else {

            let text2 = '"' + text.split(" ").join('" "') + '"' || ""
            // ---busca com indice preenchido
            // console.log(text2)
            if (location === undefined) {

              let query = {
                mailSignup: req.authenticated.mailSignup,

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
              }
              Archive.count(
                Archive.find(query,
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
                      query,
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
                      .populate("company", "name")
                      .populate("storehouse", "name")
                      .populate("volume", "location  volumeType")
                      .populate("departament", "name")
                      .populate("author", " name email")
                      .populate("doct", "name label")
                      .populate("picture", "name page")
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
              // cachedarchivesScore(query, params, req.url, req.query._page, req.query.size)


            } else {

              const locations = await Volume.find({
                mailSignup: req.authenticated.mailSignup,
                location: new RegExp(location, "ig")
              }).select("_id");

              let query = {
                mailSignup: req.authenticated.mailSignup,

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
              }
              Archive.count(
                Archive.find(query,
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
                      query,
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
                      .populate("company", "name")
                      .populate("storehouse", "name")
                      .populate("volume", "location  volumeType")
                      .populate("departament", "name")
                      .populate("author", " name email")
                      .populate("picture", "name page")
                      .populate("doct", "name label")
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
              // cachedarchivesScore(query, params, req.url, req.query._page, req.query.size)
            }
          }
        } else {



          if (text === "") {
            //---busca sem com texto em branco
            if (location === undefined) {
              // let user = await User.find({ _id: req.authenticated._id })
              //   .select("permissions.docts")
              //   .select("permissions.company");
              // let data = user[0].permissions.map(item => {
              //   return item.docts;
              // });

              // let doct = [].concat.apply([], data)

              // let data2 = user[0].permissions.map(item => {
              //   return item.company;
              // });

              // let company = data2;
              const docts = await returnDocts(req.authenticated._id)




              let query = {
                mailSignup: req.authenticated.mailSignup,
                // company: company,
                doct: docts,
                $and: [
                  filters,
                  {
                    create: {
                      $gte: initDate,
                      $lte: endDate
                    }
                  }
                ]
              }

              Archive.count(
                Archive.find(query)
              )
                .exec()
                .then(
                  async count =>
                    await Archive.find(query)
                      .populate("company", "name")
                      .populate("storehouse", "name")
                      .populate("volume", "location  volumeType")
                      .populate("departament", "name")
                      .populate("author", " name email")
                      .populate("doct", "name label")
                      .populate("picture", "name page")
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
              // cachedarchives(query, params, req.url, req.query._page, req.query.size)
            } else {
              const docts = await returnDocts(req.authenticated._id)
              // let user = await User.find({ _id: req.authenticated._id })
              //   .select("permissions.docts")
              //   .select("permissions.company");
              // let data = user[0].permissions.map(item => {
              //   return item.docts;
              // });

              // let doct = [].concat.apply([], data)

              // let data2 = user[0].permissions.map(item => {
              //   return item.company;
              // });

              // let company = data2;
              const locations = await Volume.find({
                mailSignup: req.authenticated.mailSignup,
                company: req.body.company,
                location: new RegExp(location, "ig")
              }).select("_id");

              let query = {
                mailSignup: req.authenticated.mailSignup,
                // company: company,
                doct: docts,
                volume: locations,
                $and: [
                  filters,

                  {
                    create: {
                      $gte: initDate,
                      $lte: endDate
                    }
                  },
                ]
              }
              Archive.count(
                Archive.find(query)
              )
                .exec()
                .then(
                  async count =>
                    await Archive.find(query)
                      .populate("company", "name")
                      .populate("storehouse", "name")
                      .populate("volume", "location  volumeType")
                      .populate("departament", "name")
                      .populate("author", " name email")
                      .populate("doct", "name label")
                      .populate("picture", "name page")
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
              // cachedarchives(query, params, req.url, req.query._page, req.query.size)
            }
            //----------------------------------------------------------------------------------
          } else {
            // let text2 = '"' + text.split(" ").join('"') + '"' || ""
            let text2 = '"' + text.split(" ").join('" "') + '"' || ""
            // ---busca com indice preenchido
            if (location === undefined) {
              const docts = await returnDocts(req.authenticated._id)
              let query = {
                mailSignup: req.authenticated.mailSignup,
                // company: company,
                doct: docts,
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
              }

              Archive.count(
                Archive.find(query,
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
                      query,
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
                      .populate("company", "name")
                      .populate("storehouse", "name")
                      .populate("volume", "location  volumeType")
                      .populate("departament", "name")
                      .populate("author", " name email")
                      .populate("doct", "name label")
                      .populate("picture", "name page")
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
              // cachedarchivesScore(query, params, req.url, req.query._page, req.query.size)
            } else {
              const docts = await returnDocts(req.authenticated._id)
              const locations = await Volume.find({
                mailSignup: req.authenticated.mailSignup,
                company: req.query.body,
                location: new RegExp(location, "ig")
              }).select("_id");

              let query = {
                mailSignup: req.authenticated.mailSignup,
                // company: company,
                doct: docts,
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
              }
              Archive.count(
                Archive.find(query
                  ,
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
                      query,
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
                      .populate("company", "name")
                      .populate("storehouse", "name")
                      .populate("volume", "location  volumeType")
                      .populate("departament", "name")
                      .populate("author", " name email")
                      .populate("doct", "name label")
                      .populate("picture", "name page")
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
              // cachedarchivesScore(query, params, req.url, req.query._page, req.query.size)
            }
          }
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

  DeleteSearch = async (req, resp, next) => {
    const { company, doct, departament, sheetImport } = req.body


    if (company == undefined) {
      return next(new MethodNotAllowedError(`POR FAVOR ESCOLHA UMA EMPRESA!`))
    } else if (doct == undefined) {
      return next(new MethodNotAllowedError(`POR FAVOR ESCOLHA UMA DOCUMENTO!`))
    } else if (departament == undefined) {
      return next(new MethodNotAllowedError(`POR FAVOR ESCOLHA UMA DEPARTAMENTO!`))
    } else if (sheetImport == undefined) {
      return next(new MethodNotAllowedError(`POR FAVOR ESCOLHA UMA PLANINLHA DE IMPORTAÇÃO`))
    } else {

      let page = parseInt(req.query._page || 1);
      let Size = parseInt(req.query.size || 50);
      this.pageSize = Size;
      page += 1;
      const skip = (page - 1) * this.pageSize;

      Archive.count(
        Archive.find({ company: company, doct: doct, departament: departament, sheetImport: sheetImport })
      )
        .exec()
        .then(
          async count =>
            await Archive.find({ company: company, doct: doct, departament: departament, sheetImport: sheetImport })
              .populate("company", "name")
              .populate("storehouse", "name")
              .populate("volume", "location  volumeType")
              .populate("departament", "name")
              .populate("author", " name email")
              .populate("doct", "name label")
              .populate("picture", "name page")
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




    // if (company ===undefined) {
    //   return next(new MethodNotAllowedError(`POR FAVOR PREENCHA TODOS OS CAMPOS PARA EXECUTAR ESSA PESQUISA!`))
    // }if else(){}



  }

  DeleteArchives = async (req, resp, next) => {
    const { company, doct, departament, sheetImport } = req.body


    const countM = await Archive.find({
      "company": company,
      "departament": departament,
      "doct": doct,
      "sheetImport": sheetImport,
      $or: [{ "demands": [], "lows": [], "loans": [] }]
    }).count()


    const countFull = await Archive.find({
      "company": company,
      "departament": departament,
      "doct": doct,
      "sheetImport": sheetImport
    }).count()

    if (countFull === countM) {

      const volumes = await Archive.distinct("volume",
        { company: company, departament: departament, doct: doct, sheetImport: sheetImport }
      )

      await Archive.remove({ company: company, departament: departament, doct: doct, sheetImport: sheetImport })
        .then(async () => {
          setCronVolumes(volumes)
        })
        .then(async () => {
          setCronDocuments(doct)
        })
        .then(async () => {
          setCronDepartaments(departament)
        })
        .then(async () => {
          ImportSheet.remove({ "sheet": sheetImport, mailSignup: req.authenticated.mailSignup })
        })

      resp.send("Arquivos Deletados com suscesso!!!!")
    } else {
      return next(new MethodNotAllowedError(`NÃO SERÁ POSSÍVEL DELETEAR OS ARQUIVOS SELECIONADOS POIS EXISTEM HISTÓRICO DE MOVIMENTAÇÃO!`))
    }

  }

  findSimple = async (req, resp, next) => {

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
    let filters = req.body;
    const filter = delete filters.search && delete filters.initDate;
    delete filters.endDate && delete filters.location;

    const keybords = JSON.stringify(req.body).replace("{", "").replace("}", "") // tudo q o user digitou nos filtros.


    let page = parseInt(req.query._page || 1);
    let Size = parseInt(req.query.size || 50);
    this.pageSize = Size;
    page += 1;
    const skip = (page - 1) * this.pageSize;

    let profile = req.authenticated.profiles.toString()

    try {
      if (req.body.company !== undefined || null) {
        if (profile === 'DAENERYS') {
          if (text === "") {

            //---busca sem com texto em branco
            if (location === undefined) {
              // db.records.find( { a: { $exists: true } } )
              let query = {
                mailSignup: req.authenticated.mailSignup,
                picture: { $exists: true },
                $and: [
                  filters,
                  {
                    create: {
                      $gte: initDate,
                      $lte: endDate
                    }
                  }
                ]
              }
              Archive.count(
                Archive.find(query)
              )
                .exec()
                .then(
                  async count =>
                    await Archive.find(query)
                      .populate("company", "name")
                      .populate("storehouse", "name")
                      .populate("volume", "location  volumeType")
                      .populate("departament", "name")
                      .populate("author", " name email")
                      .populate("doct", "name label")
                      .populate("picture", "name page")
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
              // cachedarchives(query, params, req.url, req.query._page, req.query.size)
            } else {


              const locations = await Volume.find({
                mailSignup: req.authenticated.mailSignup,
                location: new RegExp(location, "ig")
              }).select("_id");

              let query = {
                mailSignup: req.authenticated.mailSignup,
                picture: { $exists: true },

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
              }
              Archive.count(
                Archive.find(query)
              )
                .exec()
                .then(
                  async count =>
                    await Archive.find(query)
                      .populate("company", "name")
                      .populate("storehouse", "name")
                      .populate("volume", "location  volumeType")
                      .populate("departament", "name")
                      .populate("author", " name email")
                      .populate("doct", "name label")
                      .populate("picture", "name page")
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
              // cachedarchives(query, params, req.url, req.query._page, req.query.size)
            }
            //----------------------------------------------------------------------------------
          } else {

            let text2 = '"' + text.split(" ").join('" "') + '"' || ""
            // ---busca com indice preenchido
            // console.log(text2)
            if (location === undefined) {

              let query = {
                mailSignup: req.authenticated.mailSignup,
                picture: { $exists: true },

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
              }
              Archive.count(
                Archive.find(query,
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
                      query,
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
                      .populate("company", "name")
                      .populate("storehouse", "name")
                      .populate("volume", "location  volumeType")
                      .populate("departament", "name")
                      .populate("author", " name email")
                      .populate("doct", "name label")
                      .populate("picture", "name page")
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
              // cachedarchivesScore(query, params, req.url, req.query._page, req.query.size)


            } else {

              const locations = await Volume.find({
                mailSignup: req.authenticated.mailSignup,
                location: new RegExp(location, "ig")
              }).select("_id");

              let query = {
                mailSignup: req.authenticated.mailSignup,
                picture: { $exists: true },

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
              }
              Archive.count(
                Archive.find(query,
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
                      query,
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
                      .populate("company", "name")
                      .populate("storehouse", "name")
                      .populate("volume", "location  volumeType")
                      .populate("departament", "name")
                      .populate("author", " name email")
                      .populate("doct", "name label")
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
              // cachedarchivesScore(query, params, req.url, req.query._page, req.query.size)
            }
          }
        } else {



          if (text === "") {
            //---busca sem com texto em branco
            if (location === undefined) {
              // let user = await User.find({ _id: req.authenticated._id })
              //   .select("permissions.docts")
              //   .select("permissions.company");
              // let data = user[0].permissions.map(item => {
              //   return item.docts;
              // });

              // let doct = [].concat.apply([], data)

              // let data2 = user[0].permissions.map(item => {
              //   return item.company;
              // });

              // let company = data2;
              const docts = await returnDocts(req.authenticated._id)




              let query = {
                mailSignup: req.authenticated.mailSignup,
                picture: { $exists: true },
                // company: company,
                doct: docts,
                $and: [
                  filters,
                  {
                    create: {
                      $gte: initDate,
                      $lte: endDate
                    }
                  }
                ]
              }

              Archive.count(
                Archive.find(query)
              )
                .exec()
                .then(
                  async count =>
                    await Archive.find(query)
                      .populate("company", "name")
                      .populate("storehouse", "name")
                      .populate("volume", "location  volumeType")
                      .populate("departament", "name")
                      .populate("author", " name email")
                      .populate("doct", "name label")
                      .populate("picture", "name page")
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
              // cachedarchives(query, params, req.url, req.query._page, req.query.size)
            } else {
              const docts = await returnDocts(req.authenticated._id)
              // let user = await User.find({ _id: req.authenticated._id })
              //   .select("permissions.docts")
              //   .select("permissions.company");
              // let data = user[0].permissions.map(item => {
              //   return item.docts;
              // });

              // let doct = [].concat.apply([], data)

              // let data2 = user[0].permissions.map(item => {
              //   return item.company;
              // });

              // let company = data2;
              const locations = await Volume.find({
                mailSignup: req.authenticated.mailSignup,
                company: req.body.company,
                location: new RegExp(location, "ig")
              }).select("_id");

              let query = {
                mailSignup: req.authenticated.mailSignup,
                picture: { $exists: true },
                // company: company,
                doct: docts,
                volume: locations,
                $and: [
                  filters,

                  {
                    create: {
                      $gte: initDate,
                      $lte: endDate
                    }
                  },
                ]
              }
              Archive.count(
                Archive.find(query)
              )
                .exec()
                .then(
                  async count =>
                    await Archive.find(query)
                      .populate("company", "name")
                      .populate("storehouse", "name")
                      .populate("volume", "location  volumeType")
                      .populate("departament", "name")
                      .populate("author", " name email")
                      .populate("doct", "name label")
                      .populate("picture", "name page")
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
              // cachedarchives(query, params, req.url, req.query._page, req.query.size)
            }
            //----------------------------------------------------------------------------------
          } else {
            // let text2 = '"' + text.split(" ").join('"') + '"' || ""
            let text2 = '"' + text.split(" ").join('" "') + '"' || ""
            // ---busca com indice preenchido
            if (location === undefined) {
              const docts = await returnDocts(req.authenticated._id)
              let query = {
                mailSignup: req.authenticated.mailSignup,
                picture: { $exists: true },
                // company: company,
                doct: docts,
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
              }

              Archive.count(
                Archive.find(query,
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
                      query,
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
                      .populate("company", "name")
                      .populate("storehouse", "name")
                      .populate("volume", "location  volumeType")
                      .populate("departament", "name")
                      .populate("author", " name email")
                      .populate("doct", "name label")
                      .populate("picture", "name page")
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
              // cachedarchivesScore(query, params, req.url, req.query._page, req.query.size)
            } else {
              const docts = await returnDocts(req.authenticated._id)
              const locations = await Volume.find({
                mailSignup: req.authenticated.mailSignup,
                company: req.query.body,
                location: new RegExp(location, "ig")
              }).select("_id");

              let query = {
                mailSignup: req.authenticated.mailSignup,
                picture: { $exists: true },
                // company: company,
                doct: docts,
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
              }
              Archive.count(
                Archive.find(query
                  ,
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
                      query,
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
                      .populate("company", "name")
                      .populate("storehouse", "name")
                      .populate("volume", "location  volumeType")
                      .populate("departament", "name")
                      .populate("author", " name email")
                      .populate("doct", "name label")
                      .populate("picture", "name page")
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
              // cachedarchivesScore(query, params, req.url, req.query._page, req.query.size)
            }
          }
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

    const dp = await Volume.findOne({ _id: req.body.volume });
    const starCurrent = await Doct.findOne({ _id: req.body.doct })
    const _idSponsor = await User.find({ email: req.authenticated.mailSignup })
    let idSponsor = await _idSponsor.map(el => { return el._id })
    const idOfSponsor = idSponsor.toString()
    const currentTime = Number(starCurrent.dcurrentValue)
    const intermediateTime = Number(starCurrent.dintermediateValue)
    let arr = starCurrent.label
    const docItem = arr.findIndex((label, index, array) => label.timeControl === true)// retorno da posição na qual o timeControl está ativo.



    if (currentTime === 0) {
      const startDateCurrent = 0
      try {
        let document = new Archive({
          company: req.body.company,
          departament: dp.departament,
          storehouse: req.body.storehouse,
          volume: req.body.volume,
          doct: req.body.doct,
          tag: req.body.tag,
          version: req.body.version,
          uniqueness: req.body.uniqueness,
          author: req.authenticated._id,
          mailSignup: req.authenticated.mailSignup,
          sponsor: idOfSponsor,
          created: moment().tz('America/Sao_Paulo')

        });


        await Archive.find({
          mailSignup: req.authenticated.mailSignup,
          uniqueness: req.body.uniqueness,
          status: { $ne: "BAIXADO" },
          volume: req.body.volume
        })
          .then(async arq => {
            if (arq.length === 0) {
              setCronDepartaments(dp.departament)
              setCronDocuments(req.body.doct)
              await document.save()
                .then(await Volume.update({ _id: req.body.volume }, { $set: { records: true } }))
                .then(this.render(resp, next));



            } else {
              throw new MethodNotAllowedError(
                "Arquivo já Cadastrado nesta Caixa, por favor verique os Índices e corrija!"
              );
            }
          })
          .catch(next);

      } catch (error) {
        throw new MethodNotAllowedError(
          "Data fora do formato"
        );


      }




    } else {

      try {
        //RECEBE OS INDICES
        let init = req.body.tag
        //PROCURA A DATA DENTRO DO TEXTO PELA POSIÇÃO DO LABEL DO INDICE
        let _date = init[docItem]
        //FAZ O SPLIT NA DATA PARA GERAR OS CALCULOS
        let dateString = _date.split("/")

        // console.log("data", dateString.length)


        let startDateCurrent = new Date(dateString[2], dateString[1] - 1, dateString[0])
        let _finalDateCurrent = new Date(dateString[2], dateString[1] - 1, dateString[0])
        let finalDateCurrent = new Date(_finalDateCurrent.setFullYear(_finalDateCurrent.getUTCFullYear() + currentTime))
        let _finalDateIntermediate = new Date(dateString[2], dateString[1] - 1, dateString[0])
        let finalDateIntermediate = new Date(_finalDateIntermediate.setFullYear(_finalDateIntermediate.getUTCFullYear() + (currentTime + intermediateTime)))

        // console.log("Dia", dateString[2])
        // console.log("Mes", dateString[1])
        // console.log("Ano", dateString[0])
        // //FUTURAMENTE FAZER VERIFICAÇÃO          

        // console.log(" start -------- 🚀🚀", startDateCurrent)
        // console.log(" intermediário -------- 🚀🚀", finalDateCurrent)
        // console.log(" fim intermediário -------- 🚀🚀", finalDateIntermediate)

        //// empacotando o post
        let document = new Archive({
          company: req.body.company,
          departament: dp.departament,
          storehouse: req.body.storehouse,
          volume: req.body.volume,
          doct: req.body.doct,
          tag: req.body.tag,
          version: req.body.version,
          uniqueness: req.body.uniqueness,
          author: req.authenticated._id,
          mailSignup: req.authenticated.mailSignup,
          sponsor: idOfSponsor,
          startDateCurrent: startDateCurrent,
          finalDateCurrent: finalDateCurrent,
          finalDateIntermediate: finalDateIntermediate,
          finalFase: starCurrent.dfinal,
          created: moment().tz('America/Sao_Paulo')

        });


        await Archive.find({
          mailSignup: req.authenticated.mailSignup,
          uniqueness: req.body.uniqueness,
          status: { $ne: "BAIXADO" },
          volume: req.body.volume
        })
          .then(async arq => {
            if (arq.length === 0) {
              setCronDepartaments(dp.departament)
              setCronDocuments(req.body.doct)
              await document.save()
                .then(await Volume.update({ _id: req.body.volume }, { $set: { records: true, doct: req.body.doct } }))
                .then(this.render(resp, next));
            } else {

              throw new MethodNotAllowedError(
                "Arquivo já Cadastrado nesta Caixa, por favor verique os Índices e corrija!"
              );

            }
          })
          .catch(next);

      } catch (error) {
        throw new MethodNotAllowedError(
          "Data fora do formato"
        );

      }

    }
  }

  endDateCurrent = async (req, resp, next) => {


    const ArqDoc = await Archive.findOne({ _id: req.params.id })
    const dataDocument = await Doct.findOne({ _id: ArqDoc.doct })
    let intermediateTime = await Number(dataDocument.dintermediateValue)
    let finalFase = dataDocument.dfinal //destinação final
    let _startCurrentDate = req.body.startCurrentDate
    let data = moment(_startCurrentDate, "DD/MM/YYYY HH:mm");

    let params = `archiveshow:${req.params.id}`
    let prefixSearch = `searcharchives-${req.authenticated.mailSignup}`
    cache.del(params).catch()
    cache.delPrefix(prefixSearch).catch()
    let startCurrentDate = new Date(data.toString()) //fim da fase corrente acionado logo quando acessado a url

    let _finalDateIntermediate = await (startCurrentDate.getMonth() + 1) + "/" + (startCurrentDate.getDate()) + "/" + (startCurrentDate.getUTCFullYear() + intermediateTime)
    let finalDateIntermediate = new Date(_finalDateIntermediate)  //fim do da fase corrente          


    const options = { runValidators: true, new: true }
    this.model.findByIdAndUpdate(req.params.id, req.body, options)
      .then(this.render(resp, next))
    await Archive.update({ _id: req.params.id },

      {
        startDateCurrent: await (startCurrentDate.getMonth() + 1) + "/" + (startCurrentDate.getDate()) + "/" + startCurrentDate.getUTCFullYear(),
        finalDateCurrent: await (startCurrentDate.getMonth() + 1) + "/" + (startCurrentDate.getDate()) + "/" + startCurrentDate.getUTCFullYear(),
        finalDateIntermediate: finalDateIntermediate,
        finalFase: finalFase

      })
      .catch()

    resp.send("ok")



  }

  show = async (req, resp, next) => {

    const show = await this.prepareOne(this.model.findById(req.params.id))
    // cache.set(params, show, 60 * 1)
    resp.send(
      show
    )

    if (req.authenticated.isSponser === false) {

      const _idSponsor = await User.find({ email: req.authenticated.mailSignup })
      let idSponsor = await _idSponsor.map(el => { return el._id })
      const idOfSponsor = idSponsor.toString()

      let document = Archive.find({ _id: req.params.id })

      let _idcard = await (await document).map(el => { return el._id })
      let _iddoc = await (await document).map(el => { return el.doct })
      let a = new Audit({
        whoAccessed: req.authenticated.id,
        whatAccessed: _idcard,
        doctAccessed: _iddoc,
        mailSignup: req.authenticated.mailSignup,
        sponsor: idOfSponsor
      })

      await a.save()
        .catch(next)

    }
  }
  //////////////////////////SMARTSCAN - ver aqui para frente  flag cron
  importSmart = async (req, resp, next) => {
    let rq1 = req.body.archives
    let lv = rq1.map(el => { return el.LOCALIZACAO })
    // console.log("lista de Caixas geral",lv)
    let tg = req.body.archives.map(el => { return el.tag })
    // console.log("lista de TG GERAl",tg)
    let dtacreate = req.body.archives.map(el => { return el.dtaentrada })
    // console.log("Lista de Data de entrada Smart",dtacreate)
    const starCurrent = await Doct.findOne({ _id: req.body.doct })
    const currentTime = Number(starCurrent.dcurrentValue)
    // console.log("Tempo de data Corrente",currentTime)
    const intermediateTime = Number(starCurrent.dintermediateValue)
    // console.log("Tempo de data Intermediária",intermediateTime)
    const dfinal = starCurrent.dfinal
    // console.log("Destinação final",dfinal)    
    let arr = starCurrent.label
    const docItem = arr.findIndex((label, index, array) => label.timeControl === true)
    // console.log("INIDICE PARA PEGAR A DATA NA TAG",docItem)    
    const _idSponsor = await User.find({ email: req.authenticated.mailSignup })
    let idSponsor = await _idSponsor.map(el => { return el._id })
    const idOfSponsor = idSponsor.toString()
    const u = await User.find({ _id: req.authenticated._id })
    let username = u.map(el => { return el.name })
    const sheetname = Date.now() + "-" + username.toString() + "-" + req.body.sheetName
    ///////////////////////////////////termina aqui o cabeçalho.
    //////////criando um lista unica de Volumes para poder consultar ou criar se necessário for.
    const duplicateArrayVolumes = lv
    const unique = new Set(duplicateArrayVolumes)
    const listUniqueVolumes = [...unique] //lista de volumes unicos.
    // console.log("Lista de volumes unicas",listUniqueVolumes)
    let vol = []
    let err = []
    let errr = []
    let listVolumesWithID = []


    let documentError = new Sheetarchive({
      sheet: sheetname,
      mailSignup: req.authenticated.mailSignup,

    })

    await documentError.save().catch(next)

    let stor = await Storehouse.find({ _id: req.body.storehouse })
    let checkStore = stor.map(el => { return el.mapStorehouse }).pop()






    for (let i = 0; listUniqueVolumes.length > i; i++) {



      let f = await Volume.find({
        mailSignup: req.authenticated.mailSignup,
        departament: req.body.departament,
        storehouse: req.body.storehouse,
        location: listUniqueVolumes[i]
      })

      if (f.length !== 0) {
        let fiv = f.map(el => { return el._id }).toString()
        let flv = f.map(el => { return el.location }).toString()
        let objVol = {
          id: fiv,
          loc: flv
        }// aqui adiciona o id e locatin para serem pesquisados.
        listVolumesWithID.push(objVol)


      } else {
        let objv = { locCreate: listUniqueVolumes[i] }
        // console.log("não achou", objv)//criar a caixa
        let dE = await rq1.filter((Data) => {
          return Data.LOCALIZACAO === listUniqueVolumes[i]
        })
        let _dE = dE[0]
        let a = []
        a.push(_dE)
        let ii = await a.map(el => { return el.dtaentrada }).toString()
        let iii = ii.split("/")
        let year = Number(iii[2])
        let mounth = Number(iii[1])
        let day = Number(iii[0])
        let dta = new Date(year, mounth - 1, day)////data de criação para a caixa.

        let volumeA = new Volume({
          location: listUniqueVolumes[i],
          //description: req.body.description,
          volumeType: "BOX",
          guardType: "GERENCIADA",
          status: "ATIVO",
          storehouse: req.body.storehouse,
          uniqueField: `${listUniqueVolumes[i]}-${req.body.storehouse}`,
          company: req.body.company,
          departament: req.body.departament,
          // comments: req.body.comments,
          // listSeal: req.body.listSeal,
          // reference: ref[i],
          author: req.authenticated._id,
          mailSignup: req.authenticated.mailSignup,
          dateCreated: dta,
          sheetImport: sheetname,
          doct: req.body.doct,
          records: false
        })




        if (checkStore === true) {
          let controlPos = await Position.find({ storehouse: req.body.storehouse, used: false, position: { $eq: volumeA.location } })
          let idPosition = controlPos.map(el => { return el._id }).toString()
          let checkPosition = controlPos.map(el => { return el.used }).toString()

          if (idPosition !== '') {
            if (JSON.parse(checkPosition) === false) {
              setCronDepartaments(req.body.departament)
              volumeA.save()
                .catch(next)

              let box2 = volumeA._id

              let objVol2 = {
                id: volumeA.id,
                loc: volumeA.location
              }// aqui adiciona o id e locatin para serem pesquisados.
              listVolumesWithID.push(objVol2)
              await Position.update({ _id: idPosition }, { $set: { used: true, company: req.body.company, departament: req.body.departament } })
                .catch(next)
              console.log("item ok: ", vol.length)

            }

          }

        } else {
          var v = await Volume.find({
            mailSignup: req.authenticated.mailSignup,
            location: volumeA.location,
            storehouse: req.body.sotrehouse,
            status: { $ne: "BAIXADO" }
          })


          if (v.length === 0) {

            // console.log(listUniqueVolumes[i])

            let controlPos = await Position.find({ storehouse: req.body.storehouse, used: false, position: { $eq: volumeA.location } })


            let idPosition = controlPos.map(el => { return el._id }).toString()
            console.log(idPosition)


            if (idPosition !== '') {
              setCronDepartaments(req.body.departament)

              volumeA.save().catch(next)


              let box2 = volumeA._id

              let objVol2 = {
                id: volumeA.id,
                loc: volumeA.location
              }// aqui adiciona o id e locatin para serem pesquisados.
              listVolumesWithID.push(objVol2)

              await Position.update({ _id: idPosition }, { $set: { used: true, company: req.body.company, departament: req.body.departament } })
                .catch(next)
              console.log("item ok: ", vol.length)
            }
            setCronDepartaments(req.body.departament)
            volumeA.save().catch(next)

            let box2 = volumeA._id
            let objVol2 = {
              id: volumeA.id,
              loc: volumeA.location
            }// aqui adiciona o id e locatin para serem pesquisados.
            listVolumesWithID.push(objVol2)

            console.log("item ok: ", listUniqueVolumes.length)
          }
        }
      }



    }

    //IMPORTAÇÃO DE ARQUIVOS



    for (let i = 0; rq1.length > i; i++) {

      // console.log("vaixa procurada", lv[i])
      //  console.log('CAixaas pesquisadas', lv[i])
      let volInArray = listVolumesWithID.filter((boxInf) => {
        return boxInf.loc === lv[i]

      })

      let volId = volInArray.map(el => { return el.id })
      let d = [{
        data: (dtacreate[i])
      }]

      let dataSplit = d.map(el => { return el.data }).toString().split("/")

      let year = Number(dataSplit[2])
      let mounth = Number(dataSplit[1])
      let day = Number(dataSplit[0])
      let dtaa = new Date(year, mounth - 1, day)////data de criação para a caixa.    





      if (volInArray.length !== 0) {


        if (docItem === -1) {

          // let imgShearch = await Pictures.findOne({
          //   company: req.body.company,
          //   departament: req.body.departament,
          //   storehouse: req.body.storehouse,
          //   doct: req.body.doct,
          //   // url: "https://storage.googleapis.com/archiobucket/" + req.body.company + "/" + req.body.doct + "/" + img[i],
          //   // ind: false
          // })

          let document = new Archive({
            company: req.body.company,
            departament: req.body.departament,
            storehouse: req.body.storehouse,
            volume: volId.toString(),
            doct: req.body.doct,
            tag: tg[i],
            author: req.authenticated._id,
            mailSignup: req.authenticated.mailSignup,
            sponsor: idOfSponsor,
            create: dtaa,
            // picture: imgShearch._id,
            sheetImport: sheetname

          });
          setCronDocuments(req.body.doct)
          setCronDocuments(req.body.departament)
          setCronVolumes(volId.toString())
          await document.save()
            .then(await Volume.update({ _id: volId.toString() }, { $set: { records: true } }))
            .catch(next);


          //  await Pictures.findOneAndUpdate(
          //     { _id:imgShearch._id},
          //     { $push: { archive: document} },
          //     function (error, success) {
          //       if (error) {
          //         console.log(error);
          //       } else {

          //       }
          //     })

          // Pictures.updateOne({ _id: imgShearch._id },
          //   { archive: document, ind: true, }).catch(next)

          vol.push(document)

        } else {

          let init = tg[i]
          //PROCURA A DATA DENTRO DO TEXTO PELA POSIÇÃO DO LABEL DO INDICE
          let d2 = [{
            data2: (init[docItem])
          }]

          let dataSplit2 = d2.map(el => { return el.data2 }).toString()
          let patternDATAFULL = /^[0-9]{2}\/[0-9]{2}\/[0-9]{4}$/
          let patternCompt = /[0-9]{2}\/[0-9]{4}$/
          let patternYYYY = /[0-9]{4}$/

          if (patternDATAFULL.test(dataSplit2)) {
            // console.log("a DAta "+dataSplit2+" está correta.")
            let d = dataSplit2.split("/")

            let year = Number(d[2])
            let mounth = Number(d[1])
            let day = Number(d[0])
            let startDateCurrent = new Date(year, mounth - 1, day + 1)

            let finalDateCurrent = new Date(year + currentTime, mounth - 1, day + 1)

            let finalDateIntermediate = new Date(year + (currentTime + intermediateTime), mounth - 1, day + 1)
            // console.log(" MMYYY Start current"+startDateCurrent+"finalDaeCurrent"+finalDateCurrent+"finalDate Intermediate"+ finalDateIntermediate)


            // let imgShearch2 = await Pictures.findOne({
            //   company: req.body.company,
            //   departament: req.body.departament,
            //   storehouse: req.body.storehouse,
            //   doct: req.body.doct,
            //   url: "https://storage.googleapis.com/archiobucket/" + req.body.company + "/" + req.body.doct + "/" + img[i],
            //   ind: false
            // })
            let document = new Archive({
              company: req.body.company,
              departament: req.body.departament,
              storehouse: req.body.storehouse,
              volume: volId.toString(),
              doct: req.body.doct,
              tag: tg[i],
              author: req.authenticated._id,
              mailSignup: req.authenticated.mailSignup,
              sponsor: idOfSponsor,
              create: dtaa,
              startDateCurrent: startDateCurrent,
              finalDateCurrent: finalDateCurrent,
              finalDateIntermediate: finalDateIntermediate,
              finalFase: dfinal,
              // picture: imgShearch2._id,
              sheetImport: sheetname

            });

            setCronDocuments(req.body.doct)
            setCronDocuments(req.body.departament)
            setCronVolumes(volId.toString())

            await document.save()
              .then(await Volume.update({ _id: volId.toString() }, { $set: { records: true } }))
              .catch(next);
            // vol.push(document)
            // await Pictures.findOneAndUpdate(
            //   { _id:imgShearch2._id},
            //   { $push: { archive: document} },
            //   function (error, success) {
            //     if (error) {
            //       console.log(error);
            //     } else {

            //     }
            //   })
            // Pictures.updateOne({ _id: imgShearch2._id },
            //   { archive: document, ind: true,createdAt: dtaa}).catch(next)

            vol.push(document)


          } else if (patternCompt.test(dataSplit2)) {
            let ds = dataSplit2.split("/")
            let year = Number(ds[1])
            let mounth = Number(ds[0])

            let startDateCurrent = new Date(year, mounth - 1, 1)

            let finalDateCurrent = new Date(year + currentTime, mounth - 1, 1)

            let finalDateIntermediate = new Date(year + (currentTime + intermediateTime), mounth - 1, 1)

            // let imgShearch3 = await Pictures.findOne({
            //   company: req.body.company,
            //   departament: req.body.departament,
            //   storehouse: req.body.storehouse,
            //   doct: req.body.doct,
            //   url: "https://storage.googleapis.com/archiobucket/" + req.body.company + "/" + req.body.doct + "/" + img[i],
            //   ind: false
            // })
            // console.log(" MMYYY Start current"+startDateCurrent+"finalDaeCurrent"+finalDateCurrent+"finalDate Intermediate"+ finalDateIntermediate)
            let document = new Archive({
              company: req.body.company,
              departament: req.body.departament,
              storehouse: req.body.storehouse,
              volume: volId.toString(),
              doct: req.body.doct,
              tag: tg[i],
              author: req.authenticated._id,
              mailSignup: req.authenticated.mailSignup,
              sponsor: idOfSponsor,
              create: dtaa,
              startDateCurrent: startDateCurrent,
              finalDateCurrent: finalDateCurrent,
              finalDateIntermediate: finalDateIntermediate,
              finalFase: dfinal,
              // picture: imgShearch3._id,
              sheetImport: sheetname

            });
            setCronDocuments(req.body.doct)
            setCronDocuments(req.body.departament)
            setCronVolumes(volId.toString())
            await document.save()
              .then(await Volume.update({ _id: volId.toString() }, { $set: { records: true } }))
              .catch(next);
            // await Pictures.updateOne(
            //   { _id:imgShearch3._id},
            //   { $push: { archive: document} },
            //   function (error, success) {
            //     if (error) {
            //       console.log(error);
            //     } else {

            //     }
            //   }).catch(next);

            // vol.push(document)

            // Pictures.updateOne({ _id: imgShearch3._id },
            //   { archive: document, ind: true,createdAt: dtaa }).catch(next)

            vol.push(document)
          } else if (patternYYYY.test(dataSplit2)) {

            let year = Number(dataSplit2)
            let mounth = Number(12)
            let day = Number(31)
            let startDateCurrent = new Date(year, mounth - 1, day)

            let finalDateCurrent = new Date(year + currentTime, mounth - 1, day)

            let finalDateIntermediate = new Date(year + (currentTime + intermediateTime), mounth - 1, day)

            // let imgShearch4 = await Pictures.findOne({
            //   company: req.body.company,
            //   departament: req.body.departament,
            //   storehouse: req.body.storehouse,
            //   doct: req.body.doct,
            //   // url: "https://storage.googleapis.com/archiobucket/" + req.body.company + "/" + req.body.doct + "/" + img[i],
            //   // ind: false
            // })



            // console.log(" MMYYY Start current"+startDateCurrent+"finalDaeCurrent"+finalDateCurrent+"finalDate Intermediate"+ finalDateIntermediate)
            let document = new Archive({
              company: req.body.company,
              departament: req.body.departament,
              storehouse: req.body.storehouse,
              volume: volId.toString(),
              doct: req.body.doct,
              tag: tg[i],
              author: req.authenticated._id,
              mailSignup: req.authenticated.mailSignup,
              sponsor: idOfSponsor,
              create: dtaa,
              startDateCurrent: startDateCurrent,
              finalDateCurrent: finalDateCurrent,
              finalDateIntermediate: finalDateIntermediate,
              finalFase: dfinal,
              // picture: imgShearch4._id,
              sheetImport: sheetname

            });
            setCronDocuments(req.body.doct)
            setCronDocuments(req.body.departament)
            setCronVolumes(volId.toString())
            await document.save()
              .then(await Volume.update({ _id: volId.toString() }, { $set: { records: true } }))
              .catch(next);
            // await Pictures.updateOne(
            //   { _id:imgShearch4._id},
            //   { $push: { archive: document}} , /// amanhã olho
            //   function (error, success) {
            //     if (error) {
            //       console.log(error);
            //     } else {

            //     }
            //   }).catch(next);
            // // vol.push(document)
            // Pictures.updateOne({ _id: imgShearch4._id },
            //   { archive: document, ind: true,createdAt: dtaa }).catch(next)

            vol.push(document)

          } else {
            err.push(lv)
            let row = i + 1
            let sheetName = await Sheetarchive.find({ sheet: sheetname, mailSignup: req.authenticated.mailSignup })
            if (sheetName.length === 0) {


              let log =
              {

                "row": row,
                "msgError": "O campo de Data informa é inválido",
                "location": lv[i],
                "tag": tg[i]
              }

              Sheetarchive.findOneAndUpdate(
                { _id: documentError },
                { $push: { logErrors: log } },
                function (error, success) {
                  if (error) {
                    console.log(error);
                  } else {

                  }
                })


            } else {
              let log =
              {

                "row": row,
                "msgError": "O campo de Data informa é inválido",
                "location": lv[i],
                "tag": tg[i]
              }
              Sheetarchive.findOneAndUpdate(
                { _id: documentError },
                { $push: { logErrors: log } },
                function (error, success) {
                  if (error) {
                    console.log(error);
                  } else {

                  }
                })
            }
          }
        }
      } else {
        err.push(lv)
        let row = i + 1
        let sheetName = await Sheetarchive.find({ sheet: sheetname, mailSignup: req.authenticated.mailSignup })
        if (sheetName.length === 0) {

          let log =
          {

            "row": row,
            "msgError": "O campo de Data informa é inválido",
            "location": lv[i],
            "tag": tg[i]
          }
          Sheetarchive.findOneAndUpdate(
            { _id: documentError },
            { $push: { logErrors: log } },
            function (error, success) {
              if (error) {
                console.log(error);
              } else {

              }
            })


        } else {
          let log =
          {

            "row": row,
            "msgError": "Por favor verifique a Caixa",
            "location": lv[i],
            "tag": tg[i]
          }
          Sheetarchive.findOneAndUpdate(
            { _id: documentError },
            { $push: { logErrors: log } },
            function (error, success) {
              if (error) {
                console.log(error);
              } else {

              }
            })
        }
      }
      // console.log("caixa Encontrada na:",volInArray)
      console.log("Importados:", vol.length)
    }
    // resp.send(listVolumesWithID)
    let sheetErros = ""
    let sheetID = await Sheetarchive.find({ sheet: sheetname, mailSignup: req.authenticated.mailSignup })
    let _sheetID = sheetID.map(el => { return el._id });
    if (_sheetID.length === 0) {
      sheetErros = "Não ocorreram erros!"


    } else {

      sheetErros = `/sheetarchives/excel/${_sheetID[0]}`

    }

    let finish = {
      "Errors": err.length,
      "Imported": vol.length,
      "sheetError": sheetErros
    }

    resp.send(finish)
  }
  // importação de imagens smartscan
  importSmartImages = async (req, resp, next) => {

    //cabeçalho para importação


    let rq1 = req.body.archives
    let lv = rq1.map(el => { return el.LOCALIZACAO })
    // console.log("lista de Caixas geral",lv)
    let tg = req.body.archives.map(el => { return el.tag })
    // console.log("lista de TG GERAl",tg)
    let dtacreate = req.body.archives.map(el => { return el.dtaentrada })
    // console.log("Lista de Data de entrada Smart",dtacreate)
    const starCurrent = await Doct.findOne({ _id: req.body.doct })
    const currentTime = Number(starCurrent.dcurrentValue)
    // console.log("Tempo de data Corrente",currentTime)
    const intermediateTime = Number(starCurrent.dintermediateValue)
    // console.log("Tempo de data Intermediária",intermediateTime)
    const dfinal = starCurrent.dfinal
    // console.log("Destinação final",dfinal)    
    let arr = starCurrent.label
    const docItem = arr.findIndex((label, index, array) => label.timeControl === true)
    // console.log("INIDICE PARA PEGAR A DATA NA TAG",docItem)    
    const _idSponsor = await User.find({ email: req.authenticated.mailSignup })
    let idSponsor = await _idSponsor.map(el => { return el._id })
    const idOfSponsor = idSponsor.toString()
    const u = await User.find({ _id: req.authenticated._id })
    let username = u.map(el => { return el.name })
    const sheetname = Date.now() + "-" + username.toString() + "-" + req.body.sheetName
    ///////////////////////////////////termina aqui o cabeçalho.
    //////////criando um lista unica de Volumes para poder consultar ou criar se necessário for.
    const duplicateArrayVolumes = lv
    const unique = new Set(duplicateArrayVolumes)
    const listUniqueVolumes = [...unique] //lista de volumes unicos.
    // console.log("Lista de volumes unicas",listUniqueVolumes)
    let vol = []
    let err = []
    let errr = []
    let listVolumesWithID = []



    let img = req.body.archives.map(el => { return el.IMAGEM })
    let pg = req.body.archives.map(el => { return el.PAGE })
    let sgi = req.body.archives.map(el => { return el.COD_SGI })
    let sizes = req.body.archives.map(el => { return el.SIZE })

    let documentError = new Sheetarchive({
      sheet: sheetname,
      mailSignup: req.authenticated.mailSignup,

    })

    await documentError.save().catch(next)

    let stor = await Storehouse.find({ _id: req.body.storehouse })
    let checkStore = stor.map(el => { return el.mapStorehouse }).pop()



    //importação de paginas no banco..
    for (let i = 0; img.length > i; i++) {


      let IMG = new Pictures({

        company: req.body.company,
        storehouse: req.body.storehouse,
        departament: req.body.departament,
        doct: req.body.doct,
        originalname: img[i],
        name: img[i],
        size: parseInt(sizes[i]),
        cod_sgi: parseInt(sgi[i]),
        page: parseInt(pg[i]),
        url: "https://storage.googleapis.com/archiobucket/" + req.body.company + "/" + req.body.doct + "/" + img[i],
        createdAt: Date.now(),
        sheetImport: sheetname
      });
      setCronDocuments(req.body.doct)
      setCronDocuments(req.body.departament)
      IMG.save().catch(next)
    }


    /// loop das caixas


    for (let i = 0; listUniqueVolumes.length > i; i++) {



      let f = await Volume.find({
        mailSignup: req.authenticated.mailSignup,
        departament: req.body.departament,
        storehouse: req.body.storehouse,
        location: listUniqueVolumes[i]
      })

      if (f.length !== 0) {
        let fiv = f.map(el => { return el._id }).toString()
        let flv = f.map(el => { return el.location }).toString()
        let objVol = {
          id: fiv,
          loc: flv
        }// aqui adiciona o id e locatin para serem pesquisados.
        listVolumesWithID.push(objVol)


      } else {
        let objv = { locCreate: listUniqueVolumes[i] }
        // console.log("não achou", objv)//criar a caixa
        let dE = await rq1.filter((Data) => {
          return Data.LOCALIZACAO === listUniqueVolumes[i]
        })
        let _dE = dE[0]
        let a = []
        a.push(_dE)
        let ii = await a.map(el => { return el.dtaentrada }).toString()
        let iii = ii.split("/")
        let year = Number(iii[2])
        let mounth = Number(iii[1])
        let day = Number(iii[0])
        let dta = new Date(year, mounth - 1, day)////data de criação para a caixa.

        let volumeA = new Volume({
          location: listUniqueVolumes[i],
          //description: req.body.description,
          volumeType: "BOX",
          guardType: "GERENCIADA",
          status: "ATIVO",
          storehouse: req.body.storehouse,
          uniqueField: `${listUniqueVolumes[i]}-${req.body.storehouse}`,
          company: req.body.company,
          departament: req.body.departament,
          // comments: req.body.comments,
          // listSeal: req.body.listSeal,
          // reference: ref[i],
          author: req.authenticated._id,
          mailSignup: req.authenticated.mailSignup,
          dateCreated: dta,
          sheetImport: sheetname,
          doct: req.body.doct,
          records: false
        });


        if (checkStore === true) {
          let controlPos = await Position.find({ storehouse: req.body.storehouse, used: false, position: { $eq: volumeA.location } })
          let idPosition = controlPos.map(el => { return el._id }).toString()
          let checkPosition = controlPos.map(el => { return el.used }).toString()

          if (idPosition !== '') {
            if (JSON.parse(checkPosition) === false) {

              setCronDocuments(req.body.departament)
              volumeA.save().catch(next)
              let box2 = volumeA._id

              let objVol2 = {
                id: volumeA.id,
                loc: volumeA.location
              }// aqui adiciona o id e locatin para serem pesquisados.
              listVolumesWithID.push(objVol2)
              await Position.update({ _id: idPosition }, { $set: { used: true, company: req.body.company, departament: req.body.departament } })
                .catch(next)
              console.log("item ok: ", vol.length)

            }

          }

        } else {
          var v = await Volume.find({
            mailSignup: req.authenticated.mailSignup,
            location: volumeA.location,
            storehouse: req.body.sotrehouse,
            status: { $ne: "BAIXADO" }
          })


          if (v.length === 0) {

            console.log(listUniqueVolumes[i])

            let controlPos = await Position.find({ storehouse: req.body.storehouse, used: false, position: { $eq: volumeA.location } })


            let idPosition = controlPos.map(el => { return el._id }).toString()
            console.log(idPosition)


            if (idPosition !== '') {


              setCronDocuments(req.body.departament)

              volumeA.save().catch(next)


              let box2 = volumeA._id

              let objVol2 = {
                id: volumeA.id,
                loc: volumeA.location
              }// aqui adiciona o id e locatin para serem pesquisados.
              listVolumesWithID.push(objVol2)

              await Position.update({ _id: idPosition }, { $set: { used: true, company: req.body.company, departament: req.body.departament } })
                .catch(next)
              console.log("item ok: ", vol.length)
            }

            setCronDocuments(req.body.departament)
            volumeA.save().catch(next)

            let box2 = volumeA._id
            let objVol2 = {
              id: volumeA.id,
              loc: volumeA.location
            }// aqui adiciona o id e locatin para serem pesquisados.
            listVolumesWithID.push(objVol2)

            console.log("item ok: ", listUniqueVolumes.length)
          }
        }
      }



    }

    //IMPORTAÇÃO DE ARQUIVOS



    for (let i = 0; rq1.length > i; i++) {

      // console.log("vaixa procurada", lv[i])
      //  console.log('CAixaas pesquisadas', lv[i])
      let volInArray = listVolumesWithID.filter((boxInf) => {
        return boxInf.loc === lv[i]

      })

      let volId = volInArray.map(el => { return el.id })
      let d = [{
        data: (dtacreate[i])
      }]

      let dataSplit = d.map(el => { return el.data }).toString().split("/")

      let year = Number(dataSplit[2])
      let mounth = Number(dataSplit[1])
      let day = Number(dataSplit[0])
      let dtaa = new Date(year, mounth - 1, day)////data de criação para a caixa.    





      if (volInArray.length !== 0) {


        if (docItem === -1) {

          let imgShearch = await Pictures.findOne({
            company: req.body.company,
            departament: req.body.departament,
            storehouse: req.body.storehouse,
            doct: req.body.doct,
            url: "https://storage.googleapis.com/archiobucket/" + req.body.company + "/" + req.body.doct + "/" + img[i],
            ind: false
          })

          let document = new Archive({
            company: req.body.company,
            departament: req.body.departament,
            storehouse: req.body.storehouse,
            volume: volId.toString(),
            doct: req.body.doct,
            tag: tg[i],
            author: req.authenticated._id,
            mailSignup: req.authenticated.mailSignup,
            sponsor: idOfSponsor,
            create: dtaa,
            picture: imgShearch._id,
            sheetImport: sheetname

          });
          setCronDocuments(req.body.doct)
          setCronDocuments(req.body.departament)
          setCronVolumes(volId.toString())
          await document.save()
            .then(await Volume.update({ _id: volId.toString() }, { $set: { records: true } }))
            .catch(next);


          //  await Pictures.findOneAndUpdate(
          //     { _id:imgShearch._id},
          //     { $push: { archive: document} },
          //     function (error, success) {
          //       if (error) {
          //         console.log(error);
          //       } else {

          //       }
          //     })

          Pictures.updateOne({ _id: imgShearch._id },
            { archive: document, ind: true, }).catch(next)

          vol.push(document)

        } else {

          let init = tg[i]
          //PROCURA A DATA DENTRO DO TEXTO PELA POSIÇÃO DO LABEL DO INDICE
          let d2 = [{
            data2: (init[docItem])
          }]

          let dataSplit2 = d2.map(el => { return el.data2 }).toString()
          let patternDATAFULL = /^[0-9]{2}\/[0-9]{2}\/[0-9]{4}$/
          let patternCompt = /[0-9]{2}\/[0-9]{4}$/
          let patternYYYY = /[0-9]{4}$/

          if (patternDATAFULL.test(dataSplit2)) {
            // console.log("a DAta "+dataSplit2+" está correta.")
            let d = dataSplit2.split("/")

            let year = Number(d[2])
            let mounth = Number(d[1])
            let day = Number(d[0])
            let startDateCurrent = new Date(year, mounth - 1, day + 1)

            let finalDateCurrent = new Date(year + currentTime, mounth - 1, day + 1)

            let finalDateIntermediate = new Date(year + (currentTime + intermediateTime), mounth - 1, day + 1)
            // console.log(" MMYYY Start current"+startDateCurrent+"finalDaeCurrent"+finalDateCurrent+"finalDate Intermediate"+ finalDateIntermediate)


            let imgShearch2 = await Pictures.findOne({
              company: req.body.company,
              departament: req.body.departament,
              storehouse: req.body.storehouse,
              doct: req.body.doct,
              url: "https://storage.googleapis.com/archiobucket/" + req.body.company + "/" + req.body.doct + "/" + img[i],
              ind: false
            })
            let document = new Archive({
              company: req.body.company,
              departament: req.body.departament,
              storehouse: req.body.storehouse,
              volume: volId.toString(),
              doct: req.body.doct,
              tag: tg[i],
              author: req.authenticated._id,
              mailSignup: req.authenticated.mailSignup,
              sponsor: idOfSponsor,
              create: dtaa,
              startDateCurrent: startDateCurrent,
              finalDateCurrent: finalDateCurrent,
              finalDateIntermediate: finalDateIntermediate,
              finalFase: dfinal,
              picture: imgShearch2._id,
              sheetImport: sheetname

            });
            setCronDocuments(req.body.doct)
            setCronDocuments(req.body.departament)
            setCronVolumes(volId.toString())
            await document.save()
              .then(await Volume.update({ _id: volId.toString() }, { $set: { records: true } }))
              .catch(next);
            // vol.push(document)
            // await Pictures.findOneAndUpdate(
            //   { _id:imgShearch2._id},
            //   { $push: { archive: document} },
            //   function (error, success) {
            //     if (error) {
            //       console.log(error);
            //     } else {

            //     }
            //   })
            Pictures.updateOne({ _id: imgShearch2._id },
              { archive: document, ind: true, createdAt: dtaa }).catch(next)

            vol.push(document)






          } else if (patternCompt.test(dataSplit2)) {
            let ds = dataSplit2.split("/")
            let year = Number(ds[1])
            let mounth = Number(ds[0])

            let startDateCurrent = new Date(year, mounth - 1, 1)

            let finalDateCurrent = new Date(year + currentTime, mounth - 1, 1)

            let finalDateIntermediate = new Date(year + (currentTime + intermediateTime), mounth - 1, 1)

            let imgShearch3 = await Pictures.findOne({
              company: req.body.company,
              departament: req.body.departament,
              storehouse: req.body.storehouse,
              doct: req.body.doct,
              url: "https://storage.googleapis.com/archiobucket/" + req.body.company + "/" + req.body.doct + "/" + img[i],
              ind: false
            })
            // console.log(" MMYYY Start current"+startDateCurrent+"finalDaeCurrent"+finalDateCurrent+"finalDate Intermediate"+ finalDateIntermediate)
            let document = new Archive({
              company: req.body.company,
              departament: req.body.departament,
              storehouse: req.body.storehouse,
              volume: volId.toString(),
              doct: req.body.doct,
              tag: tg[i],
              author: req.authenticated._id,
              mailSignup: req.authenticated.mailSignup,
              sponsor: idOfSponsor,
              create: dtaa,
              startDateCurrent: startDateCurrent,
              finalDateCurrent: finalDateCurrent,
              finalDateIntermediate: finalDateIntermediate,
              finalFase: dfinal,
              picture: imgShearch3._id,
              sheetImport: sheetname

            });
            setCronDocuments(req.body.doct)
            setCronDocuments(req.body.departament)
            setCronVolumes(volId.toString())
            await document.save()
              .then(await Volume.update({ _id: volId.toString() }, { $set: { records: true } }))
              .catch(next);
            // await Pictures.updateOne(
            //   { _id:imgShearch3._id},
            //   { $push: { archive: document} },
            //   function (error, success) {
            //     if (error) {
            //       console.log(error);
            //     } else {

            //     }
            //   }).catch(next);

            // vol.push(document)

            Pictures.updateOne({ _id: imgShearch3._id },
              { archive: document, ind: true, createdAt: dtaa }).catch(next)

            vol.push(document)
          } else if (patternYYYY.test(dataSplit2)) {

            let year = Number(dataSplit2)
            let mounth = Number(12)
            let day = Number(31)
            let startDateCurrent = new Date(year, mounth - 1, day)

            let finalDateCurrent = new Date(year + currentTime, mounth - 1, day)

            let finalDateIntermediate = new Date(year + (currentTime + intermediateTime), mounth - 1, day)

            let imgShearch4 = await Pictures.findOne({
              company: req.body.company,
              departament: req.body.departament,
              storehouse: req.body.storehouse,
              doct: req.body.doct,
              url: "https://storage.googleapis.com/archiobucket/" + req.body.company + "/" + req.body.doct + "/" + img[i],
              ind: false
            })



            // console.log(" MMYYY Start current"+startDateCurrent+"finalDaeCurrent"+finalDateCurrent+"finalDate Intermediate"+ finalDateIntermediate)
            let document = new Archive({
              company: req.body.company,
              departament: req.body.departament,
              storehouse: req.body.storehouse,
              volume: volId.toString(),
              doct: req.body.doct,
              tag: tg[i],
              author: req.authenticated._id,
              mailSignup: req.authenticated.mailSignup,
              sponsor: idOfSponsor,
              create: dtaa,
              startDateCurrent: startDateCurrent,
              finalDateCurrent: finalDateCurrent,
              finalDateIntermediate: finalDateIntermediate,
              finalFase: dfinal,
              picture: imgShearch4._id,
              sheetImport: sheetname

            });
            setCronDocuments(req.body.doct)
            setCronDocuments(req.body.departament)
            setCronVolumes(volId.toString())
            await document.save()
              .then(await Volume.update({ _id: volId.toString() }, { $set: { records: true } }))
              .catch(next);
            // await Pictures.updateOne(
            //   { _id:imgShearch4._id},
            //   { $push: { archive: document}} , /// amanhã olho
            //   function (error, success) {
            //     if (error) {
            //       console.log(error);
            //     } else {

            //     }
            //   }).catch(next);
            // vol.push(document)
            Pictures.updateOne({ _id: imgShearch4._id },
              { archive: document, ind: true, createdAt: dtaa }).catch(next)

            vol.push(document)

          } else {
            err.push(lv)
            let row = i + 1
            let sheetName = await Sheetarchive.find({ sheet: sheetname, mailSignup: req.authenticated.mailSignup })
            if (sheetName.length === 0) {


              let log =
              {

                "row": row,
                "msgError": "O campo de Data informa é inválido",
                "location": lv[i],
                "tag": tg[i]
              }

              Sheetarchive.findOneAndUpdate(
                { _id: documentError },
                { $push: { logErrors: log } },
                function (error, success) {
                  if (error) {
                    console.log(error);
                  } else {

                  }
                })


            } else {
              let log =
              {

                "row": row,
                "msgError": "O campo de Data informa é inválido",
                "location": lv[i],
                "tag": tg[i]
              }
              Sheetarchive.findOneAndUpdate(
                { _id: documentError },
                { $push: { logErrors: log } },
                function (error, success) {
                  if (error) {
                    console.log(error);
                  } else {

                  }
                })
            }
          }
        }
      } else {
        err.push(lv)
        let row = i + 1
        let sheetName = await Sheetarchive.find({ sheet: sheetname, mailSignup: req.authenticated.mailSignup })
        if (sheetName.length === 0) {

          let log =
          {

            "row": row,
            "msgError": "O campo de Data informa é inválido",
            "location": lv[i],
            "tag": tg[i]
          }
          Sheetarchive.findOneAndUpdate(
            { _id: documentError },
            { $push: { logErrors: log } },
            function (error, success) {
              if (error) {
                console.log(error);
              } else {

              }
            })


        } else {
          let log =
          {

            "row": row,
            "msgError": "Por favor verifique a Caixa",
            "location": lv[i],
            "tag": tg[i]
          }
          Sheetarchive.findOneAndUpdate(
            { _id: documentError },
            { $push: { logErrors: log } },
            function (error, success) {
              if (error) {
                console.log(error);
              } else {

              }
            })
        }
      }
      // console.log("caixa Encontrada na:",volInArray)
      console.log("Importados:", vol.length)
    }
    // resp.send(listVolumesWithID)
    let sheetErros = ""
    let sheetID = await Sheetarchive.find({ sheet: sheetname, mailSignup: req.authenticated.mailSignup })
    let _sheetID = sheetID.map(el => { return el._id });
    if (_sheetID.length === 0) {
      sheetErros = "Não ocorreram erros!"


    } else {

      sheetErros = `/sheetarchives/excel/${_sheetID[0]}`

    }

    let finish = {
      "Errors": err.length,
      "Imported": vol.length,
      "sheetError": sheetErros
    }

    resp.send(finish)
  }

  import = async (req, resp, next) => {



    if (req.files.file.type !== "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
      return next(new MethodNotAllowedError(`SOMENTE SÃO PERMITIDOS ARQUIVOS XLSX!`))
    }


    const { company, doct, departament, storehouse, retroDate } = req.body
    let workbook = XLSX.readFile(req.files.file.path);

    

    let sheet_name_list = workbook.SheetNames;



    let xlData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
    const queue = "archiveimport"
    const idus = req.authenticated.id
    const sponsor = req.authenticated.mailSignup
    const plan = req.files.file.name
    const sheetN = plan.toString()

    let verifySheet = await ImportSheet.find({ mailSignup: sponsor, sheet: sheetN })
    // console.log(verifySheet.length)

    if (verifySheet.length !== 0) {
      return next(new MethodNotAllowedError(`OPS...ESSE PLANILHA ${sheetN}, já foi utilizada, por favor coloque outro nome!`))
    }

    let document = new ImportSheet({

      sheet: sheetN,
      mailSignup: sponsor
    })


    await document.save()
      .then(() => setCronDepartaments(departament))
      .then(() => setCronDocuments(doct))
      .then(() => sendRabbitmq(queue, idus, sponsor, company, doct, departament, storehouse, retroDate, sheetN, workbook))
      .then(resp.send({ "mssg": "Sua Planilha está sendo Processada, vc receberá uma Notificação em Breve!" }))
      .catch((erro) => console.log("Erro para receber Planilha", erro))
  }
  ///antiga importação de registros
  importt = async (req, resp, next) => {

    //cabeçalho para importação
    let rq1 = req.body.archives
    let lv = rq1.map(el => { return el.LOCALIZACAO })
    // console.log("lista de Caixas geral",lv)
    let tg = req.body.archives.map(el => { return el.tag })
    // console.log("lista de TG GERAl",tg)
    //  let dtacreate = Date.now()
    // console.log("Lista de Data de entrada Smart",dtacreate)
    const starCurrent = await Doct.findOne({ _id: req.body.doct })
    const currentTime = Number(starCurrent.dcurrentValue)
    // console.log("Tempo de data Corrente",currentTime)
    const intermediateTime = Number(starCurrent.dintermediateValue)
    // console.log("Tempo de data Intermediária",intermediateTime)
    const dfinal = starCurrent.dfinal
    // console.log("Destinação final",dfinal)    
    let arr = starCurrent.label
    const docItem = arr.findIndex((label, index, array) => label.timeControl === true)
    // console.log("INIDICE PARA PEGAR A DATA NA TAG",docItem)    
    const _idSponsor = await User.find({ email: req.authenticated.mailSignup })
    let idSponsor = await _idSponsor.map(el => { return el._id })
    const idOfSponsor = idSponsor.toString()
    const u = await User.find({ _id: req.authenticated._id })
    let username = u.map(el => { return el.name })
    const sheetname = Date.now() + "-" + username.toString() + "-" + req.body.sheetName
    ///////////////////////////////////termina aqui o cabeçalho.
    //////////criando um lista unica de Volumes para poder consultar ou criar se necessário for.
    const duplicateArrayVolumes = lv
    const unique = new Set(duplicateArrayVolumes)
    const listUniqueVolumes = [...unique] //lista de volumes unicos.
    // console.log("Lista de volumes unicas",listUniqueVolumes)
    let vol = []
    let err = []
    let errr = []
    let listVolumesWithID = []
    /// loop das caixas

    //planilha de erros

    let documentError = new Sheetarchive({
      sheet: sheetname,
      mailSignup: req.authenticated.mailSignup,

    })
    await documentError.save().catch(next)



    let stor = await Storehouse.find({ _id: req.body.storehouse })
    let checkStore = stor.map(el => { return el.mapStorehouse }).pop()

    for (let i = 0; listUniqueVolumes.length > i; i++) {



      let f = await Volume.find({
        mailSignup: req.authenticated.mailSignup,
        departament: req.body.departament,
        storehouse: req.body.storehouse,
        location: listUniqueVolumes[i]

      })

      if (f.length !== 0) {
        let fiv = f.map(el => { return el._id }).toString()
        let flv = f.map(el => { return el.location }).toString()
        let objVol = {
          id: fiv,
          loc: flv
        }// aqui adiciona o id e locatin para serem pesquisados.
        listVolumesWithID.push(objVol)


      } else {
        let objv = { locCreate: listUniqueVolumes[i] }
        // console.log("não achou", objv)//criar a caixa
        let dE = await rq1.filter((Data) => {
          return Data.LOCALIZACAO === listUniqueVolumes[i]
        })
        let _dE = dE[0]
        let a = []
        a.push(_dE)
        let ii = await a.map(el => { return el.dtaentrada }).toString()
        let iii = ii.split("/")
        let year = Number(iii[2])
        let mounth = Number(iii[1])
        let day = Number(iii[0])
        let dta = new Date(year, mounth - 1, day)////data de criação para a caixa.

        let volumeA = new Volume({
          location: listUniqueVolumes[i],
          //description: req.body.description,
          volumeType: "BOX",
          guardType: "GERENCIADA",
          status: "ATIVO",
          storehouse: req.body.storehouse,
          uniqueField: `${listUniqueVolumes[i]}-${req.body.storehouse}`,
          company: req.body.company,
          departament: req.body.departament,

          // comments: req.body.comments,
          // listSeal: req.body.listSeal,
          // reference: ref[i],
          author: req.authenticated._id,
          mailSignup: req.authenticated.mailSignup,
          sheetImport: sheetname,
          doct: req.body.doct,
          records: false

          //  dateCreated: dta
        });

        if (checkStore === true) {
          let controlPos = await Position.find({ storehouse: req.body.storehouse, used: false, position: { $eq: volumeA.location } })
          let idPosition = controlPos.map(el => { return el._id }).toString()
          let checkPosition = controlPos.map(el => { return el.used }).toString()

          if (idPosition !== '') {
            if (JSON.parse(checkPosition) === false) {

              setCronDocuments(req.body.departament)
              volumeA.save().catch(next)
              let box2 = volumeA._id

              let objVol2 = {
                id: volumeA.id,
                loc: volumeA.location
              }// aqui adiciona o id e locatin para serem pesquisados.
              listVolumesWithID.push(objVol2)
              await Position.update({ _id: idPosition }, { $set: { used: true, company: req.body.company, departament: req.body.departament } })
                .catch(next)
              console.log("item ok: ", vol.length)

            }

          }



        } else {
          var v = await Volume.find({
            mailSignup: req.authenticated.mailSignup,
            location: volumeA.location,
            storehouse: req.body.sotrehouse,
            status: { $ne: "BAIXADO" }
          })


          if (v.length === 0) {

            console.log(listUniqueVolumes[i])

            let controlPos = await Position.find({ storehouse: req.body.storehouse, used: false, position: { $eq: volumeA.location } })


            let idPosition = controlPos.map(el => { return el._id }).toString()
            console.log(idPosition)


            if (idPosition !== '') {

              setCronDocuments(req.body.departament)

              volumeA.save().catch(next)


              let box2 = volumeA._id

              let objVol2 = {
                id: volumeA.id,
                loc: volumeA.location
              }// aqui adiciona o id e locatin para serem pesquisados.
              listVolumesWithID.push(objVol2)

              await Position.update({ _id: idPosition }, { $set: { used: true, company: req.body.company, departament: req.body.departament } })
                .catch(next)
              console.log("item ok: ", vol.length)



            }

            setCronDocuments(req.body.departament)
            volumeA.save().catch(next)


            let box2 = volumeA._id

            let objVol2 = {
              id: volumeA.id,
              loc: volumeA.location
            }// aqui adiciona o id e locatin para serem pesquisados.
            listVolumesWithID.push(objVol2)

            console.log("item ok: ", listUniqueVolumes.length)
          }
        }
      }


    }

    //IMPORTAÇÃO DE ARQUIVOS



    for (let i = 0; rq1.length > i; i++) {



      let volInArray = listVolumesWithID.filter((boxInf) => {
        return boxInf.loc === lv[i]

      })

      let volId = volInArray.map(el => { return el.id })


      if (volInArray.length !== 0) {


        if (docItem === -1) {

          // console.log("oi to aqui", currentTime)

          let document = new Archive({
            company: req.body.company,
            departament: req.body.departament,
            storehouse: req.body.storehouse,
            volume: volId.toString(),
            doct: req.body.doct,
            tag: tg[i],
            author: req.authenticated._id,
            mailSignup: req.authenticated.mailSignup,
            sponsor: idOfSponsor,
            sheetImport: sheetname
            //  create: dtaa

          });
          setCronDocuments(req.body.doct)
          setCronDocuments(req.body.departament)
          setCronVolumes(volId.toString())
          await document.save()
            .then(await Volume.update({ _id: volId.toString() }, { $set: { records: true } }))
            .catch(next);

          vol.push(document)



        } else {

          // console.log("aqui tem start Temporalidade", currentTime)

          let init = tg[i]
          //PROCURA A DATA DENTRO DO TEXTO PELA POSIÇÃO DO LABEL DO INDICE
          let d2 = [{
            data2: (init[docItem])
          }]

          let dataSplit2 = d2.map(el => { return el.data2 }).toString()
          let patternDATAFULL = /^[0-9]{2}\/[0-9]{2}\/[0-9]{4}$/
          let patternCompt = /[0-9]{2}\/[0-9]{4}$/
          let patternYYYY = /[0-9]{4}$/

          if (patternDATAFULL.test(dataSplit2)) {
            // console.log("a DAta "+dataSplit2+" está correta.")
            let d = dataSplit2.split("/")

            let year = Number(d[2])
            let mounth = Number(d[1])
            let day = Number(d[0])
            let startDateCurrent = new Date(year, mounth - 1, day + 1)

            let finalDateCurrent = new Date(year + currentTime, mounth - 1, day + 1)

            let finalDateIntermediate = new Date(year + (currentTime + intermediateTime), mounth - 1, day + 1)
            // console.log(" MMYYY Start current"+startDateCurrent+"finalDaeCurrent"+finalDateCurrent+"finalDate Intermediate"+ finalDateIntermediate)
            let document = new Archive({
              company: req.body.company,
              departament: req.body.departament,
              storehouse: req.body.storehouse,
              volume: volId.toString(),
              doct: req.body.doct,
              tag: tg[i],
              author: req.authenticated._id,
              mailSignup: req.authenticated.mailSignup,
              sponsor: idOfSponsor,
              sheetImport: sheetname,
              //  create: dtaa,
              startDateCurrent: startDateCurrent,
              finalDateCurrent: finalDateCurrent,
              finalDateIntermediate: finalDateIntermediate,
              finalFase: dfinal

            });
            setCronDocuments(req.body.doct)
            setCronDocuments(req.body.departament)
            setCronVolumes(volId.toString())
            await document.save()
              .then(await Volume.update({ _id: volId.toString() }, { $set: { records: true } }))
              .catch(next);
            vol.push(document)

          } else if (patternCompt.test(dataSplit2)) {
            let ds = dataSplit2.split("/")
            let year = Number(ds[1])
            let mounth = Number(ds[0])

            let startDateCurrent = new Date(year, mounth - 1, 1)

            let finalDateCurrent = new Date(year + currentTime, mounth - 1, 1)

            let finalDateIntermediate = new Date(year + (currentTime + intermediateTime), mounth - 1, 1)
            // console.log(" MMYYY Start current"+startDateCurrent+"finalDaeCurrent"+finalDateCurrent+"finalDate Intermediate"+ finalDateIntermediate)
            let document = new Archive({
              company: req.body.company,
              departament: req.body.departament,
              storehouse: req.body.storehouse,
              volume: volId.toString(),
              doct: req.body.doct,
              tag: tg[i],
              author: req.authenticated._id,
              mailSignup: req.authenticated.mailSignup,
              sponsor: idOfSponsor,
              sheetImport: sheetname,
              //  create: dtaa,
              startDateCurrent: startDateCurrent,
              finalDateCurrent: finalDateCurrent,
              finalDateIntermediate: finalDateIntermediate,
              finalFase: dfinal

            });
            setCronDocuments(req.body.doct)
            setCronDocuments(req.body.departament)
            setCronVolumes(volId.toString())
            await document.save()
              .then(await Volume.update({ _id: volId.toString() }, { $set: { records: true } }))
              .catch(next);
            vol.push(document)
          } else if (patternYYYY.test(dataSplit2)) {

            let year = Number(dataSplit2)
            let mounth = Number(12)
            let day = Number(31)
            let startDateCurrent = new Date(year, mounth - 1, day)

            let finalDateCurrent = new Date(year + currentTime, mounth - 1, day)

            let finalDateIntermediate = new Date(year + (currentTime + intermediateTime), mounth - 1, day)

            // console.log(" MMYYY Start current"+startDateCurrent+"finalDaeCurrent"+finalDateCurrent+"finalDate Intermediate"+ finalDateIntermediate)
            let document = new Archive({
              company: req.body.company,
              departament: req.body.departament,
              storehouse: req.body.storehouse,
              volume: volId.toString(),
              doct: req.body.doct,
              tag: tg[i],
              author: req.authenticated._id,
              mailSignup: req.authenticated.mailSignup,
              sponsor: idOfSponsor,
              sheetImport: sheetname,
              //  create: dtaa,
              startDateCurrent: startDateCurrent,
              finalDateCurrent: finalDateCurrent,
              finalDateIntermediate: finalDateIntermediate,
              finalFase: dfinal

            });
            setCronDocuments(req.body.doct)
            setCronDocuments(req.body.departament)
            setCronVolumes(volId.toString())
            await document.save()
              .then(await Volume.update({ _id: volId.toString() }, { $set: { records: true } }))
              .catch(next);
            vol.push(document)
          } else {
            err.push(lv)
            let row = i + 1

            let log =
            {

              "row": row,
              "msgError": "O campo de Data informa é inválido",
              "location": lv[i],
              "tag": tg[i]
            }
            Sheetarchive.findOneAndUpdate(
              { _id: documentError },
              { $push: { logErrors: log } },
              function (error, success) {
                if (error) {
                  console.log(error);
                } else {

                }
              })

          }
        }
      } else {
        err.push(lv)
        let row = i + 1


        let log =
        {

          "row": row,
          "msgError": "Por favor verifique a Caixa",
          "location": lv[i],
          "tag": tg[i]
        }
        Sheetarchive.findOneAndUpdate(
          { _id: documentError },
          { $push: { logErrors: log } },
          function (error, success) {
            if (error) {
              console.log(error);
            } else {

            }
          })

      }
      // console.log("caixa Encontrada na:",volInArray)
      console.log("Importados:", vol.length)
    }
    // resp.send(listVolumesWithID)
    let sheetErros = ""
    let sheetID = await Sheetarchive.find({ sheet: sheetname, mailSignup: req.authenticated.mailSignup })
    let _sheetID = sheetID.map(el => { return el._id });
    if (_sheetID.length === 0) {
      sheetErros = "Não ocorreram erros!"
      await Sheetarchive.deleteOne({ _id: documentError })
    } else {

      sheetErros = `/sheetarchives/excel/${_sheetID[0]}`

    }

    let finish = {
      "Errors": err.length,
      "Imported": vol.length,
      "sheetError": sheetErros
    }

    resp.send(finish)
  }
  //importação para ged
  importSmartImagesGed = async (req, resp, next) => {

    //cabeçalho para importação


    let rq1 = req.body.archives
    let lv = "IMAGENS"
    // console.log("lista de Caixas geral",lv)
    let tg = req.body.archives.map(el => { return el.tag })
    // console.log("lista de TG GERAl",tg)

    // console.log("Lista de Data de entrada Smart",dtacreate)

    // console.log("Tempo de data Corrente",currentTime)

    // const docItem = arr.findIndex((label, index, array) => label.timeControl === true)
    // console.log("INIDICE PARA PEGAR A DATA NA TAG",docItem)    
    const _idSponsor = await User.find({ email: req.authenticated.mailSignup })
    let idSponsor = await _idSponsor.map(el => { return el._id })
    const idOfSponsor = idSponsor.toString()
    const u = await User.find({ _id: req.authenticated._id })
    let username = u.map(el => { return el.name })
    const sheetname = Date.now() + "-" + username.toString() + "-" + req.body.sheetName
    ///////////////////////////////////termina aqui o cabeçalho.
    //////////criando um lista unica de Volumes para poder consultar ou criar se necessário for.
    // const duplicateArrayVolumes = lv


    // console.log("Lista de volumes unicas",listUniqueVolumes)
    let vol = []
    let err = []





    let img = req.body.archives.map(el => { return el.IMAGEM })
    let pg = req.body.archives.map(el => { return el.PAGE })
    let sgi = req.body.archives.map(el => { return el.COD_SGI })
    let sizes = req.body.archives.map(el => { return el.SIZE })

    let documentError = new Sheetarchive({
      sheet: sheetname,
      mailSignup: req.authenticated.mailSignup,

    })

    await documentError.save().catch(next)

    let stor = await Storehouse.find({ virtualHd: true })
    let idstor = stor.map(el => { return el._id }).pop()

    let volume = await Volume.find({ storehouse: idstor })
    let idvol = volume.map(el => { return el._id }).pop()

    //importação de paginas no banco..
    for (let i = 0; img.length > i; i++) {


      let IMG = new Pictures({

        company: req.body.company,
        storehouse: idstor,
        departament: req.body.departament,
        doct: req.body.doct,
        originalname: img[i],
        name: img[i],
        size: parseInt(sizes[i]),
        cod_sgi: parseInt(sgi[i]),
        page: parseInt(pg[i]),
        url: "https://storage.googleapis.com/archiobucket/" + req.body.company + "/" + req.body.doct + "/" + img[i],
        createdAt: moment().tz('America/Sao_Paulo'),
        sheetImport: sheetname
      });
      await IMG.save().catch(next)
    }

    //IMPORTAÇÃO DE ARQUIVOS



    for (let i = 0; rq1.length > i; i++) {
      let imgShearch = await Pictures.findOne({
        company: req.body.company,
        departament: req.body.departament,
        storehouse: idstor.toString(),
        doct: req.body.doct,
        url: "https://storage.googleapis.com/archiobucket/" + req.body.company + "/" + req.body.doct + "/" + img[i],
        ind: false
      })

      let document = new Archive({
        company: req.body.company,
        departament: req.body.departament,
        storehouse: idstor,
        volume: idvol,
        doct: req.body.doct,
        tag: tg[i],
        author: req.authenticated._id,
        mailSignup: req.authenticated.mailSignup,
        sponsor: idOfSponsor,
        created: moment().tz('America/Sao_Paulo'),
        picture: imgShearch._id,
        sheetImport: sheetname

      });
      await document.save()


      Pictures.updateOne({ _id: imgShearch._id },
        { archive: document, ind: true, }).catch(next)

      vol.push(document)



      // console.log("caixa Encontrada na:",volInArray)
      console.log("Importados:", vol.length)
    }
    // resp.send(listVolumesWithID)
    let sheetErros = ""
    let sheetID = await Sheetarchive.find({ sheet: sheetname, mailSignup: req.authenticated.mailSignup })
    let _sheetID = sheetID.map(el => { return el._id });
    if (_sheetID.length === 0) {
      Sheetarchive.deleteOne({ _id: _sheetID })
      sheetErros = "Não ocorreram erros!"


    } else {

      sheetErros = `/sheetarchives/excel/${_sheetID[0]}`

    }

    let finish = {
      "Errors": err.length,
      "Imported": vol.length,
      "sheetError": sheetErros
    }

    resp.send(finish)
  }

  date = async (req, res, next) => {


    let rq1 = req.body.itens
    let id = rq1.map(el => { return el.ida })
    let dta = rq1.map(el => { return el.startCurrentDate })



    for (let i = 0; rq1.length > i; i++) {
      let url = `http://localhost:3000/archives/startcurrentdate/${id[i]}`

      axios.patch(url, { startCurrentDate: dta[i] })


    }






    res.send("ok")


  }

  vpc = async (req, res, next) => {

    const data = await Archive.find({ _id: req.params.id })
    const idpicture = data.map(el => { return el.picture }).pop()

    let dStatus = data.map(el => { return el.status }).pop().toString()
    let indDemand = data.map(el => { return el.indDemand }).pop()
    let lows = data.map(el => { return el.lows }).toString()
    let devolutions = data.map(el => { return el.devolutions }).toString()
    let loans = data.map(el => { return el.loans }).toString()
    let demands = data.map(el => { return el.demands }).toString()
    let volume = [data.map(el => { return el.volume })]

    // console.log(volume)

    let params = `archiveshow:${req.params.id}`
    let prefixSearch = `searcharchives-${req.authenticated.mailSignup}`



    if (loans != '' || devolutions != '' || lows != '' || demands != '' || dStatus != "ATIVO" || indDemand != false) {

      res.send(new MethodNotAllowedError(
        "Arquivo não pode ser deletado pois há registros relacionados!.."
      ))
    } else {

      if (idpicture != undefined) {

        await Archive.remove({ _id: req.params.id })
        await Pictures.remove({ _id: idpicture.toString() })
        setCronDepartaments(data.map(el => { return el.departament }).toString())
        setCronDocuments(data.map(el => { return el.doct }).toString())
        setCronVolumes(volume)

        let obj = { pictures: idpicture.toString() }

        axios.post(environment.api.api_upload, obj)
          .then(response => console.log("apagou"))
          .catch(error => {
            // console.error('Erro ao deletar o pdf no buket!', error);
          });

        res.send(200)
      } else {
        cache.del(params).catch()
        cache.delPrefix(prefixSearch).catch()
        await Archive.remove({ _id: req.params.id })
        setCronDepartaments(data.map(el => { return el.departament }).toString())
        setCronDocuments(data.map(el => { return el.doct }).toString())
        setCronVolumes(volume)
        res.send(200)
      }

      (next)

    }

  }

  up = (req, resp, next) => {


    let params = `archiveshow:${req.params.id}`
    let prefixSearch = `searcharchives-${req.authenticated.mailSignup}`

    cache.del(params).catch()
    cache.delPrefix(prefixSearch).catch()
    const options = { runValidators: true, new: true }
    this.model.findByIdAndUpdate(req.params.id, req.body, options)
      .then(this.render(resp, next))
      .catch(next)
  }

  sendEmail = async (req, resp, next) => {

    const { requestType, notes } = req.body

    if (!requestType) {
      resp.send(new MethodNotAllowedError(
        "POR FAVOR ESCOLHA UMA OPÇÃO DE SOLICITACAO - EMPRÉSTIMO - CORREÇÃO DE ÍNDICE - CORREÇÃO"
      ))
    } else {


      let receivers = []
      let title = []

      if (requestType === "EMPRESTIMO") {
        title.push("EMPRÉSTIMO")
        const users = await User.find({ mailSignup: req.authenticated.mailSignup, receiveLoan: true }).select("id")

        for (const user of users.map(el => { return el._id })) {
          const receiver = user
          receivers.push(receiver)
        }
      } else {
        title = requestType.replace('_', ' DE ')
        const users = await User.find({ mailSignup: req.authenticated.mailSignup, receiveCorrection: true }).select("id")

        for (const user of users.map(el => { return el._id })) {
          const receiver = user
          receivers.push(receiver)
        }
      }

      if (receivers.length === 0) {
        resp.send(new MethodNotAllowedError(
          "Não há usuários cadastrados para fazer empréstimo por favor solicite a sua Empresa responsável pelo arquivo físico para cadastrar um responsável."
        ))
      } else {

        let document = new Email({
          title: `ARQUIVO-${title.toString()}`,
          requestType: requestType,
          archive: req.params.id,
          mailSignup: req.authenticated.mailSignup,
          userSernder: req.authenticated._id,
          notes: notes || "",
          receivers: receivers,
          pending: true
        })
        document.save().then(async document => {
          await Archive.updateOne({ _id: req.params.id }, { $set: { pending: true, idemail: document._id } })
        })

        for (const userReceiver of receivers) {
          const user = userReceiver
          // console.log(user)
          const titleSend = `SOLICITAÇÀO DE ${title.toString()}`
          const msg = `O USUÁRIO ${req.authenticated.name} ESTÁ SOLICITANDO ${title.toString()} DE ARQUIVO.`

          sendFirebase(titleSend, msg, user, req.authenticated.mailSignup)
        }

        resp.send({ msg: `SOLICITAÇÃO ENVIADA COM SUSCESSO, LOGO QUE FOR CONCLUÍDO ${title}, VOCÊ SERA NOTIFICADO!` })

      }
    }
  }

  finishPending = async (req, resp, next) => {

    let data = await Email.find({ archive: req.params.id, receivers: { $in: [req.authenticated._id] } }).populate("userSernder")

    if (data.length === 0) {

      resp.send(new MethodNotAllowedError(
        "VOCÊ NÃO PODE FINALIZAR ESSA SOLICITAÇÃO!"
      ))

    } else {
      let inf = data.pop()
      const DataSender = inf.userSernder._id
      const DataTitle = inf.title

      let document = new Email({
        title: `RESP: ${DataTitle}`,
        archive: req.params.id,
        mailSignup: req.authenticated.mailSignup,
        userSernder: req.authenticated._id,
        highlighted: true,
        receivers: DataSender,
        pending: false,
        notes: `SUA SOLICITAÇÃO FOI FINALIZADA!`

      })

      await document.save()
      await Archive.updateOne({ _id: req.params.id }, { $set: { pending: false } })
      await Archive.updateOne({ _id: req.params.id }, { $unset: { idemail: 1 } })


      const titleSend = `RESP: ${DataTitle}`
      const msg = `SUA SOLICITAÇÃO FOI ATENDIDA COM SUSCESSO!`

      await sendFirebase(titleSend, msg, DataSender.toString(), req.authenticated.mailSignup)

      resp.send({ msg: `SOLICITAÇÃO FINALIZADA COM SUSCESSO O USUÁRIO QUE FEZ ESSA SOLICITAÇÃO SERÁ NOTIFICADO` })

    }

  }

  receiveExportArquives = async (req, resp, next) => {

    const QUEUE = "EXPORTFILES_ONE"
    // Error: timeout at [http://localhost:3003/archives?company=5e4a94aa2b422507c4db5b8c&status=ATIVO&mail=gedearchive@gmail.com&departament=null&finalCurrent=undefined&finalIntermediate=undefined&iduser=5f5cbd9499c12214c4ca6cc3&doct=null&location=null&search=null&profile=DAENERYS&_page=0&size=10] 


    const COMPANY = req.body.company
    const SEARCH = req.body.search
    const INITDATE = req.body.initDate || "1900-01-01"
    const ENDDATE = req.body.endDate || "2900-01-01"
    const STATUS = req.body.status
    const LOCATION = req.body.location || ""
    const MAILSIGNUP = req.authenticated.mailSignup
    const IDUSER = req.authenticated._id
    const DOCT = req.body.doct
    const DEPARTAMENT = req.body.departament
    const STOREHOUSE = req.body.storehouse
    const PROFILE = req.authenticated.profiles
    const FINALCURRENT = req.body.finalCurrent || false
    const FINALINTERMEDIATE = req.body.finalIntermediate || false
    const NAME = req.authenticated.name
    const EMAIL = req.authenticated.email




    sendExport(NAME, EMAIL, QUEUE, COMPANY, SEARCH, STOREHOUSE, INITDATE, ENDDATE, STATUS, LOCATION, MAILSIGNUP, IDUSER, DOCT, DEPARTAMENT, PROFILE, FINALCURRENT, FINALINTERMEDIATE)


    resp.send("SOLICITAÇÃO DE EXPORTAÇÃO RECEBIDA COM SUSCESSO, ESTAMOS PROCESSANDO A EXPORTAÇÃO ESTE PROCESSO PODE SER DEMORADO, MAS NAO SE PREOCUPE ASSIM Q FICAR PRONTO TE AVISAMOS.")



  };

  listSheetName = async (req, resp, next) => {


    const { company, doct, departament } = req.query
    const sheets = await Archive.distinct("sheetImport", { company: company, departament: departament, doct: doct })


    const itens = []
    for (const item of sheets) {

      itens.push({ sheetImport: item })

    } resp.send({
      "_links": {
        "self": "listsheetnames",
        "totalPage": sheets.length
      }, items: itens
    })

  }





  applyRoutes(applycation: restify.Server) {
    applycation.patch(`${this.basePath}/startcurrentdate/:id`, [
      this.validateId,
      this.endDateCurrent
    ]);
    applycation.post(`${this.basePath}/date`, [
      authorize("TYWIN", "DAENERYS"),
      this.date
    ]);
    applycation.post(`${this.basePath}/importSmart`, [
      authorize("TYWIN", "DAENERYS"),
      this.importSmart
    ]);
    applycation.post(`${this.basePath}/importSmartImages`, [
      authorize("TYWIN", "DAENERYS"),
      this.importSmartImages
    ]);
    applycation.post(`${this.basePath}/importSmartImagesGed`, [
      authorize("TYWIN", "DAENERYS"),
      this.importSmartImagesGed
    ]);
    applycation.post(`${this.basePath}/import`, [
      authorize("TYWIN", "DAENERYS"),
      this.import
    ]);
    applycation.post(`${this.basePath}/importt`, [
      authorize("TYWIN", "DAENERYS"),
      this.importt
    ]);
    applycation.post(`${this.basePath}/deletesearch`, [
      authorize("DAENERYS"),
      this.DeleteSearch
    ]);
    applycation.post(`${this.basePath}/deletearchives`, [
      authorize("DAENERYS"),
      this.DeleteArchives
    ]);
    applycation.post(`${this.basePath}/search`, [
      authorize("SNOW", "TYWIN", "DAENERYS", 'STARK', 'TULLY', 'VALE'),
      this.find
    ]);
    // applycation.post(`${this.basePath}/cron`, [

    //   this.cron
    // ]);

    cron.schedule('0 18 * * * *', async () => {
      console.log(`Final da sincrozição às ${moment().format()}`)

      try {

        const companies = (await Company.find({})).map(el => { return el._id })


        for (const item of companies) {
          const company = item
          const volumes = (await Volume.find({ company: company, cron: true })).map(el => { return el._id })

          for (const i of volumes) {
            const volume = i
            const dataArchives = await Archive.find({ volume: volume }).count()
            const totalFiles = dataArchives || 0

            if (totalFiles === 0) {

              await Volume.updateOne({ _id: volume }, { $set: { cron: false, lastUpdateVolume: Date.now(), totalArchives: totalFiles, totalPages: 0, records: totalFiles > 0 ? true : false } })

            } else {
              const dataArchivesPictures = await Archive.find({ volume: volume }).populate("picture", "page")

              const dataPictures = dataArchivesPictures.map(el => { return el.picture })


              const newArrayPictures = []
              for (const item of dataPictures) {


                if (item == undefined) {
                  newArrayPictures.push({ "_id": "000000000", "page": 0 })
                } else {
                  newArrayPictures.push(item)
                }
              }

              const dataPages = newArrayPictures.map(el => { return el.page })
              const pages = dataPages.reduce(function (dataPages, i) {

                return dataPages + i;

              })

              await Volume.updateOne({ _id: volume }, { $set: { cron: false, lastUpdateVolume: Date.now(), totalArchives: totalFiles, totalPages: pages} })

            }

            console.log(`Sincronizados ${volume} da empresa id ${company} data e hora ${moment().format()}`)
          }

        }//Sincronizados 60ede30f2608260012b7f3cd da empresa id 5e46d12e4587937fd9d1b1df data e hora 2022-06-01T15:04:25-03:00

        console.log(`Final da sincrozição às ${moment().format()}`)

      } catch (error) {
        console.log(error)

      }
    }, {
      scheduled: true,
      timezone: "America/Sao_Paulo"
    })
    applycation.post(`${this.basePath}/searchsimple`, [
      authorize("SNOW", "TYWIN", "DAENERYS", 'STARK', 'TULLY', 'VALE'),
      this.findSimple
    ]);
    applycation.post(`${this.basePath}/exportarchives`, [
      authorize("SNOW", "TYWIN", "DAENERYS", 'STARK', 'TULLY', 'VALE'),
      this.receiveExportArquives
    ]);
    applycation.get(`${this.basePath}/:id`, [
      authorize("SNOW", "TYWIN", "DAENERYS", 'STARK', 'TULLY', 'VALE'),
      this.validateId,
      this.show
    ]);
    applycation.post(`${this.basePath}`, [
      authorize("TYWIN", "DAENERYS"),
      this.save
    ]);
    applycation.put(`${this.basePath}/:id`, [
      authorize("TYWIN", "DAENERYS"),
      this.validateId,
      this.replace
    ]);
    applycation.patch(`${this.basePath}/:id`, [
      authorize("TYWIN", "DAENERYS"),
      this.validateId,
      this.up
    ]);
    applycation.del(`${this.basePath}/:id`, [
      authorize("TYWIN", "DAENERYS"),
      this.validateId,
      this.vpc
    ]);
    applycation.post(`${this.basePath}/sendemail/:id`, [
      this.validateId,
      this.sendEmail
    ]);
    applycation.post(`${this.basePath}/pendingfinish/:id`, [
      this.validateId,
      this.finishPending
    ]);
    applycation.get(`${this.basePath}`, [
      authorize("SNOW", "TYWIN", "DAENERYS", 'STARK', 'TULLY', 'VALE'),
      this.listSheetName
    ]);
  }
}

export const archivesRouter = new ArchivesRouter();
