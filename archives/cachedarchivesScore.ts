import { Archive } from './archives.model';






import * as mongoose from 'mongoose'
const cache = require('../cache/cache')



const cachedarchivesScore = async (query, params, url, req_page, query_size) => {


    let page = parseInt(req_page || 1);
    let Size = parseInt(query_size || 10);
    let pageSize = Size;
    page += 1;
    const skip = (page - 1) * pageSize;

    const count = await Archive.find(query, {
        score: {
            $meta: "textScore"
        }
    }).count()

    const search = await Archive.find(query,

        {
            score: {
                $meta: "textScore"
            }
        }
    )
        .sort({
            score: {
                $meta: "textScore"
            }
        })
        .populate("company", "name")
        .populate("storehouse", "name")
        .populate("volume", "location  volumeType")
        .populate("departament", "name")
        .populate("author", " name email")
        .populate("doct", "name label")
        .populate("picture", "name page")

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

export { cachedarchivesScore }