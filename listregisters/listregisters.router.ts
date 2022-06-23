import { ModelRouter } from "../common/model-router"
import * as restify from 'restify'
import { ListRegisters } from './listregisters.model'
import * as mongoose from 'mongoose'
import { authorize } from '../security/authz.handler'
import { Archive } from "../archives/archives.model";
import { User} from "../users/users.model"




class ListregistersRouter extends ModelRouter<ListRegisters> {
    constructor() {
        super(ListRegisters)
    }
 
    find = async (req, resp, next) => {
        let order = (req.query.order)
        let page = parseInt(req.query._page || 1)
        let Size = parseInt(req.query.size || 50)
        this.pageSize = Size
        page += 1
        const skip = (page - 1) * this.pageSize

        let profile =req.authenticated.profiles.toString()
    
        if (profile === 'DAENERYS') {
            Archive
            .count(Archive.find({
                mailSignup: req.authenticated.mailSignup,
                volume: req.query.volume,
                
            })).exec()
            .then(async count => await Archive.find({
                mailSignup: req.authenticated.mailSignup,
                volume: req.query.volume
                
            })
                .select('tag')
                .populate('doct', 'label')
                .select('create')
                .sort(order)
                .skip(skip)
                .limit(this.pageSize)
                .then(this.renderAll(resp, next, {
                    page, count, pageSize: this.pageSize, url: req.url
                })))
            .catch(next)

        } else {

            let user = await User.find({ _id: req.authenticated._id })
        .select("permissions.docts")
        .select("permissions.company");
      let data = user[0].permissions.map(item => {
        return item.docts;
      });

      let doct = data;

      let data2 = user[0].permissions.map(item => {
        return item.company;
      });

      let company = data2;


            Archive
            .count(Archive.find({
                mailSignup: req.authenticated.mailSignup,
                volume: req.query.volume,
                company: company, doct: doct
            })).exec()
            .then(async count => await Archive.find({
                mailSignup: req.authenticated.mailSignup,
                volume: req.query.volume,
                company:company, doct: doct,
            })
                .select('tag')
                .populate('doct', 'label')
                .select('create')
                .sort(order)
                .skip(skip)
                .limit(this.pageSize)
                .then(this.renderAll(resp, next, {
                    page, count, pageSize: this.pageSize, url: req.url
                })))
            .catch(next)

        }


    }


    applyRoutes(applycation: restify.Server) {

        applycation.get(`${this.basePath}`, [authorize('SNOW', 'TYWIN', 'DAENERYS','STARK', 'TULLY'), this.find])

    }

}

export const listregistersRouter = new ListregistersRouter()



