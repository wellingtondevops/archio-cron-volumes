import * as mongoose from 'mongoose'
import { Company } from '../companies/companies.model';
import { User } from '../users/users.model';
import { authorize } from '../security/authz.handler';
import { authenticate } from '../security/auth.handler';
import { NotExtendedError } from 'restify-errors';
import { } from './departaments.router';


export interface Departament extends mongoose.Document {
    company: mongoose.Types.ObjectId  | Company,
    name:string,
    author:mongoose.Types.ObjectId  | User,
    mailSignup:string
    cron: Boolean

    
}

const DepartamentSchema = new mongoose.Schema({
    
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },

    name: {
        type: String,        
        required: true,        
        trim: true
    },
    dateCreated: {
        type: Date,
        default: Date.now
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
    },
    mailSignup: {
        type: String,
        required: true,
        trim: true
    },
    updateby: {        
        mailUpdate: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required:false
        },
        dateUpdate:{
            type:Date,
            required:false
        }
    },
    cron:
    {
        type: Boolean,
        default:false
    }

})   


export const Departament = mongoose.model<Departament>('Departament', DepartamentSchema)