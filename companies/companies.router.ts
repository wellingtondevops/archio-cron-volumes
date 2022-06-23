import { ModelRouter } from "../common/model-router";
import * as restify from "restify";
import { NotFoundError, MethodNotAllowedError } from "restify-errors";
import { Company } from "./companies.model";
import { authorize } from "../security/authz.handler";
import { Volume } from "../volumes/volumes.model";
import { User } from "../users/users.model";
import { authenticate } from '../security/auth.handler';
import { Departament } from '../departaments/departaments.model';
import * as mongoose from 'mongoose'
import { Archive } from '../archives/archives.model';
import { Doct } from '../docts/docts.model';
import { ReduceDocument } from "../reducedocuments/reducedocuments.model";
import { getArraySum } from "../utils/arraySum";
import { ReduceDepartament } from "../reducedepartaments/reducedepartaments.model";
import { Pictures } from '../pictures/pictures.model';
import { niceBytes } from '../utils/niceBytes'
import { cachedcompany } from "./chachedcompanies";
// const cache = require('../cache/cache')


class CompaniesRouter extends ModelRouter<Company> {
  constructor() {
    super(Company);
  }

  envelop(document) {
    let resource = super.envelope(document);
    resource._links.listSeal = `${this.basePath}/${resource._id}`;
    return resource;
  }

