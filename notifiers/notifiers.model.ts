import * as mongoose from 'mongoose'
import { Company } from '../companies/companies.model'
import { Departament } from '../departaments/departaments.model'
import { Storehouse } from '../storehouses/storehouses.model'
import { Doct} from '../docts/docts.model'
import { User } from '../users/users.model'
import { environment } from '../common/environment'


export interface Notifier extends mongoose.Document {

    title: String
    msg: String
    attachment: String
    linkIcon: String
    ulrSheet: String
    user: mongoose.Types.ObjectId | User
    mailSignup: String
    active: Boolean
    dateCreated: Date
}

const notifierSchema = new mongoose.Schema({

    title: {
        type: String,
        required: false,
        trim: true
    },
    msg: {
        type: String,
        required: false,
        trim: true
    },
    attachment: {
        type: String,
        required: false,
        trim: true
    },
    linkIcon: {
        type: String,
        required: false,
        trim: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    mailSignup: {
        type: String,
        required: false,
        trim: true
    },
    active:{
        type: Boolean,
        default:true
    },
    dateCreated: {
        type: Date,
        default: Date.now
    },   
    
})

export const Notifier = mongoose.model<Notifier>('Notifier', notifierSchema)
