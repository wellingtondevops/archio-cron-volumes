import { ModelRouter } from '../common/model-router'
import * as restify from 'restify'
import { NotFoundError, MethodNotAllowedError } from 'restify-errors'
import * as mongoose from 'mongoose'
import { authorize } from '../security/authz.handler'
import { CompanyService } from './companyservices.model'
import { Company } from '../companies/companies.model'



class CompanyServicesRouter extends ModelRouter<CompanyService>{

    constructor() {
        super(CompanyService)
    }

    protected prepareOne(query: mongoose.DocumentQuery<CompanyService, CompanyService>): mongoose.DocumentQuery<CompanyService, CompanyService> {
        return query.populate('company', 'name').populate('services.description', 'descriptionService').populate('author', 'name')
    }

    envelop(document) {
        let resource = super.envelope(document)
        resource._links.seal = `${this.basePath}/${resource._id}`
        return resource

    }

    save = async (req, resp, next) => {
        let document = new CompanyService({
            company: req.body.company,
            author: req.authenticated._id,
            mailSignup: req.authenticated.mailSignup,
            services: req.body.services
        })
        CompanyService.find({
            mailSignup: req.authenticated.mailSignup, company: req.body.company
        })
            .then(async (com) => {
                if (com.length === 0) {
                    await document.save()
                        .then(this.render(resp, next))
                } else {
                    throw new MethodNotAllowedError('🛠 Essa empresa já possui Tabela de Serviços...')
                }
            }).catch(next)

    }


    find = (req, resp, next) => {
        let page = parseInt(req.query._page || 1)
        page += 1
        const skip = (page - 1) * this.pageSize
        CompanyService
            .count(CompanyService.find({
                "mailSignup": req.authenticated.mailSignup,
            })).exec()
            .then(count => CompanyService.find({
                "mailSignup": req.authenticated.mailSignup,
            })
                .select('company')
                .populate('company', 'name')
                .skip(skip)
                .limit(this.pageSize)
                .then(this.renderAll(resp, next, {
                    page, count, pageSize: this.pageSize, url: req.url
                })))
            .catch(next)
    }

    list = (req, resp, next) => {



        let page = parseInt(req.query._page || 1)
        page += 1
        const skip = (page - 1) * this.pageSize
        CompanyService
            .count(CompanyService.find({
                "mailSignup": req.authenticated.mailSignup,
            })).exec()
            .then(count => CompanyService.find({
                "mailSignup": req.authenticated.mailSignup,
            })
                .select('company')
                .populate('company', 'name')
                .skip(skip)
                .sort('company.name')
                .limit(this.pageSize)
                .then(this.renderAll(resp, next, {
                    page, count, pageSize: this.pageSize, url: req.url
                })))
            .catch(next)
    }


    search = async (req, resp, next) => {

        const recebe = req.body.company || "";
        const regex = new RegExp(recebe, "ig");
        let page = parseInt(req.query._page || 1)
        page += 1
        const skip = (page - 1) * this.pageSize
        let data = await Company.find({ "mailSignup": req.authenticated.mailSignup, name: regex })

        let ids = data.map(el => { return el._id })

        CompanyService
            .count(CompanyService.find({
                "mailSignup": req.authenticated.mailSignup, company: ids
            })).exec()
            .then(count => CompanyService.find({
                "mailSignup": req.authenticated.mailSignup, company: ids
            })
                .select('company.name')
                .populate('company', 'name')
                .skip(skip)
                .sort('company.name')
                .limit(this.pageSize)
                .then(this.renderAll(resp, next, {
                    page, count, pageSize: this.pageSize, url: req.url
                })))
            .catch(next)
    }


 

    update =async (req, resp, next) => {
        const options = { runValidators: true, new: true }
     await   this.model.findByIdAndUpdate(req.params.id, req.body, options)
          .then(this.render(resp, next))
          .catch(next)
      }
    


    applyRoutes(applycation: restify.Server) {

        applycation.get(`${this.basePath}`, [authorize('DAENERYS'), this.find])
        applycation.post(`${this.basePath}`, [authorize('DAENERYS'), this.save])
        applycation.get(`${this.basePath}/list`, [authorize('DAENERYS'), this.list])
        applycation.post(`${this.basePath}/search`, [authorize('DAENERYS'), this.search])
        applycation.get(`${this.basePath}/:id`, [authorize('DAENERYS'), this.validateId, this.findById])
        applycation.put(`${this.basePath}/:id`, [authorize('DAENERYS'), this.validateId, this.replace])
        applycation.patch(`${this.basePath}/:id`, [authorize('DAENERYS'), this.validateId, this.update])
        applycation.del(`${this.basePath}/:id`, [authorize('DAENERYS'), this.validateId, this.delete])
        
    }

}

export const companyServicesRouter = new CompanyServicesRouter()
