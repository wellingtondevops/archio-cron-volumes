import { ModelRouter } from '../common/model-router'
import * as restify from 'restify'
import { authorize } from '../security/authz.handler'
import * as mongoose from 'mongoose'
import { Worksheet } from './worksheets.model'



class WorksheetsRouter extends ModelRouter<Worksheet> {
    constructor() {
        super(Worksheet)
    }

    protected prepareOne(query: mongoose.DocumentQuery<Worksheet, Worksheet>): mongoose.DocumentQuery<Worksheet, Worksheet> {
        return query



    }

    envelop(document) {
        let resource = super.envelope(document)
        const worksheetID = document.worksheet._id ? document.worksheetID._id : document.worksheetID
        resource._links.worksheetID = `/worksheets/${worksheetID}`
        return resource
    }

    show = async (req, resp, next) => {
        
        try {
            let result = await Worksheet.findOne({"_id":req.params.id})      
            resp.send(result)              
    
        } catch (error) {
            resp.status(500).send({message: error.message})
            
        }

    }



    applyRoutes(applycation: restify.Server) {

        
        applycation.get(`${this.basePath}/:id`, this.validateId, this.show)
        applycation.del(`${this.basePath}/:id`, this.validateId, this.delete)
    
    }
}
export const worksheetsRouter = new WorksheetsRouter()
