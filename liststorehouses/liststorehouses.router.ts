import { ModelRouter } from '../common/model-router'
import * as restify from 'restify'
import { Storehouse} from '../storehouses/storehouses.model'
import {ListStorehouses} from './liststorehouses.model'
import { authorize } from '../security/authz.handler'
const cache = require('../cache/cache')



class ListstorehousesRouter extends ModelRouter<ListStorehouses> {
    constructor() {
        super(ListStorehouses)        
    }    

    findAll = async (req, resp, next)=>{  
        
        let params = `liststorehouses:${req.authenticated.mailSignup}`
    
        const cached = await cache.get(params)
        
        if(cached){
            resp.send({"_links": {
                "self": "undefined",
                "totalPage": 1
            },items:cached})
        }else{
            const storelist = await Storehouse.find({
                $or:[{virtualHd:true},{ mailSignup: req.authenticated.mailSignup}]
             }).select('name').sort('name')
             cache.set(params,storelist,60*4)
             resp.send({"_links": {
                "self": "undefined",
                "totalPage": 1
            },items:storelist})

        }
           

           
                       
                                 
                       

                
             
             

             
             

        
        
            
      }

      
    

    applyRoutes(applycation: restify.Server) {

        applycation.get(`${this.basePath}`, [authorize('SNOW', 'TYWIN', 'DAENERYS','STARK', 'TULLY','VALE'), this.findAll])

    }
}
export const liststorehousesRouter = new ListstorehousesRouter()

