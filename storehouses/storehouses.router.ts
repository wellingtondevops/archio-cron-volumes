import { Doct } from './../docts/docts.model';
import { Company } from './../companies/companies.model';
import { authenticate } from './../security/auth.handler';
import { Position } from './../positions/positions.model';
import { ModelRouter } from '../common/model-router'
import * as restify from 'restify'
import { NotFoundError, MethodNotAllowedError } from 'restify-errors'
import { Storehouse } from './storehouses.model'
import { authorize } from '../security/authz.handler'
import { Volume } from '../volumes/volumes.model'
// const cache = require('../cache/cache')

import * as mongoose from 'mongoose'
import { changeKeyObjects } from '../utils/convertObjets';
import { cachedstore } from './cahedstorehouse';
import { cachedpositions } from '../positions/cachedpositions';

class StorehouseRouter extends ModelRouter<Storehouse> {
  constructor() {
    super(Storehouse)
  }
  envelop(document) {
    let resource = super.envelope(document)
    const storID = document.storehouse._id ? document.company._id : document.storehouse
    resource._links.storehouse = `/companies/${storID}`
    return resource
  }

  delete = (req, resp, next) => {

    const params = `storehouseshow:${req.params.id}`
    const prefixSearch = `searchstorehouse`
    const listCompanies = 'liststorehouses'
    Volume.find({ storehouse: req.params.id })
      .then((vol) => {
        if (vol.length === 0) {
          this.model.remove({ _id: req.params.id }).exec().then((cmdResult: any) => {
            if (cmdResult.result.n) {
              resp.send(204)
            } else {
              throw new NotFoundError('Documento não encontrado!')
            }
            return next()
          }).catch(next)
        } else {
          throw new MethodNotAllowedError('Este Armázem não pode ser excluído pois possui Volumes registrados!')
        }
      }).catch(next)

    // cache.del(params)
    // cache.delPrefix(prefixSearch)
    // cache.delPrefix(listCompanies)
  }
  find = (req, resp, next) => {
    let page = parseInt(req.query._page || 1)
    page += 1
    const skip = (page - 1) * this.pageSize
    Storehouse
      .count(Storehouse.find({
        mailSignup: req.authenticated.mailSignup
      })).exec()
      .then(count => Storehouse.find({
        mailSignup: req.authenticated.mailSignup
      }).populate('author', ' name email')
        .skip(skip)
        .limit(this.pageSize)
        .then(this.renderAll(resp, next, {
          page, count, pageSize: this.pageSize, url: req.url
        })))
      .catch(next)
  }
  filter = async (req, resp, next) => {

    const recebe = req.body.name || ""
    const regex = new RegExp(recebe, 'i')

    const keybords = JSON.stringify(req.body).replace("{", "").replace("}", "") // tudo q o user digitou nos filtros.


    // let params = `searchstorehouse:singnup-${req.authenticated.mailSignup}-terms-${keybords}`


    // const cached = await cache.get(params)
    // if (cached) {
    //   resp.send(cached)

    // } else {

    let page = parseInt(req.query._page || 1)
    page += 1
    const skip = (page - 1) * this.pageSize

    let query = { mailSignup: req.authenticated.mailSignup, name: regex }

    Storehouse

      .count(Storehouse.find(
        query
      )).exec()

      .then(count => Storehouse.find(query).populate('author', ' name email')
        .skip(skip)
        .limit(this.pageSize)

        .then(this.renderAll(resp, next, {
          page, count, pageSize: this.pageSize, url: req.url
        })))


      .catch(next)

    //cachedstore(query, this.pageSize, params, req.url, page)


  }


  searchpositions = async (req, resp, next) => {
    try {


      //  try {
      const recebe = req.body.position || ""
      const regex = new RegExp(recebe, 'i')

      let query = {}
      const keybords = JSON.stringify(req.body).replace("{", "").replace("}", "") // tudo q o user digitou nos filtros.


      // let params = `searchpositions:idposition-${req.params.id}-terms-${keybords}-postition-${recebe}-page-${req.query._page}`

      // const cached = await cache.get(params)
      // if (cached) {
      //   resp.send(cached)

      // } else {


      let page = parseInt(req.query._page || 1);
      let Size = parseInt(req.query.size || 10);
      this.pageSize = Size;
      page += 1;
      const skip = (page - 1) * this.pageSize;

      let { used } = req.body

      if (used === undefined) {
        query = { mailSignup: req.authenticated.mailSignup, storehouse: req.params.id, position: regex }

      } else {
        query = { mailSignup: req.authenticated.mailSignup, storehouse: req.params.id, position: regex, used: used }
      }

      Position

        .count(Position.find(
          query
        )).exec()
        .then(count => Position.find(query).skip(skip)
          .select('-author')
          .select('-mailSignup')
          .select('-dateCreated')
          .select('-__v')
          .select('-street')
          .populate('company', 'name')
          .populate('departament', 'name')
          .limit(this.pageSize)
          .then(this.renderAll(resp, next, {
            page, count, pageSize: this.pageSize, url: req.url
          })))
        .catch(next)
      //cachedpositions(query, params, req.url, req.query._page, req.query.size)
    } catch (error) {

      console.log("error---> in storehouse", error)

    }




  }

  //  } catch (error) {
  //    console.log("deu ruim chamando coisa errada" )

  //  }



  // }


