import * as mongoose from 'mongoose'
import { Company } from '../companies/companies.model'
import { Departament } from '../departaments/departaments.model';
import { User } from '../users/users.model';




export interface CompanyService extends mongoose.Document {

    company: mongoose.Types.ObjectId  | Company
    mailSignup: string
    author: mongoose.Types.ObjectId | User
    dateCreated: Date
    services: any
}



export interface ReduceDepartament extends mongoose.Document {
    company: mongoose.Types.ObjectId  | Company,
    departament: mongoose.Types.ObjectId | Departament
    mailSignup:String
    dateReduce: Date
    filesDay: Number
    volumesDay: Number
    aggregateDateArchives:[{dateOcorr:Date}]    
    
    

}

const companyServiceSchema = new mongoose.Schema({
    
    company:{
        type:mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        indexes:true,
        required:true
    },
    mailSignup: {
        type: String,
        required: true,
        trim: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    dateCreated: {
        type: Date,
        default: Date.now
    },
    services:[
        {         
            description:{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'MenuService',
                required: false
            },
            price:{
                type:Number,
                default:0,
                trim: true
            },
            datePrice:{
                type: Date,
                default: Date.now
            }
        }
    ]
 


})

export const CompanyService = mongoose.model<CompanyService>('CompanyService', companyServiceSchema)