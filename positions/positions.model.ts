import * as mongoose from 'mongoose'
import { Storehouse } from '../storehouses/storehouses.model'


export interface Position extends mongoose.Document {
  position: any
  used: any
  mapStorehouse: any
  storehouse: mongoose.Types.ObjectId | Storehouse,


}

const positionSchema = new mongoose.Schema({

    position: {
        type: String,
        trim: true,
        required: true
    },
    street:{
        type: String,
        trim:true,
        required:true
    },
    storehouse: {
        type: mongoose.Schema.Types.ObjectId,
        indexes: true,
        ref: 'Storehouse',
        required: true
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,        
        ref: 'Company'
    },
    departament: {
        type: mongoose.Schema.Types.ObjectId,        
        ref: 'Departament'        
    },
    used:{
        type:Boolean,
        default:false,
        required:true
    },
    dateCreated: {
        type: Date,
        default: Date.now
    },
    mailSignup: {
        type: String,
        required: false,
        trim: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

})


export const Position = mongoose.model<Position>('Position', positionSchema)