
import { ModelRouter } from '../common/model-router'
import * as restify from 'restify'
import { User } from '../users/users.model'
import { NotFoundError } from 'restify-errors'
import { authenticate } from '../security/auth.handler'
import { authorize } from '../security/authz.handler'
import { environment } from '../common/environment'
import sgMail = require("@sendgrid/mail");
import { EmailService } from '../serviceMail/serviceMail';
import { Guid } from "guid-typescript";


class UserRouter extends ModelRouter<User> {

    constructor() {
        super(User)
        this.on('beforeRender', document => {
            document.password = undefined
        })
    }


    findByEmail = (req, resp, next) => {
        if (req.query.email) {
            User.findByEmail(req.query.email)
                .then(user => {
                    if (user) {
                        return [user]
                    } else {
                        return []
                    }
                })
                .then(this.renderAll(resp, next))
                .catch(next)
        } else {
            next()
        }
    }


    findname = (req, resp, next) => {
        if (req.query.name) {
            const recebe = req.query.name
            const regex = new RegExp(recebe)
            User.find({ name: regex })
                .then(this.renderAll(resp, next))
                .catch(next)
        } else {
            next()
        }
    }
    save = async (req, resp, next) => {
        const pass = Guid.raw().substring(0, 6)
        let document = new this.model({
            name: req.body.name,
            email: req.body.email,
            password: pass,
            profiles:'DAENERYS',
            isSponser:true,
            mailSignup: req.body.email


        })

        sgMail.setApiKey(environment.email.sendgridkey)

        EmailService(req.body.email, 'Bem Vindo ao Archio!', environment.email.template
            .replace('{0}', req.body.name)
            .replace('{1}', req.body.email)
            .replace('{2}', pass))
        document.save()
            .then(this.render(resp, next))
            .catch(next)
    }


    applyRoutes(applycation: restify.Server) {


        applycation.get({ path: `${this.basePath}`, version: '2.0.0' }, [authorize('DAENERYS'), this.findname, this.findAll])
        applycation.get(`${this.basePath}/:id`, [authorize('SNOW', 'TYWIN', 'DAENERYS'), this.validateId, this.findById])
        applycation.post(`${this.basePath}/signups`, [this.save])
        applycation.put(`${this.basePath}/:id`, [authorize('SNOW', 'TYWIN', 'DAENERYS'), this.validateId, this.replace])
        applycation.patch(`${this.basePath}/:id`, [authorize('SNOW', 'TYWIN', 'DAENERYS'), this.validateId, this.update])
        applycation.del(`${this.basePath}/:id`, [authorize('DAENERYS'), this.validateId, this.delete])
        applycation.post(`${this.basePath}/authenticate`, authenticate)
    }
}

export const signupsRouter = new UserRouter()