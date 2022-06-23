import { ModelRouter } from '../common/model-router'
import * as restify from 'restify'
import {ListRequesters} from '../listrequesters/listrequesters.model'
import { authorize } from '../security/authz.handler'
import { User } from '../users/users.model';



class ListRequestersRouter extends ModelRouter<ListRequesters> {
    constructor() {
        super(ListRequesters)
    }

    findAll = async (req, resp, next) => {

        let idsThisCompany= await User.find({ mailSignup: req.authenticated.mailSignup,
            "permissions.company":req.query.company, physicalDocuments:true
        })
        let _idsThisCompany=  idsThisCompany.map(el=>{return el._id})

        let idsAdmin=await User.find({ mailSignup: req.authenticated.mailSignup,
            profiles:"DAENERYS"
        })
        let _idsAdmin=  idsAdmin.map(el=>{return el._id})

        User.find({
            mailSignup: req.authenticated.mailSignup,
            "$or": [{
                "_id": _idsThisCompany
            }, {
                "_id": _idsAdmin
            }],
          

        })  .select('_id name email')         
            .sort('name')
            .then(this.renderAll(resp, next))
            .catch(next)
    }

    applyRoutes(applycation: restify.Server) {

        applycation.get(`${this.basePath}`, [authorize('SNOW', 'TYWIN', 'DAENERYS','STARK', 'TULLY','WESTEROS'), this.findAll])

    }
}
export const listrequestersRouter = new ListRequestersRouter()

