import { SheetName } from '../sheetnames/sheetnames.model';
import * as mongoose from 'mongoose'
import { Company } from '../companies/companies.model'
import { Doct } from '../docts/docts.model'
import { User } from '../users/users.model'


export interface Worksheet extends mongoose.Document {
    sheetName: mongoose.Types.ObjectId | SheetName,
    company: mongoose.Types.ObjectId | Company,
    doct: mongoose.Types.ObjectId | Doct,
    fieldSearch: String
    Columns: String[]
    fieldColumns: String[]
    mailSignup: String
    author: mongoose.Types.ObjectId | User,
    create: Date
}

const worksheetSchema = new mongoose.Schema({
    sheetName: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SheetName'
        
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    },
    doct: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doct'
    },
    fieldSearch: {
        type: String
    },
    Columns: {
        type: [String],

    },
    fieldColumns: {
        type: [String],

    },
    mailSignup: {
        type: String,
        select: false
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    create: {
        type: Date,
        default: Date.now
    }
})

export const Worksheet = mongoose.model<Worksheet>('Worksheet', worksheetSchema)



