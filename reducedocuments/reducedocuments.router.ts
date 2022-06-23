import { ModelRouter } from '../common/model-router'
import * as restify from 'restify'
import * as mongoose from 'mongoose'
import { ReduceDocument } from './reducedocuments.model';
import { Doct } from '../docts/docts.model'
import { Company } from '../companies/companies.model';
import { Archive } from '../archives/archives.model'
import { Pictures } from '../pictures/pictures.model'
import { Volume } from '../volumes/volumes.model'
import { authorize } from '../security/authz.handler'
import { ObjectId } from 'bson';





class ReduceDocumentsRouter extends ModelRouter<ReduceDocument> {
    constructor() {
        super(ReduceDocument)
    }
    protected prepareOne(query: mongoose.DocumentQuery<ReduceDocument, ReduceDocument>): mongoose.DocumentQuery<ReduceDocument, ReduceDocument> {
        return query
            .populate('company', 'name')


    }

    envelop(document) {
        let resource = super.envelope(document)
        const depID = document.reducedocument._id ? document.reducedocument._id : document.reducedocument
        resource._links.reducedocument = `/reducedocuments/${depID}`
        return resource
    }




    applyRoutes(applycation: restify.Server) {

        



        

    }
}
export const reducededocumentsRouter = new ReduceDocumentsRouter()


