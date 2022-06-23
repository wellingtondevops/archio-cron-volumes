

import { Storehouse } from './storehouses.model'



import * as mongoose from 'mongoose'
const cache = require('../cache/cache')



const  cachedstore =async (query,pageSize,params,url,page)=>{

    
    const search = await Storehouse.find(query)
      .populate('author', ' name email')

      const obj = {
        "_links": {
          "self": `${url}`,
          "currentPage": page,
          "foundItems": search.length,
          "totalPage": (search.length / pageSize | 0) || 1,
        }, items: search
      }
      cache.set(params, obj, 60 * 4)
   

}

export {cachedstore}