import * as mongoose from 'mongoose'
import { Archive } from '../archives/archives.model';
import { User } from '../users/users.model';




export interface Audit extends mongoose.Document {

    whoAccessed: mongoose.Types.ObjectId |User,
    whatAccessed:mongoose.Types.ObjectId |Archive,
    doctAccessed:mongoose.Types.ObjectId |User,
    whenAccessed:Date
    mailSignup: String


}

const auditsSchema = new mongoose.Schema({

    whoAccessed:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    whatAccessed:{
        type:mongoose.Schema.Types.ObjectId,
        ref: 'Archive'
    },
    doctAccessed:{
        type:mongoose.Schema.Types.ObjectId,
        ref: 'Doct'
    },
    whenAccessed:{
        type: Date,
        default: Date.now
    },   
    mailSignup: {
        type: String,
        required: true,
        trim: true
    },
    

   
})

export const Audit = mongoose.model<Audit>('Audit', auditsSchema)