  save = async (req, resp, next) => {
    let document = new Storehouse({
      name: req.body.name,
      author: req.authenticated._id,
      mailSignup: req.authenticated.mailSignup,
      mapStorehouse: req.body.mapStorehouse
    })

    Storehouse.find({ mailSignup: req.authenticated.mailSignup, name: req.body.name })
      .then(async (stor) => {
        if (stor.length === 0) {
          await document.save()
            .then(this.render(resp, next))
        } else {
          throw new MethodNotAllowedError('Armazém já Cadastrador, por favor cadastro um outro...')
        }
      }).catch(next)

  }
  chartcompany = async (req, resp, next) => {

    let dataIni = await Position.aggregate(
      [
        { $match: { storehouse: mongoose.Types.ObjectId(req.params.id), used: true } },
        {
          $lookup: {
            from: "companies",
            localField: "company",
            foreignField: "_id",
            as: "companyName"
          }
        },
        { $unwind: "$companyName" },

        { $group: { _id: { companyName: "$companyName.name" }, caixas: { $sum: 1 } } },

      ]
    ).sort('caixas')


    let data = []

    let freedon = await Position.find({ storehouse: mongoose.Types.ObjectId(req.params.id), used: false }).count()
    let e = {
      company: "POSIÇÕES LIVRES",
      positions: freedon
    }
    await data.push(e)
    let caixas = dataIni.map((el: any) => { return el.caixas })
    let empresa = dataIni.map((el: any) => { return el._id.companyName })
    for (let i = 0; caixas.length > i && empresa.length > i; i++) {


      let d = {
        company: empresa[i],
        positions: caixas[i]
      }
      data.push(d)
    }
    resp.send({ data })
  }

  chartstreet = async (req, resp, next) => {


    // let params = `charstreet:${req.params.id}`
    // const cached = await cache.get(params)

    // if (cached) {
    //   resp.send(cached)

    // } else {
    let st = await Position.distinct("street", { storehouse: mongoose.Types.ObjectId(req.params.id) })

    let datas = []

    for (let i = 0; st.length > i; i++) {

      let val = await Position.find({ storehouse: mongoose.Types.ObjectId(req.params.id), used: true, street: st[i] }).count()

      let obj = {
        y: val || 0,
        x: "Rua",
        street: st[i]
      }

      datas.push(obj)
    }


    let totalPositions = await
      Position.aggregate(
        [

          {
            $match: {
              mailSignup: {
                $in: [
                  req.authenticated.mailSignup
                ]
              },
              storehouse: mongoose.Types.ObjectId(req.params.id)


            }
          },
          {
            "$addFields": {
              "__count_by_value": {
                "k": "Rua",
                "v": "$street"
              }
            }
          },
          {
            "$group": {
              "_id": {
                "__alias_0": "$__count_by_value.k",
                "__alias_1": "$__count_by_value.v"
              },
              "__alias_2": {
                "$sum": {
                  "$cond": [
                    {
                      "$ne": [
                        {
                          "$type": "$street"
                        },
                        "missing"
                      ]
                    },
                    1,
                    0
                  ]
                }
              }
            }
          },
          {
            "$project": {
              "_id": 0,
              "__alias_0": "$_id.__alias_0",
              "__alias_1": "$_id.__alias_1",
              "__alias_2": 1
            }
          },
          {
            "$project": {
              "y": "$__alias_2",
              "x": "$__alias_0",
              "Street": "$__alias_1",
              "_id": 0
            }
          },
          {
            "$group": {
              "_id": {},
              "__grouped_docs": {
                "$push": "$$ROOT"
              }
            }
          },
          {
            "$unwind": "$__grouped_docs"
          },
          {
            "$replaceRoot": {
              "newRoot": "$__grouped_docs"
            }
          },
          {
            "$limit": 5000
          }
        ]

      ).sort('Street')

    let d = {
      data: datas,
      totalPositions: totalPositions
    }
    // cache.set(params, d, 60 * 4)
    resp.send(d)

  }

  show = async (req, resp, next) => {


    // let params = `storehouseshow:${req.params.id}`
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






  up = (req, resp, next) => {

    // const params = `storehouseshow:${req.params.id}`
    // const prefixSearch = `searchstorehouse`
    // const listCompanies = 'liststorehouses'


    // cache.del(params)
    // cache.delPrefix(prefixSearch)
    // cache.delPrefix(listCompanies)

    const options = { runValidators: true, new: true }
    this.model.findByIdAndUpdate(req.params.id, req.body, options)
      .then(this.render(resp, next))
      .catch(next)
  }




  applyRoutes(applycation: restify.Server) {

    applycation.post(`${this.basePath}/search`, [authorize('SNOW', 'TYWIN', 'DAENERYS'), this.filter])
    applycation.post(`${this.basePath}/:id/searchpositions`, [authorize('SNOW', 'TYWIN', 'DAENERYS'), this.searchpositions])
    applycation.get(`${this.basePath}`, [authorize('SNOW', 'TYWIN', 'DAENERYS', 'STARK', 'TULLY'), this.find])
    applycation.get(`${this.basePath}/:id`, [authorize('SNOW', 'TYWIN', 'DAENERYS', 'STARK', 'TULLY'), this.validateId, this.findById])
    applycation.get(`${this.basePath}/:id/chartcompany`, [authorize('SNOW', 'TYWIN', 'DAENERYS', 'STARK', 'TULLY'), this.validateId, this.chartcompany])
    applycation.get(`${this.basePath}/:id/chartstreet`, [authorize('SNOW', 'TYWIN', 'DAENERYS', 'STARK', 'TULLY'), this.validateId, this.chartstreet])
    applycation.post(`${this.basePath}`, [authorize('DAENERYS'), this.save])
    applycation.put(`${this.basePath}/:id`, [authorize('DAENERYS'), this.validateId, this.up])
    applycation.patch(`${this.basePath}/:id`, [authorize('DAENERYS'), this.validateId, this.replace])
    applycation.del(`${this.basePath}/:id`, [authorize('DAENERYS'), this.validateId, this.delete])

  }
}
export const storehousesRouter = new StorehouseRouter()