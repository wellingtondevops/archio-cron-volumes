import * as mongoose from 'mongoose'
import { authorize } from '../security/authz.handler';
import { authenticate } from '../security/auth.handler';
import { NotExtendedError } from 'restify-errors';
import { Storehouse } from '../storehouses/storehouses.model';
import { Company } from '../companies/companies.model';
import { Volume } from '../volumes/volumes.model';
import { Doct } from '../docts/docts.model';
import { Departament } from '../departaments/departaments.model';
import { User } from '../users/users.model';




export interface Batch extends mongoose.Document {
    
    batchNr: Number,
    company: mongoose.Types.ObjectId | Company
    storehouse: mongoose.Types.ObjectId | Storehouse
    volume: mongoose.Types.ObjectId | Volume
    doct: mongoose.Types.ObjectId | Doct
    departament: mongoose.Types.ObjectId | Departament
    author: mongoose.Types.ObjectId | User
    dateCreated: Date,
    btnEdit:boolean
    sourceVolume: boolean
    comments: String
    closeBox: mongoose.Types.ObjectId | Volume


}

const BatchSchema = new mongoose.Schema({

    batchNr:{
        type: Number,
        required:true
    },
    company:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required:true
    },
    doct:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doct',
        required:true
    },
    departament:{
        type: mongoose.Schema.Types.ObjectId,       
        ref: 'Departament'       
    },
    volume:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Volume'
    },
    storehouse:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Storehouse'
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',         
    },
    mailSignup: {
        type: String,
        required: true,
        trim: true
    },
    dateCreated: {
        type: Date,
        
    },
    comments:{
        type:String
    },
    btnEdit:{
        type:Boolean,
        default:true   //apos importar no minimo uma imagem setar para false, o edit nesse ponto pode trocar companhia e documento.
     },
     sourceVolume:{
        type:Boolean,
        default:true    //ao indexar pelo menos um registro mudar para false
     },
     finished:{
         type:Boolean,
         default:false
     }
    
})   


export const Batch = mongoose.model<Batch>('Batch', BatchSchema)