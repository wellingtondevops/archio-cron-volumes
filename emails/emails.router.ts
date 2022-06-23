import { Archive } from './../archives/archives.model';


import { ModelRouter } from "../common/model-router";
import * as restify from "restify";
import { authorize } from "../security/authz.handler";
import { authenticate } from "../security/auth.handler";
import { User } from "../users/users.model";
import { Email } from "../emails/emails.model"
import * as mongoose from 'mongoose'
import { MethodNotAllowedError, NotFoundError } from 'restify-errors';


class EmailRouter extends ModelRouter<Email> {
    constructor() {
      super(Email);
    }

    protected prepareOne(query: mongoose.DocumentQuery<Email, Email>): mongoose.DocumentQuery<Email, Email> {
      return query
      .populate('userSernder', 'name')
      .populate('archive','pending')
       


  }

  envelop(document) {
      let resource = super.envelope(document)
      const depID = document.departament._id ? document.departament._id : document.departament
      resource._links.departament = `/emails/${depID}`
      return resource
  }


  filters = async (req, resp, next) => {

    const userLogged = req.authenticated._id


    let page = parseInt(req.query._page || 10000000);
    page += 1 || 1;
    const skip = (page - 1) * this.pageSize;
    Email.count({
      mailSignup: req.authenticated.mailSignup,
      receivers: { $in: [userLogged] }

    })
      .exec()
      .then(count =>
        Email.find({
          mailSignup: req.authenticated.mailSignup,
          receivers: { $in: [userLogged] }
        })
          .populate('userSernder', 'name')
          .populate('archive','pending')
          .sort('-dateCreated')
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


  del = (req, resp, next) => {
    
  
  
    Archive.find({ idemail: req.params.id })
        .then((vol) => {

            if (vol.length === 0) {
               Email.remove({ _id: req.params.id }).exec().then((cmdResult: any) => {
                    if (cmdResult.result.n) {
                        resp.send(204)
                    } else {
                        throw new NotFoundError('Email não encontrado!')
                    }
                    return next()
                }).catch(next)

            } else {
                throw new MethodNotAllowedError('Esta Messagem não pode ser deletada pois ainda está com Pendências!')
            }
        }).catch(next)
       
}
show = async (req, resp, next) => {

await Email.updateOne({_id:req.params.id},{$set:{highlighted:false}})

  this.prepareOne(this.model.findById(req.params.id))
    .then(this.render(resp, next))
    .catch(next)
}



  
    applyRoutes(applycation: restify.Server) {

        applycation.post(`${this.basePath}/box`, [
            authorize("SNOW", "TYWIN", "DAENERYS",'STARK', 'TULLY','VALE'),
            this.filters
          ]);
          applycation.get(`${this.basePath}/:id`, [
            authorize("SNOW", "TYWIN", "DAENERYS",'STARK', 'TULLY','VALE'),
            this.show
          ]);
          applycation.del(`${this.basePath}/:id`, [
            authorize("SNOW", "TYWIN", "DAENERYS",'STARK', 'TULLY','VALE'),
            this.del
          ]);

    }
     
  }
  export const emailRouter = new EmailRouter();
  