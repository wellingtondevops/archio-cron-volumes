import { ModelRouter } from '../common/model-router'
import * as restify from 'restify'
import { authorize } from '../security/authz.handler'
import * as mongoose from 'mongoose'
import { SheetName} from './sheetnames.model'
import { NotFoundError } from 'restify-errors'
import { Worksheet } from '../worksheets/worksheets.model';



class SheetnamesRouter extends ModelRouter<SheetName> {
    constructor() {
        super(SheetName)
    }

    protected prepareOne(query: mongoose.DocumentQuery<SheetName, SheetName>): mongoose.DocumentQuery<SheetName, SheetName> {
        return query



    }

    envelop(document) {
        let resource = super.envelope(document)
        const SheetNameID = document.sheetName._id ? document.SheetNameID._id : document.worksheetID
        resource._links.SheetNameID = `/SheetNames/${SheetNameID}`
        return resource
    }

   
    delete = async (req, resp, next) => {


       await Worksheet.remove({sheetName:req.params.id})
        this.model.remove({ _id: req.params.id }).exec()        
        .then(async (cmdResult: any) => {
            if (cmdResult.result.n) {
                resp.send("Planilha removida com suscesso!")
            } else {
                throw new NotFoundError('Planilha não Encontrada!')
            }
            return next()
        }).catch(next)
    }

    


    applyRoutes(applycation: restify.Server) {
        applycation.del(`${this.basePath}/:id`, [authorize('DAENERYS'), this.validateId, this.delete])

    }
}
export const sheetnamesRouter = new SheetnamesRouter()
