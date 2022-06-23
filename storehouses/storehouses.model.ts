import * as mongoose from 'mongoose'


export interface Storehouse extends mongoose.Document{
    mapStorehouse: any
    name: string   
    
}

const storeSchema = new mongoose.Schema({
    name: {
        type: String,
        required:true,
        minlength:2,
        maxlength:40,
        trim: true
    },
    dateCreated: {
        type:Date,
        default:Date.now
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
    mapStorehouse:{
        type:Boolean,
        default:false
    },
    virtualHd:{
        type:Boolean,
        default:false
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


export const Storehouse = mongoose.model<Storehouse>('Storehouse',storeSchema)