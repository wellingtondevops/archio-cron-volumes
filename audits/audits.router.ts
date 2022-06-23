import { ModelRouter } from '../common/model-router'
import * as restify from 'restify'
import { authorize } from '../security/authz.handler'
import * as mongoose from 'mongoose'
import { Audit } from './audits.model'


class AuditsRouter extends ModelRouter<Audit> {
    constructor() {
        super(Audit)
    }

    protected prepareOne(query: mongoose.DocumentQuery<Audit, Audit>): mongoose.DocumentQuery<Audit, Audit> {
        return query
            


    }

    envelop(document) {
        let resource = super.envelope(document)
        const auditID = document.audit._id ? document.audit._id : document.audit
        resource._links.departament = `/audits/${auditID}`
        return resource
    }


    filter = (req, resp, next) => {

       

        let page = parseInt(req.query._page || 1)
        page += 1
        const skip = (page - 1) * this.pageSize
        Audit

            .count(Audit.find({
                mailSignup: req.authenticated.mailSignup
            })).exec()
            .then(count => Audit.find({
                mailSignup: req.authenticated.mailSignup
            })  .populate('whoAccessed','email name')                
                .populate('whatAccessed','tag')
                .populate('doctAccessed','name')

                .skip(skip)
                .limit(this.pageSize)
                .then(this.renderAll(resp, next, {
                    page, count, pageSize: this.pageSize, url: req.url
                })))
            .catch(next)
    }

    save = (req, resp, next) => {
        let document = new this.model(req.body)
        document.save()
            .then(this.render(resp, next))
            .catch(next)
    }
  

    applyRoutes(applycation: restify.Server) {

        applycation.get(`${this.basePath}`, [authorize('SNOW', 'TYWIN', 'DAENERYS'), this.filter])
        applycation.post(`${this.basePath}`, [authorize('DAENERYS'), this.save])
        
        

    }
}
export const auditsRouter = new AuditsRouter()
