import * as mongoose from 'mongoose'
import { User } from '../users/users.model'

export interface MenuService extends mongoose.Document {
    nameServices: string
    descriptionService: string
    dateCreated: Date
    author: mongoose.Types.ObjectId | User,
    mailSignup: string

}

const menuServiceSchema = new mongoose.Schema({

    descriptionService: {
        type: String,
        required: false,
        trim: true
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
    }
    

})

export const MenuService = mongoose.model<MenuService>('MenuService', menuServiceSchema)