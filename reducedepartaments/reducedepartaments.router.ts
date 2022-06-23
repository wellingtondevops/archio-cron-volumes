import { ModelRouter } from '../common/model-router'
import * as restify from 'restify'
import * as mongoose from 'mongoose'

import { ReduceDepartament } from './reducedepartaments.model';
import { Departament } from '../departaments/departaments.model'
import { Volume } from '../volumes/volumes.model'
import { authorize } from '../security/authz.handler'
import { ObjectId } from 'bson';
import { Company } from '../companies/companies.model';
import { Archive } from '../archives/archives.model';





class ReduceDepartamentsRouter extends ModelRouter<ReduceDepartament> {
    constructor() {
        super(ReduceDepartament)
    }


    applyRoutes(applycation: restify.Server) {

        

    }
}
export const reducedepartamentsRouter = new ReduceDepartamentsRouter()


