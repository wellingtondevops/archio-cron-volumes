import { Doct } from './../docts/docts.model';
import * as mongoose from 'mongoose'
import { Company } from '../companies/companies.model';

import { authorize } from '../security/authz.handler';
import { authenticate } from '../security/auth.handler';
import { NotExtendedError } from 'restify-errors';
import { AccessProfiles } from '../accessprofiles/accessprofiles.model';



export interface UserPermissions extends mongoose.Document {


    company: mongoose.Types.ObjectId | Company
    docts: mongoose.Types.ObjectId | Doct
    accessprofiles: mongoose.Types.ObjectId | AccessProfiles

}

const UserPermissionsSchema = new mongoose.Schema({


    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'

    },
    accessprofiles: [{
        type: mongoose.Schema.Types.ObjectId,
        indexes: true,
        ref: 'AccessProfiles'
    }],
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',

    },
    docts: [{
        type: mongoose.Schema.Types.ObjectId,
        indexes: true,
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
    dateCreated: {
        type: Date,
        default: Date.now
    }


})


export const UserPermissions = mongoose.model<UserPermissions>('UserPermissions', UserPermissionsSchema)
