import { Company } from './../companies/companies.model';
import { Doct } from './../docts/docts.model';
import * as mongoose from 'mongoose'
import { User } from '../users/users.model'



export interface SheetName extends mongoose.Document {
    sheetname: String
    mailSignup: String
    company: mongoose.Types.ObjectId | Company,
    doct: mongoose.Types.ObjectId | Doct,
    author: mongoose.Types.ObjectId | User,
    createAt: Date
}


const sheetnameSchema = new mongoose.Schema({
    sheetname: {
        type: String,
        trim: true
    },    
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    },
    doct: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doct'
    },
    mailSignup: {
        type: String,
        select: false
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createAt: {
        type: Date,
        default: Date.now
    }
})

export const SheetName = mongoose.model<SheetName>('SheetName', sheetnameSchema)



