import * as mongoose from 'mongoose'
import { Company } from '../companies/companies.model';
import { User } from '../users/users.model';
import { authorize } from '../security/authz.handler';
import { authenticate } from '../security/auth.handler';
import { NotExtendedError } from 'restify-errors';
import { Archive } from '../archives/archives.model'
import { Volume} from '../volumes/volumes.model'
 


export interface Email extends mongoose.Document {
title: any;

archive: mongoose.Types.ObjectId | Archive
volume: mongoose.Types.ObjectId | Volume
mailSignup: String
userSernder: any
receiver: any
requestType: any
dateCreated: Date
click: Boolean

}

const emailSchema = new mongoose.Schema({

    archive: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Archive'
    },

  
    title:{
        type:String
    },
    mailSignup: {
        type: String,
        required: true,
        trim: true
      },
    userSernder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },


    receivers: [{
        type: mongoose.Schema.Types.ObjectId,
 
        ref: 'User'
        
    }],
   
    requestType: {
        type: [String],
        required: false,
        enum: ['CORRECAO_INDICE', 'CORRECAO_IMAGEM', 'EMPRESTIMO','REPOSTA'],
       
        trim: true
      },
    notes:{
        type: String,
        required: false
    },  
    dateCreated: {
        type: Date,
        default: Date.now
    },
    highlighted:{
        type: Boolean,
        default:true
    }

})

export const Email = mongoose.model<Email>('Email', emailSchema)