  save = async (req, resp, next) => {
    let document = new Company({
      name: req.body.name,
      adress: req.body.adress,
      province: req.body.province,
      city: req.body.city,
      fone: req.body.fone,
      email: req.body.email,
      answerable: req.body.answerable,
      typePerson: req.body.typePerson,
      cnpj: req.body.cnpj,
      cpf: req.body.cpf,
      author: req.authenticated._id,
      mailSignup: req.authenticated.mailSignup
    });
    Company.find({
      mailSignup: req.authenticated.mailSignup,
      name: req.body.name
    })
      .then(async com => {
        if (com.length === 0) {
          await document.save().then(this.render(resp, next));
        } else {
          throw new MethodNotAllowedError(
            "Companhia já Cadastrada, por favor cadastro um outra..."
          );
        }
      })
      .catch(next);
  };
  find = async (req, resp, next) => {
    //let Size = parseInt(req.query.size)
    //this.pageSize = Size
    let page = parseInt(req.query._page || 1);
    page = page + 1;
    const skip = (page - 1) * this.pageSize;

    let profile = req.authenticated.profiles.toString()

    if (profile === 'DAENERYS') {
      Company.count(
        Company.find({
          mailSignup: req.authenticated.mailSignup
        })
      )
        .exec()
        .then(count =>
          Company.find({
            mailSignup: req.authenticated.mailSignup
          })
            .populate("author", " name email")
            .skip(skip)
            .sort('name')
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
      let user = await User.find({ _id: req.authenticated._id })
        .select("permissions.docts")
        .select("permissions.company");
      let data = user[0].permissions.map(item => {
        return item.docts;
      });

      let doct = data;

      let data2 = user[0].permissions.map(item => {
        return item.company;
      });

      let company = data2;

      Company.count(
        Company.find({
          mailSignup: req.authenticated.mailSignup,
          _id: company
        })
      )
        .exec()
        .then(count =>
          Company.find({
            mailSignup: req.authenticated.mailSignup,
            _id: company
          })
            .populate("author", " name email")
            .sort('name')
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
  };

  del = async (req, resp, next) => {
   
    const params = `companyshow:${req.params.id}`
    const prefixSearch = `searchcompanies`
    const listCompanies = 'listcompanies'
    

    
   await Volume.find({ company: req.params.id })

    
      .then(vol => {
        if (vol.length === 0) {
          this.model
            .remove({ _id: req.params.id })
            .exec()
            .then((cmdResult: any) => {
              if (cmdResult.result.n) {
                resp.send(204);
              } else {
                throw new NotFoundError("Companhia não encontrado!");
              }
              return next();
            })
            .catch(next);
        } else {
          throw new MethodNotAllowedError(
            "Esta Companhia não pode ser excluído pois possui registro Associdado"
          );
        }
      })
      .catch(next);
      // cache.del(params)
      // cache.delPrefix(prefixSearch)
      // cache.delPrefix(listCompanies)

    

  };

  filter = async (req, resp, next) => {
    const recebe = req.body.name || "";
    const regex = new RegExp(recebe, "ig");

    const keybords = JSON.stringify(req.body).replace("{", "").replace("}", "") // tudo q o user digitou nos filtros.

    // let endpoint = "searchcompanies"
    // let params = `${endpoint}:userid-${req.authenticated._id}-terms-${keybords}-page-${req.query._page}`


    // const cached = await cache.get(params)
    // if (cached) {
    //   // console.log("com cache")
    //   resp.send(cached)

    // } else {

      // console.log("sem cache")
      let page = parseInt(req.query._page || 1);
      let Size = parseInt(req.query.size || 10);
      this.pageSize = Size;
      page += 1;
      const skip = (page - 1) * this.pageSize;


      let profile = req.authenticated.profiles.toString()

      let query = { mailSignup: req.authenticated.mailSignup, name: regex }

      if (profile === 'DAENERYS') {
        Company
          .count(
            Company.find(query)
          )
          .exec()
          .then(count =>
            Company.find(query)
              .select("name  fone email dateCreated")
              .sort('name')
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
        // cachedcompany(query,  params, req.url, req.query._page, req.query.size )
      } else {

        let user = await User.find({ _id: req.authenticated._id })
          .select("permissions.docts")
          .select("permissions.company");
        let data = user[0].permissions.map(item => {
          return item.docts;
        });

        let doct = data;

        let data2 = user[0].permissions.map(item => {
          return item.company;
        });

        let company = data2;

        const query = {
          mailSignup: req.authenticated.mailSignup,
          _id: company,
          name: regex
        }

        Company.count(
          Company.find(query)
        )
          .exec()
          .then(count =>
            Company.find(query)
              .select("name  fone email dateCreated")
              .sort('name')
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

          // cachedcompany(query,  params, req.url, req.query._page, req.query.size )
      }


    }


  

  reports = async (req, resp, next) => {
    let _initDate = req.body.initDate || "1900-01-01";
    let _endDate = req.body.endDate || "2900-01-01";
    let __initDate = new Date(_initDate)
    let __endDate = new Date(_endDate)
    let endDate = new Date(__endDate.setDate(__endDate.getDate() + 1))

    let initDate = new Date(__initDate.setDate(__initDate.getDate() + 1))
    // console.log(`data inicial: ${initDate} -  data final: ${endDate}`)

    const Comp = await Company.find({ _id: mongoose.Types.ObjectId(req.body.company) }).populate('company', 'name')
    let companyName = Comp.map(el => { return el.name }).toString()

    const totalsDepartaments = await ReduceDepartament.aggregate([
      { $match: { company: mongoose.Types.ObjectId(req.body.company) } },
      {
        $project: {
          "_id": 0,
          "departamentName": 1,
          "totalVolumesDepartaments": 1,
          "totalArchivesDepartaments": 1,
          "totalPageArchiveDepartament": 1
        }
      }
    ]).sort("departamentName")
   

    //periodos ====
    const agredArchives = await ReduceDepartament.aggregate([
      {
        $match: {
          company: mongoose.Types.ObjectId(req.body.company),
        },

      }, {
        "$unwind": "$aggregateDateArchives"
      },
      {
        $match: {
          "aggregateDateArchives.dateOcorr": {
            $gte: initDate
            ,
            $lte: endDate
          }
        }
      },
      {
        "$group": {
          "_id": {
            "__alias_0": "$departamentName"
          },
          "__alias_1": {
            "$sum": {
              "$cond": [
                {
                  "$ne": [
                    {
                      "$type": "$aggregateDateArchives.dateOcorr"
                    },
                    "missing"
                  ]
                },
                1,
                0
              ]
            }
          },
          "__alias_2": {
            "$sum": "$aggregateDateArchives.total"
          }
        }
      },
      {
        "$project": {
          "_id": 0,
          "__alias_0": "$_id.__alias_0",
          "__alias_1": 1,
          "__alias_2": 1
        }
      },
      {
        "$project": {
          "departamentName": "$__alias_0",
          "y_series_0": "$__alias_2",
          "_id": 0
        }
      },
      {
        "$addFields": {
          "__agg_sum": {
            "$sum": [
              "$y",
              "$y_series_0"
            ]
          }
        }
      },
      {
        "$sort": {
          "departamentName": 1
        }
      },
      {
        "$project": {
          "__agg_sum": 0
        }
      },
      {
        "$project": {
          "__agg_sum": 0
        }
      },
      {
        "$addFields": {
          "__multi_series": {
            "$objectToArray": {
              "sum ( aggregateDateArchives total )": "$y_series_0",
              "count ( aggregateDateArchives dateOcorr )": "$y"
            }
          }
        }
      },
      {
        "$unwind": "$__multi_series"
      },
      {
        "$addFields": {

          "totalArchivesDepartaments": "$__multi_series.v"
        }
      },
      {
        "$project": {
          "__multi_series": 0,
          "y_series_0": 0
        }
      }

    ])
    const periodVolumesDepartaments = await ReduceDepartament.aggregate([
      {
        $match: {
          company: mongoose.Types.ObjectId(req.body.company),
        },

      }, {
        "$unwind": "$aggregateDateVolumes"
      },
      {
        $match: {
          "aggregateDateVolumes.dateOcorr": {
            $gte: initDate
            ,
            $lte: endDate
          }
        }
      },
      {
        "$group": {
          "_id": {
            "__alias_0": "$departamentName"
          },
          "__alias_1": {
            "$sum": {
              "$cond": [
                {
                  "$ne": [
                    {
                      "$type": "$aggregateDateVolumes.dateOcorr"
                    },
                    "missing"
                  ]
                },
                1,
                0
              ]
            }
          },
          "__alias_2": {
            "$sum": "$aggregateDateVolumes.total"
          }
        }
      },
      {
        "$project": {
          "_id": 0,
          "__alias_0": "$_id.__alias_0",
          "__alias_1": 1,
          "__alias_2": 1
        }
      },
      {
        "$project": {

          "departamentName": "$__alias_0",
          "y_series_0": "$__alias_2",
          "_id": 0
        }
      },
      {
        "$addFields": {
          "__agg_sum": {
            "$sum": [
              "$y",
              "$y_series_0"
            ]
          }
        }
      },
      {
        "$sort": {
          "departamentName": 1
        }
      },
      {
        "$project": {
          "__agg_sum": 0
        }
      },
      {
        "$project": {
          "__agg_sum": 0
        }
      },
      {
        "$addFields": {
          "__multi_series": {
            "$objectToArray": {
              "sum ( aggregateDateVolumes total )": "$y_series_0",
              "count ( aggregateDateVolumes dateOcorr )": "$y"
            }
          }
        }
      },
      {
        "$unwind": "$__multi_series"
      },
      {
        "$addFields": {

          "totalVolumesDepartaments": "$__multi_series.v"
        }
      },
      {
        "$project": {
          "__multi_series": 0,
          "y_series_0": 0
        }
      }

    ])

    const archivesDoct = await ReduceDocument.aggregate([
      {
        $match: {
          company: mongoose.Types.ObjectId(req.body.company),
        },

      }, {
        "$unwind": "$aggregateDateArchives"
      },
      {
        $match: {
          "aggregateDateArchives.dateOcorr": {
            $gte: initDate
            ,
            $lte: endDate
          }
        }
      },
      {
        "$group": {
          "_id": {
            "__alias_0": "$documentName"
          },
          "__alias_1": {
            "$sum": {
              "$cond": [
                {
                  "$ne": [
                    {
                      "$type": "$aggregateDateArchives.dateOcorr"
                    },
                    "missing"
                  ]
                },
                1,
                0
              ]
            }
          },
          "__alias_2": {
            "$sum": "$aggregateDateArchives.total"
          }
        }
      },
      {
        "$project": {
          "_id": 0,
          "__alias_0": "$_id.__alias_0",
          "__alias_1": 1,
          "__alias_2": 1
        }
      },
      {
        "$project": {

          "documentName": "$__alias_0",
          "y_series_0": "$__alias_2",
          "_id": 0
        }
      },
      {
        "$addFields": {
          "__agg_sum": {
            "$sum": [
              "$y",
              "$y_series_0"
            ]
          }
        }
      },
      {
        "$sort": {
          "documentName": 1
        }
      },
      {
        "$project": {
          "__agg_sum": 0
        }
      },
      {
        "$project": {
          "__agg_sum": 0
        }
      },
      {
        "$addFields": {
          "__multi_series": {
            "$objectToArray": {
              "sum ( aggregateDateArchives total )": "$y_series_0",
              "count ( aggregateDateArchives dateOcorr )": "$y"
            }
          }
        }
      },
      {
        "$unwind": "$__multi_series"
      },
      {
        "$addFields": {

          "totalArquivosDocuments": "$__multi_series.v"
        }
      },
      {
        "$project": {
          "__multi_series": 0,
          "y_series_0": 0
        }
      }

    ])

    const pageDoct = await ReduceDocument.aggregate([
      {
        $match: {
          company: mongoose.Types.ObjectId(req.body.company),
        },

      }, {
        "$unwind": "$aggregateDatePagesArchives"
      },
      {
        $match: {
          "aggregateDatePagesArchives.dateOcorr": {
            $gte: initDate
            ,
            $lte: endDate
          }
        }
      },
      {
        "$group": {
          "_id": {
            "__alias_0": "$documentName"
          },
          "__alias_1": {
            "$sum": {
              "$cond": [
                {
                  "$ne": [
                    {
                      "$type": "$aggregateDatePagesArchives.dateOcorr"
                    },
                    "missing"
                  ]
                },
                1,
                0
              ]
            }
          },
          "__alias_2": {
            "$sum": "$aggregateDatePagesArchives.total"
          }
        }
      },
      {
        "$project": {
          "_id": 0,
          "__alias_0": "$_id.__alias_0",
          "__alias_1": 1,
          "__alias_2": 1
        }
      },
      {
        "$project": {

          "documentName": "$__alias_0",
          "y_series_0": "$__alias_2",
          "_id": 0
        }
      },
      {
        "$addFields": {
          "__agg_sum": {
            "$sum": [
              "$y",
              "$y_series_0"
            ]
          }
        }
      },
      {
        "$sort": {
          "documentName": 1
        }
      },
      {
        "$project": {
          "__agg_sum": 0
        }
      },
      {
        "$project": {
          "__agg_sum": 0
        }
      },
      {
        "$addFields": {
          "__multi_series": {
            "$objectToArray": {
              "sum ( aggregateDatePagesArchives total )": "$y_series_0",
              "count ( aggregateDatePagesArchives dateOcorr )": "$y"
            }
          }
        }
      },
      {
        "$unwind": "$__multi_series"
      },
      {
        "$addFields": {

          "totalPagesDocuments": "$__multi_series.v"
        }
      },
      {
        "$project": {
          "__multi_series": 0,
          "y_series_0": 0
        }
      }

    ])

    const pageDep = await ReduceDepartament.aggregate([
      {
        $match: {
          company: mongoose.Types.ObjectId(req.body.company),
        },

      }, {
        "$unwind": "$aggregateDatePagesArchives"
      },
      {
        $match: {
          "aggregateDatePagesArchives.dateOcorr": {
            $gte: initDate
            ,
            $lte: endDate
          }
        }
      },
      {
        "$group": {
          "_id": {
            "__alias_0": "$departamentName"
          },
          "__alias_1": {
            "$sum": {
              "$cond": [
                {
                  "$ne": [
                    {
                      "$type": "$aggregateDatePagesArchives.dateOcorr"
                    },
                    "missing"
                  ]
                },
                1,
                0
              ]
            }
          },
          "__alias_2": {
            "$sum": "$aggregateDatePagesArchives.total"
          }
        }
      },
      {
        "$project": {
          "_id": 0,
          "__alias_0": "$_id.__alias_0",
          "__alias_1": 1,
          "__alias_2": 1
        }
      },
      {
        "$project": {

          "departamentName": "$__alias_0",
          "y_series_0": "$__alias_2",
          "_id": 0
        }
      },
      {
        "$addFields": {
          "__agg_sum": {
            "$sum": [
              "$y",
              "$y_series_0"
            ]
          }
        }
      },
      {
        "$sort": {
          "departamentName": 1
        }
      },
      {
        "$project": {
          "__agg_sum": 0
        }
      },
      {
        "$project": {
          "__agg_sum": 0
        }
      },
      {
        "$addFields": {
          "__multi_series": {
            "$objectToArray": {
              "sum ( aggregateDatePagesArchives total )": "$y_series_0",
              "count ( aggregateDatePagesArchives dateOcorr )": "$y"
            }
          }
        }
      },
      {
        "$unwind": "$__multi_series"
      },
      {
        "$addFields": {

          "totalPagesDepartaments": "$__multi_series.v"
        }
      },
      {
        "$project": {
          "__multi_series": 0,
          "y_series_0": 0
        }
      }

    ])
    const totalsDocuments = await ReduceDocument.aggregate([

      { $match: { company: mongoose.Types.ObjectId(req.body.company) } },
      {
        $project: {
          "_id": 0,
          "documentName": 1,
          "totalArchivesDocuments": 1,
          "totalArchivesDepartaments": 1,
          "totalPageArchiveDocument": 1
        }
      }
    ]).sort("documentName")
    const size = await Pictures.aggregate([
      {
        $match: {
          company: mongoose.Types.ObjectId(req.body.company),
        }
      },
      {
        $group: {

          _id: null, count: { $sum: "$size" }
        }
      }
    ])

    ////DEPARTAMENTS
    let totailsDepartametName = totalsDepartaments.map(function (totalsDepartaments: any) {
      return totalsDepartaments.departamentName;
    })
    let totailsDepartametVolume = totalsDepartaments.map(function (totalsDepartaments: any) {
      return totalsDepartaments.totalVolumesDepartaments;
    })
    let totailsDepartametArchive = totalsDepartaments.map(function (totalsDepartaments: any) {
      return totalsDepartaments.totalArchivesDepartaments;
    })

    // console.log(totalsDepartaments)
    let totalPageArchiveDepartament = totalsDepartaments.map(function (totalsDepartaments: any) {

      if (totalsDepartaments.totalPageArchiveDepartament == '') {
        return 0
      } else {
        return totalsDepartaments.totalPageArchiveDepartament
      }
    })

    let departamentTotalVolumes = 0
    let departamentPeridoVolumes = 0
    let departamentTotalArchives = 0
    let departamentPeridoArchives = 0

    let departperidoVolumes = 0
    let departperidoArchives = 0
    let departamentTotalPages = 0

    let departamentPeridoPages = 0
    let DEPARTAMENT = []



    for (let i = 0;totalPageArchiveDepartament.length && totalsDepartaments.length && totailsDepartametName.length && totailsDepartametVolume.length && totailsDepartametArchive.length > i; i++) {

      let tot = {}
      if (totalPageArchiveDepartament[i] === 0) {
        tot = 0

      } else {
        tot = totalPageArchiveDepartament[i].map(function (totalPageArchiveDepartament: any) {
          return totalPageArchiveDepartament.total;
        })
      }
      let totArchiv = tot.toString()

 

      let _depObjet = periodVolumesDepartaments.filter(function (periodVolumesDepartament: any) {
        return periodVolumesDepartament.departamentName === totailsDepartametName[i];
      })
      let depObjet = _depObjet.map(function (_depObjet: any) {
        return _depObjet.totalVolumesDepartaments;
      }).toString()


      let _depObjetArc = agredArchives.filter(function (agredArchive: any) {
        return agredArchive.departamentName === totailsDepartametName[i];
      })
      let depObjetArc = _depObjetArc.map(function (_depObjetArc: any) {
        return _depObjetArc.totalArchivesDepartaments;
      }).toString()

      //
      let _archpageObjet = pageDep.filter(function (pageDep: any) {
        return pageDep.departamentName === totailsDepartametName[i];
      })
      let archpageObjet = _archpageObjet.map(function (_archpageObjet: any) {
        return _archpageObjet.totalPagesDepartaments;
      }).toString()

      departamentTotalVolumes = departamentTotalVolumes + totailsDepartametVolume[i]

      departamentPeridoVolumes = getArraySum(depObjet)

      departamentTotalArchives = departamentTotalArchives + totailsDepartametArchive[i]

      departamentPeridoArchives = getArraySum(depObjetArc)



      DEPARTAMENT.push({
        departamentName: totailsDepartametName[i],
        totalVolumes: totailsDepartametVolume[i],
        periodVolumes: parseInt(depObjet) || 0,
        totalArchives: totailsDepartametArchive[i],
        periodArchives: parseInt(depObjetArc) || 0,
        departamentTotalPages: parseInt(totArchiv),
         departamentPeridoPages: parseInt(archpageObjet) || 0,

      })



      let tvol = DEPARTAMENT.map(el => { return el.periodVolumes })
      let ArcPerido = DEPARTAMENT.map(el => { return el.periodArchives })

      let soma = tvol.reduce(function (total, proximo) {
        return total + proximo;
      });

      let soma2 = ArcPerido.reduce(function (total, proximo) {
        return total + proximo;
      });



      departperidoVolumes = soma
      departperidoArchives = soma2
    }

    ///////DOCUMENTS

    let totailsDocumentName = totalsDocuments.map(function (totalsDocument: any) {
      return totalsDocument.documentName;
    })

    let totalArchivesDocuments = totalsDocuments.map(function (totalsDocument: any) {
      return totalsDocument.totalArchivesDocuments;
    })

    let totalPageArchiveDocument = totalsDocuments.map(function (totalsDocument: any) {

      if (totalsDocument.totalPageArchiveDocument == '') {
        return 0
      } else {
        return totalsDocument.totalPageArchiveDocument
      }
    })


    let DOCUMENT = []
    let documentTotalArchives = 0
    let documentPeridoArchives = 0
    let documentTotalPages = 0

    let documentPeridoPages = 0
    for (let i = 0; totailsDocumentName.length && totalArchivesDocuments.length && totalPageArchiveDocument.length > i; i++) {

      let tot = {}
      if (totalPageArchiveDocument[i] === 0) {
        tot = 0

      } else {
        tot = totalPageArchiveDocument[i].map(function (totalPageArchiveDocument: any) {
          return totalPageArchiveDocument.total;
        })
      }
      let totArchiv = tot.toString()

      let _archObjet = archivesDoct.filter(function (archivesDoct: any) {
        return archivesDoct.documentName === totailsDocumentName[i];
      })
      let archObjet = _archObjet.map(function (_archObjet: any) {
        return _archObjet.totalArquivosDocuments;
      }).toString()

      let _archpageObjet = pageDoct.filter(function (pageDoct: any) {
        return pageDoct.documentName === totailsDocumentName[i];
      })
      let archpageObjet = _archpageObjet.map(function (_archpageObjet: any) {
        return _archpageObjet.totalPagesDocuments;
      }).toString()

      documentTotalArchives = documentTotalArchives + totalArchivesDocuments[i]

      // documentPeridoArchives = getArraySum(archObjet)

      DOCUMENT.push({
        documentName: totailsDocumentName[i],
        totalArchives: totalArchivesDocuments[i],
        periodArquivos: parseInt(archObjet) || 0,
        totalPageArchive: parseInt(totArchiv),
        periodPageArchive: parseInt(archpageObjet) || 0,
      })

      let periodArchiv = DOCUMENT.map(el => { return el.periodArquivos })
      let page = DOCUMENT.map(el => { return el.totalPageArchive })
      let pagePerido = DOCUMENT.map(el => { return el.periodPageArchive })

      let soma = page.reduce(function (total, proximo) {
        return total + proximo;
      });

      let soma2 = pagePerido.reduce(function (total, proximo) {
        return total + proximo;
      });
      let soma3 = periodArchiv.reduce(function (total, proximo) {
        return total + proximo;
      });
      documentTotalPages = soma
      documentPeridoPages = soma2
      documentPeridoArchives = soma3



    }


    let realSize = size.map(function (size: any) {
      return size.count
    }).toString()
    let real = parseInt(realSize)






    const Report = {
      companyName: companyName,
      initialPeriod: new Date(initDate.setDate(initDate.getDate())),
      finalPeriod: endDate,
      totalDepartamentVolumes: departamentTotalVolumes,
      totalDepartamentArchives: departamentTotalArchives,
      peridoDepartamentVolumes: departperidoVolumes,
      peridoDepartamentArchives: departperidoArchives,
      totalDocumentArchives: documentTotalArchives,
      totalDocumentPages: documentTotalPages,
      periodDocumentArchives: documentPeridoArchives,
      periodDocumentPages: documentPeridoPages,
      usedSpace: niceBytes(real),
      DEPARTAMENT,
      DOCUMENT
    }
    resp.send(Report)

  };
  show = async (req, resp, next) => {

    let endpoint='companyshow'
    // let params = `${endpoint}:${req.params.id}`
    // const cached = await cache.get(params)

    // if (cached) {

    //   resp.send(
    //     cached
    //   )

    // } else {

      const show = await this.prepareOne(this.model.findById(req.params.id))
      // cache.set(params, show, 60 * 4)
      resp.send(
        show
      )

    }
  
  up = async (req, resp, next) => {

    const params = `companyshow:${req.params.id}`
    const prefixSearch = `searchcompanies`
    const listCompanies = 'listcompanies'
    

    // cache.del(params)
    // cache.delPrefix(prefixSearch)
    // cache.delPrefix(listCompanies)
    const options = { runValidators: true, new: true }
    this.model.findByIdAndUpdate(req.params.id, req.body, options)
      .then(this.render(resp, next))
      .catch(next)
  }

 





  applyRoutes(applycation: restify.Server) {




    applycation.post(`${this.basePath}/totalcollection`, [authorize("DAENERYS", "STARK"), this.reports]);

    applycation.post(`${this.basePath}/search`, [
      authorize("SNOW", "TYWIN", "DAENERYS"),
      this.filter
    ]);
    applycation.get(`${this.basePath}`, [

      this.find
    ]);
    applycation.get(`${this.basePath}/:id`, [

      this.validateId,
      this.show
    ]);
    applycation.post(`${this.basePath}`, [authorize("DAENERYS"), this.save]);
    applycation.put(`${this.basePath}/:id`, [
      authorize("DAENERYS"),
      this.validateId,
      this.replace
    ]);
    applycation.patch(`${this.basePath}/:id`, [
      authorize("DAENERYS"),
      this.validateId,
      this.up
    ]);
    applycation.del(`${this.basePath}/:id`, [
      authorize("DAENERYS"),
      this.validateId,
      this.del
    ]);
    applycation.get(`${this.basePath}`, [

      this.find
    ]);
  }
}
export const companiesRouter = new CompaniesRouter();
