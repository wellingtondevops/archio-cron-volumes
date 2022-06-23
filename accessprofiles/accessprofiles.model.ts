import { Doct } from './../docts/docts.model';
import * as mongoose from 'mongoose'
import { Company } from '../companies/companies.model';

import { authorize } from '../security/authz.handler';
import { authenticate } from '../security/auth.handler';
import { NotExtendedError } from 'restify-errors';



export interface AccessProfiles extends mongoose.Document {

    company: mongoose.Types.ObjectId | Company
    docts: mongoose.Types.ObjectId | Doct
    usermaster:String


}

const AccessProfilesSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        trim: true
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',

    },
    docts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doct'
    }],
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    mailSignup: {
        type: String,
        required: true,
        trim: true
    },
    usermaster: {
        type: String,

    },

    dateCreated: {
        type: Date,
        default: Date.now
    },



})


export const AccessProfiles = mongoose.model<AccessProfiles>('AccessProfiles', AccessProfilesSchema)