import { Doct } from './docts.model';






import * as mongoose from 'mongoose'
const cache = require('../cache/cache')



const cacheddocts = async (query, params, url, req_page, query_size) => {


    let page = parseInt(req_page || 1);
    let Size = parseInt(query_size || 10);
    let pageSize = Size;
    page += 1;
    const skip = (page - 1) * pageSize;

    const count = await Doct.find(query).count()

    const search = await Doct.find(query)
        .select('name retention dcurrentValue dfinal dintermediateValue dateCreated')
        .populate('company', 'name')
        .sort('name')
        .skip(skip)
        .limit(pageSize)


    const obj = {
        "_links": {
            "self": `${url}`,
            "currentPage": page,
            "foundItems": count,
            "totalPage": (count / pageSize) | 0 || 1,
        }, items: search
    }
    cache.set(params, obj, 60 * 4)


}

export { cacheddocts }