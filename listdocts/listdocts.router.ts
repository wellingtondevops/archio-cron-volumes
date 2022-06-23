import { doctsRouter } from './../docts/docts.router';
import { authenticate } from './../security/auth.handler';
import { UserPermissions } from '../userpermissions/userpermissions.model';
import { ModelRouter } from "../common/model-router";
import * as restify from "restify";
import { Doct } from "../docts/docts.model";
import { ListDocts } from "./listdocts.model";
import { authorize } from "../security/authz.handler";
import { User } from "../users/users.model";
import { InternalServerError } from 'restify-errors';
import { AccessProfiles } from '../accessprofiles/accessprofiles.model';
import { returnDocts } from '../libary/returnListDocts';
const cache = require('../cache/cache')

class ListdoctsRouter extends ModelRouter<ListDocts> {
  constructor() {
    super(ListDocts);
  }

  findAll = async (req, resp, next) => {
    let profile = req.authenticated.profiles.toString()


    // let params = `listdocts:${req.authenticated._id}-company-${req.query.company}`
    // const cached = await cache.get(params)

    // if (cached) {

    //   resp.send({
    //     "_links": {
    //       "self": "undefined",
    //       "totalPage": 1
    //     }, items: cached
    //   })

    // } else {

      if (profile === 'DAENERYS') {
        const listdoctos = await Doct.find({
          mailSignup: req.authenticated.mailSignup,
          company: req.query.company
        })
          .select("name")
          .sort('name')
          .populate("company", "name")
        // cache.set(params, listdoctos, 60 * 4)
        resp.send({
          "_links": {
            "self": "undefined",
            "totalPage": 1
          }, items: listdoctos
        })

      } else {
        const docts= await returnDocts(req.authenticated._id)
        
        const listdocts = await Doct.find({
          mailSignup: req.authenticated.mailSignup,
          _id:  docts ,
          company: req.query.company
        })
          .select("name")
          .sort('name')
          .populate("company", "name")

        resp.send({
          "_links": {
            "self": "undefined",
            "totalPage": 1
          }, items: listdocts
        })


      }
    }
  

  applyRoutes(applycation: restify.Server) {
    applycation.get(`${this.basePath}`, [
      authorize('SNOW', 'TYWIN', 'DAENERYS', 'STARK', 'TULLY', 'VALE'),
      this.findAll
    ]);
  }
}
export const listdoctsRouter = new ListdoctsRouter();
