import { ModelRouter } from '../common/model-router'
import * as restify from 'restify'
import { authorize } from '../security/authz.handler'
import { Pictures } from './pictures.model'


class PicturesRouter extends ModelRouter<Pictures> {
    constructor() {
        super(Pictures)
    }

    find = async (req, resp, next) => {
        Pictures.findOne({archive:req.query.archive})
            .populate('archive','mailSignup')
            .populate('author',' name email')
            .then(this.render(resp, next))
            .catch(next)
    }

    save = (req, resp, next) => {
        let document = new this.model(req.body)
        document.save()
            .then(this.render(resp, next))
            .catch(next)
    }
  

    applyRoutes(applycation: restify.Server) {

        applycation.get(`${this.basePath}`, [authorize('SNOW', 'TYWIN', 'DAENERYS','STARK', 'TULLY'), this.find])
        applycation.get(`${this.basePath}`, [authorize('SNOW', 'TYWIN', 'DAENERYS','STARK', 'TULLY'), this.findAll])
        applycation.get(`${this.basePath}/:id`, [authorize('SNOW', 'TYWIN', 'DAENERYS','STARK', 'TULLY'), this.validateId, this.findById])

    }
}
export const picturesRouter = new PicturesRouter()
