
import { ModelRouter } from "../common/model-router";
import * as restify from "restify";
import { Company } from "../companies/companies.model";
import { ListCompanies } from "./listcompanie.model";
import { authorize } from "../security/authz.handler";
import { authenticate } from "../security/auth.handler";
import { User } from "../users/users.model";
import { UserPermissions} from "../userpermissions/userpermissions.model"
import { returnDocts } from "../libary/returnListDocts";
const cache = require('../cache/cache')


class ListcompaniesRouter extends ModelRouter<ListCompanies> {
  constructor() {
    super(ListCompanies);
  }

  findAll = async (req, resp, next) => {
    let profile =req.authenticated.profiles.toString()


  //   let params = `listcompanies:${req.authenticated._id}`
  //   const cached = await cache.get(params)

  //   if(cached){
      
  //     resp.send({"_links": {
  //         "self": "undefined",
  //         "totalPage": 1
  //     },items:cached})
  // }else{
   
    if (profile === 'DAENERYS') {
     const listcompaniess= await Company.find({
        mailSignup: req.authenticated.mailSignup
      })
        .select("name")
        .sort('name')
        //  cache.set(params,listcompaniess,60*1)
             resp.send({"_links": {
                "self": "undefined",
                "totalPage": 1
            },items:listcompaniess})
    } else {



      let dcompanies = await UserPermissions.find({user:req.authenticated._id}).select("company")
      let companies = dcompanies.map(el=>{return el.company})

  // console.log(JSON.stringify(companies))
      
    const listcompanies= await  Company.find({
        mailSignup: req.authenticated.mailSignup,
        _id: companies
      })
        .select("name")
        .sort('name')
        //  cache.set(params,listcompanies,60*4)
             resp.send({"_links": {
                "self": "undefined",
                "totalPage": 1
            },items:listcompanies})
       
    }
  }

  
    
   
  

  applyRoutes(applycation: restify.Server) {
    applycation.get(`${this.basePath}`, [
      authorize("SNOW", "TYWIN", "DAENERYS",'STARK', 'TULLY','VALE'),
      this.findAll
    ]);
  }
}
export const listcompaniesRouter = new ListcompaniesRouter();
