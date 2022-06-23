import { ModelRouter } from '../common/model-router'
import * as restify from 'restify'
import { ListVolumes } from './listvolumes.model'
import { authorize } from '../security/authz.handler'
import { Volume } from '../volumes/volumes.model';



class ListvolumesRouter extends ModelRouter<ListVolumes> {
    constructor() {
        super(ListVolumes)

    }

    find = async (req, resp, next) => {
        let order = (req.query.order) 
        let page = parseInt(req.query._page || 1)
        let Size = parseInt(req.query.size || 50)
        this.pageSize = Size
        page += 1
        const skip = (page - 1) * this.pageSize
        const recebe = req.query.location || ""
        const regex = new RegExp(recebe,'i')
        //const receb2 = req.query.description
       // const regex2 = new RegExp(receb2,'i')
        Volume
            .count(Volume.find({
                mailSignup: req.authenticated.mailSignup,
                storehouse: req.query.storehouse,
                company: req.query.company,
                departament: req.query.departament,
                location: regex,
               // description: regex2,
                guardType: {
                    $ne: "SIMPLES"
                },
                status: {
                    $ne: "BAIXADO"
                }
            })).exec()
            .then(async count => await Volume.find({
                mailSignup: req.authenticated.mailSignup,                
                storehouse: req.query.storehouse,
                company: req.query.company,
                departament: req.query.departament,
                location: regex,
                //description: regex2,
                guardType: {
                    $ne: "SIMPLES"
                },
                status: {
                    $ne: "BAIXADO"
                }
            })
                .sort({ location: 1 })
                .select('location')
                //.select('description')
                .populate('departament','name')
                .populate('company', 'name')
                .sort(order)
                .skip(skip)
                .limit(this.pageSize)
                .then(this.renderAll(resp, next, {
                    page, count, pageSize: this.pageSize, url: req.url
                })))
            .catch(next)
    }

    applyRoutes(applycation: restify.Server) {

        applycation.get(`${this.basePath}`, [authorize('SNOW', 'TYWIN', 'DAENERYS','STARK', 'TULLY'), this.find])

    }
}
export const listvolumesRouter = new ListvolumesRouter()

