import * as mongoose from 'mongoose'
import { Company } from '../companies/companies.model'
import { Departament } from '../departaments/departaments.model'
import { Storehouse } from '../storehouses/storehouses.model'
import { Doct} from '../docts/docts.model'
import { User } from '../users/users.model'
import { environment } from '../common/environment'


export interface ImportSheet extends mongoose.Document {

    sheet: String  
    mailSignup: String    
    dateCreated: Date
}

const importSheetSchema = new mongoose.Schema({

    sheet: {
        type: String,
        required: false,
        trim: true
    },
    mailSignup: {
        type: String,
        required: false,
        trim: true
    },
    dateCreated: {
        type: Date,
        default: Date.now
    },   
    
})

export const ImportSheet = mongoose.model<ImportSheet>('ImportSheet', importSheetSchema)
