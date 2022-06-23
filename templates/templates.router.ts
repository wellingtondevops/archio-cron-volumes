import { ModelRouter } from '../common/model-router'
import * as restify from 'restify'
import { NotFoundError, MethodNotAllowedError } from 'restify-errors'
import { authorize } from '../security/authz.handler'
import { Template } from './templates.model'
import { authenticate } from '../security/auth.handler';
import * as mongoose from 'mongoose'

class TemplatesRouter extends ModelRouter<Template>{
    constructor() {
        super(Template)
    }

    protected prepareOne(query: mongoose.DocumentQuery<Template, Template>): mongoose.DocumentQuery<Template, Template> {
        return query
            .populate('author')


    }


    find = (req, resp, next) => {
        //let Size = parseInt(req.query.size)
        //this.pageSize = Size
        let page = parseInt(req.query._page || 1)
        page = page + 1
        const skip = (page - 1) * this.pageSize
        this.model
            .count(this.model.find({
                mailSignup: req.authenticated.mailSignup
            })).exec()
            .then(count => this.model.find({
                mailSignup: req.authenticated.mailSignup
            })
                .select('structureName dateCreated author')
                .skip(skip)
                .limit(this.pageSize)
                .then(this.renderAll(resp, next, {
                    page, count, pageSize: this.pageSize, url: req.url
                })))
            .catch(next)
    }


    save = (req, resp, next) => {

        let document = new this.model(req.body)

        Template.find({
            mailSignup: req.authenticated.mailSignup,
            structureName: req.body.structureName
        })
            .then(async (com) => {
                if (com.length === 0) {
                    await document.save()
                        .then(this.render(resp, next))
                    if (req.authenticated.isSponser === true) {
                        await Template.updateOne({ _id: document._id },
                            { author: req.authenticated._id, mailSignup: req.authenticated.mailSignup }).catch(next)
                    } else {
                        await Template.updateOne({ _id: document._id },
                            { author: req.authenticated._id, mailSignup: req.authenticated.mailSignup }).catch(next)
                    }
                } else {
                    throw new MethodNotAllowedError('Estrutura já Cadastrada, por favor cadastre uma outra...')
                }
            })
            .catch(next)
    }



    list = (req, resp, next) => {
        this.model
            .count(this.model.find({
                mailSignup: req.authenticated.mailSignup
            })).exec()
            .then(count => this.model.find({
                mailSignup: req.authenticated.mailSignup
            })
                .select('structureName dateCreated author')
                .then(this.renderAll(resp, next, {
                    count, url: req.url
                })))
            .catch(next)

    }





    applyRoutes(applycation: restify.Server) {

        applycation.get(`${this.basePath}`, [authorize('TYWIN', 'DAENERYS','STARK'), this.find])
        applycation.get(`${this.basePath}/list`, [authorize('TYWIN', 'DAENERYS','STARK'), this.list])
        applycation.get(`${this.basePath}/:id`, [authorize('SNOW', 'TYWIN', 'DAENERYS','STARK'), this.validateId, this.findById])
        applycation.post(`${this.basePath}`, [authorize('DAENERYS'), this.save])
        applycation.put(`${this.basePath}/:id`, [authorize('DAENERYS'), this.validateId, this.replace])
        applycation.patch(`${this.basePath}/:id`, [authorize('DAENERYS'), this.validateId, this.update])
        applycation.del(`${this.basePath}/:id`, [authorize('DAENERYS'), this.validateId, this.delete])
        applycation.get(`${this.basePath}`, [authorize('TYWIN', 'DAENERYS','STARK'), this.findAll])
    }
}
export const templatesRouter = new TemplatesRouter()