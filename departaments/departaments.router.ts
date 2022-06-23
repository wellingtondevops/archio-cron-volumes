import { ModelRouter } from '../common/model-router'
import * as restify from 'restify'
import * as mongoose from 'mongoose'
import { NotFoundError, MethodNotAllowedError } from 'restify-errors'
import { Departament } from './departaments.model';
import { Volume } from '../volumes/volumes.model'
import { authorize } from '../security/authz.handler'
import { ObjectId } from 'bson';
import { Company } from '../companies/companies.model';
import { cacheddepartaments } from './cacheddepartaments';
// const cache = require('../cache/cache')


class DepartamentsRouter extends ModelRouter<Departament> {
    constructor() {
        super(Departament)
    }
    protected prepareOne(query: mongoose.DocumentQuery<Departament, Departament>): mongoose.DocumentQuery<Departament, Departament> {
        return query
            .populate('company', 'name')


    }

    envelop(document) {
        let resource = super.envelope(document)
        const depID = document.departament._id ? document.departament._id : document.departament
        resource._links.departament = `/departaments/${depID}`
        return resource
    }


    save = async (req, resp, next) => {

        let document = new Departament({
            company: req.body.company,
            name: req.body.name,
            author: req.authenticated._id,
            mailSignup: req.authenticated.mailSignup
        })

        this.model.find({
            mailSignup: req.authenticated.mailSignup,
            company: req.body.company,
            name: req.body.name
        })
            .then(async (dep) => {

                if (dep.length === 0) {
                    await document.save()
                        .then(this.render(resp, next))
                } else {
                    throw new MethodNotAllowedError('Departamento já Cadastrado, por favor cadastro um outro...')
                }
            }).catch(next)
    }

    find = (req, resp, next) => {

        let page = parseInt(req.query._page || 1)
        page = page + 1
        const skip = (page - 1) * this.pageSize
        this.model
            .count(this.model.find({
                mailSignup: req.authenticated.mailSignup, company: req.authenticated.company

            })).exec()
            .then(count => this.model.find({
                mailSignup: req.authenticated.mailSignup, company: req.authenticated.company
            })
                .populate('company', 'name')
                .populate('author', ' name email')
                .skip(skip)
                .limit(this.pageSize)
                .then(this.renderAll(resp, next, {
                    page, count, pageSize: this.pageSize, url: req.url
                })))
            .catch(next)
    }

    del = (req, resp, next) => {
        // let params = `departamentshow:${req.params.id}`
        // let prefixSerch = `searchdepartaments`
        // let listDepartaments = `listdepartamentos`


        Volume.find({ departament: req.params.id })
            .then((vol) => {

                if (vol.length === 0) {
                    this.model.remove({ _id: req.params.id }).exec().then((cmdResult: any) => {
                        if (cmdResult.result.n) {
                            resp.send(204)
                        } else {
                            throw new NotFoundError('Departamento não encontrado!')
                        }
                        return next()
                    }).catch(next)

                } else {
                    throw new MethodNotAllowedError('Este Departamento não pode ser excluído pois possui registros Associdados')
                }
            }).catch(next)
        // cache.del(params)
        // cache.delPrefix(prefixSerch)
        // cache.delPrefix(listDepartaments)
    }

    filter = async (req, resp, next) => {

        const recebe = req.body.name || ""
        const regex = new RegExp(recebe, 'ig')



        const keybords = JSON.stringify(req.body).replace("{", "").replace("}", "") // tudo q o user digitou nos filtros.


        // let params = `searchdepartaments:userid-${req.authenticated._id}-terms-${keybords}-page-${req.query._page}`


        // const cached = await cache.get(params)
        // if (cached) {
        //   resp.send(cached)

        // } else {

        let query = {
            mailSignup: req.authenticated.mailSignup, company: req.body.company, name: regex
        }


        let page = parseInt(req.query._page || 1);
        let Size = parseInt(req.query.size || 10);
        this.pageSize = Size;
        page += 1;
        const skip = (page - 1) * this.pageSize;
        Departament

            .count(Departament.find(query)).exec()
            .then(count => Departament.find(query).select('name dateCreated')
                .populate('company', 'name')
                .sort('name')
                .skip(skip)
                .limit(this.pageSize)
                .then(this.renderAll(resp, next, {
                    page, count, pageSize: this.pageSize, url: req.url
                })))
            .catch(next)
        //cacheddepartaments(query,  params, req.url, req.query._page, req.query.size )

    }
    show = async (req, resp, next) => {


        // let params = `departamentshow:${req.params.id}`
        // const cached = await cache.get(params)

        // if (cached) {

        //     resp.send(
        //         cached
        //     )

        // } else {

        const show = await this.prepareOne(this.model.findById(req.params.id))
        // cache.set(params, show, 60 * 4)
        resp.send(
            show
        )



    }







    up = async (req, resp, next) => {

        // let params = `departamentshow:${req.params.id}`
        // let prefixSerch = `searchdepartaments`
        // let listDepartaments = `listdepartamentos`
        // cache.del(params)
        // cache.delPrefix(prefixSerch)
        // cache.delPrefix(listDepartaments)


        const options = { runValidators: true, new: true }
        this.model.findByIdAndUpdate(req.params.id, req.body, options)
            .then(this.render(resp, next))
            .catch(next)


    }




    applyRoutes(applycation: restify.Server) {

        applycation.post(`${this.basePath}/search`, [authorize('SNOW', 'TYWIN', 'DAENERYS'), this.filter])
        applycation.get(`${this.basePath}`, [authorize('SNOW', 'TYWIN', 'DAENERYS', 'STARK', 'TULLY'), this.find])
        applycation.get(`${this.basePath}/:id`, [authorize('SNOW', 'TYWIN', 'DAENERYS', 'STARK', 'TULLY'), this.validateId, this.show])
        applycation.post(`${this.basePath}`, [authorize('TYWIN', 'DAENERYS'), this.save])
        applycation.put(`${this.basePath}/:id`, [authorize('TYWIN', 'DAENERYS'), this.validateId, this.replace])
        applycation.patch(`${this.basePath}/:id`, [authorize('TYWIN', 'DAENERYS'), this.validateId, this.up])
        applycation.del(`${this.basePath}/:id`, [authorize('TYWIN', 'DAENERYS'), this.validateId, this.del])
    }
}
export const departamentsRouter = new DepartamentsRouter()


