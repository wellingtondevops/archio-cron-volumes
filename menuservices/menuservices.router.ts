import { ModelRouter } from '../common/model-router'
import * as restify from 'restify'
import { NotFoundError, MethodNotAllowedError } from 'restify-errors'
import * as mongoose from 'mongoose'
import { authorize } from '../security/authz.handler'
import { MenuService } from './menuservices.model'
import { CompanyService } from '../companyservices/companyservices.model';

class MenuServicesRouter extends ModelRouter<MenuService>{

    constructor() {
        super(MenuService)
    }

    protected prepareOne(query: mongoose.DocumentQuery<MenuService, MenuService>): mongoose.DocumentQuery<MenuService, MenuService> {
        return query.populate('user', 'name')
    }

    envelop(document) {
        let resource = super.envelope(document)
        resource._links.menu = `${this.basePath}/${resource._id}`
        return resource

    }

    save = async (req, resp, next) => {
        let document = new MenuService({

            descriptionService:req.body.descriptionService,
            author: req.authenticated._id,
            mailSignup: req.authenticated.mailSignup,

        })
        MenuService.find({
            mailSignup: req.authenticated.mailSignup,
            descriptionService: req.body.descriptionService
        })
            .then(async (com) => {
                if (com.length === 0) {
                    await document.save()
                        .then(this.render(resp, next))
                } else {
                    throw new MethodNotAllowedError('🛠 Serviço já Cadastrado, por favor cadastro um outro...')
                }
            }).catch(next)

    }


    list =async (req, resp, next) => {

        const list =  await   MenuService.find({"mailSignup": req.authenticated.mailSignup})
            .select('descriptionService')
             .sort('descriptionService')
             .catch(next)
             resp.send(list)
    }

    delete = (req, resp, next) => {
        CompanyService.find({ "services.description":req.params.id  })
            .then((vol) => {
                if (vol.length === 0) {
                    this.model.remove({ _id: req.params.id })
                    .exec()
                    .then((cmdResult: any) => {
                        if (cmdResult.result.n) {
                             resp.send("Serviço removido com sucesso")
                         } else {
                             throw new NotFoundError('Serviço não encontrado!')
                         }
                         return next()
                     }).catch(next)
                } else {
                    throw new MethodNotAllowedError('Este Serviço não pode ser excluído pois possui registros Associdados')                }
            }).catch(next)
    }


    filter = async (req, resp, next) => {

        const recebe = req.body.descriptionService || ""
        const regex = new RegExp(recebe, 'ig')

        const _filter = req.body
        const filter = delete  _filter.descriptionService
        let page = parseInt(req.query._page || 1)
        page += 1
        const skip = (page - 1) * this.pageSize
        let profile =req.authenticated.profiles.toString()

        if (profile === 'DAENERYS') {
            MenuService
                       .count(MenuService.find({
                           mailSignup: req.authenticated.mailSignup,
                           descriptionService: regex
                       })).exec()
                       .then(count => MenuService.find({
                        mailSignup: req.authenticated.mailSignup,
                        descriptionService: regex
                       }).select('descriptionService')
                           .sort('descriptionService')
                           .skip(skip)
                           .limit(this.pageSize)
                           .then(this.renderAll(resp, next, {
                               page, count, pageSize: this.pageSize, url: req.url
                           })))
                       .catch(next)

                   }
    }

    

    applyRoutes(applycation: restify.Server) {

        applycation.get(`${this.basePath}`, [authorize('DAENERYS'), this.find])
        applycation.post(`${this.basePath}/search`, [authorize('DAENERYS'), this.filter])
        applycation.get(`${this.basePath}/list`, [authorize('DAENERYS'), this.list])
        applycation.post(`${this.basePath}`, [authorize('DAENERYS'), this.save])
        applycation.patch(`${this.basePath}/:id`,[authorize('DAENERYS'),this.validateId, this.update])
        applycation.del(`${this.basePath}/:id`,[authorize('DAENERYS'),this.validateId, this.delete])
        applycation.get(`${this.basePath}/:id`, [authorize('DAENERYS'), this.validateId, this.findById])
    }

}

export const menuServicesRouter = new MenuServicesRouter()
