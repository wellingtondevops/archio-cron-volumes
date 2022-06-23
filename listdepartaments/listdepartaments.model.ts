import * as mongoose from 'mongoose'
import { } from '../companies/companies.model'


export interface ListDepartaments extends mongoose.Document {
    
}

const listcSchema = new mongoose.Schema({
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },

    name: {
        type: String,
        unique: false,
        required: true,        
        trim: true
    },
    dateCreated: {
        type: Date,
        default: Date.now
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
        
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
    }

})


export const ListDepartaments = mongoose.model<ListDepartaments>('ListDepartaments', listcSchema)