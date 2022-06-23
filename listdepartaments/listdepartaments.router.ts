import { ModelRouter } from '../common/model-router'
import * as restify from 'restify'
import { ListDepartaments } from './listdepartaments.model'
import { authorize } from '../security/authz.handler'
import { Departament } from '../departaments/departaments.model';
const cache = require('../cache/cache')



class ListdepartamentsRouter extends ModelRouter<ListDepartaments> {
    constructor() {
        super(ListDepartaments)
    }

    findAll = async (req, resp, next) => {
       
        // let params = `listdepartamentos:${req.authenticated.mailSignup}-company-${req.query.company}`
        // const cached = await cache.get(params)


        // if (cached) {
           

        //     resp.send({
        //         "_links": {
        //             "self": "undefined",
        //             "totalPage": 1
        //         }, items: cached
        //     })
        // } else {

          
            const listdepartaments = await Departament.find({
                mailSignup: req.authenticated.mailSignup,
                company: req.query.company
            }).select('name')
                .populate('company', 'name')
                .sort('name')
            // cache.set(params, listdepartaments, 60 * 4)
            resp.send({
                "_links": {
                    "self": "undefined",
                    "totalPage": 1
                }, items: listdepartaments
            })


        }


    

    applyRoutes(applycation: restify.Server) {

        applycation.get(`${this.basePath}`, [authorize('SNOW', 'TYWIN', 'DAENERYS', 'STARK', 'TULLY', 'VALE'), this.findAll])

    }
}
export const listdepartamentsRouter = new ListdepartamentsRouter()

