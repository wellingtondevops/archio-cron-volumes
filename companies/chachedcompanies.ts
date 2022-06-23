import { Company } from './companies.model';





import * as mongoose from 'mongoose'
const cache = require('../cache/cache')



const  cachedcompany =async (query,params,url,req_page,query_size)=>{


  let page = parseInt(req_page || 1);
  let Size = parseInt(query_size || 10);
  let pageSize = Size;
  page += 1;
  const skip = (page - 1) * pageSize;

  const count = await Company.find(query).count()
    
    const search = await Company.find(query)
    .skip(skip)
    .limit(pageSize)
     
    .select("name  fone email dateCreated")
    .sort('name')

      const obj = {
        "_links": {
          "self": `${url}`,
          "currentPage": page,
          "foundItems": count,
          "totalPage": (count / pageSize ) |0|| 1,
        }, items: search
      }
      cache.set(params, obj, 60 * 4)
   

}

export {cachedcompany}