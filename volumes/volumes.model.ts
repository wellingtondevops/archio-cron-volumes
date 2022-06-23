import * as mongoose from 'mongoose'
import { Company } from '../companies/companies.model'
import { Departament } from '../departaments/departaments.model'
import { Storehouse } from '../storehouses/storehouses.model'
import { Doct} from '../docts/docts.model'






export interface SealRef extends mongoose.Document {
    seal: number,
    sealingDate: Date
}

export interface Volume extends mongoose.Document {

    location: string,
    //description: string,    
    volumeType: string,
    guardType: string,
    status: string,
    storehouse: mongoose.Types.ObjectId | Storehouse,
    uniqueField: string
    company: mongoose.Types.ObjectId | Company,
    departament: mongoose.Types.ObjectId | Departament,
    doct: mongoose.Types.ObjectId | Doct,
    comments: String,
    listSeal: SealRef[],
    reference: String,
    seal: String,
    closeBox:Boolean
    totalPages: Number
    totalArchives: Number
    lastUpdateVolume:Date
    cron: boolean


}




const sealSchema = new mongoose.Schema({
    seal: {
        type: Number,
        trim: true
    },

    sealingDate: {
        type: Date,
        default: Date.now
    },
})


const volSchema = new mongoose.Schema({

    uniqueField: {
        type: String,
        unique: false,
        required: true,
        indexes: true

    },
    location: {
        type: String,
        required: true,
        trim: true
    },
    departament: {
        type: mongoose.Schema.Types.ObjectId,
        indexes: true,
        ref: 'Departament',
        required: true
    },
    volumeType: {
        type: String,
        required: true,
        enum: ['BOX', 'CONTAINER', 'GAVETA', 'MAPOTECA'],
        trim: true
    },
    guardType: {
        type: String,
        required: true,
        enum: ['SIMPLES', 'GERENCIADA'],
        trim: true
    },
    status: {
        type: [String],
        required: true,
        default: 'ATIVO',
        enum: ['ATIVO', 'BAIXADO', 'EMPRESTADO'],
        trim: true
    },

    storehouse: {
        type: mongoose.Schema.Types.ObjectId,
        indexes: true,
        ref: 'Storehouse',
        required: true
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        indexes: true,
        ref: 'Company',
        required: true

    },
    reference: {
        type: String,
        required: false
    },
    seal:{
        type: String,
        required: false,
        trim: true

    },
    // listSeal: {
    //     type: [sealSchema],
    //     indexes: true,
    //     required: false,

    // },
    comments: {
        type: String,
        required: false,
        trim: true
    },
    dateCreated: {
        type: Date,
       
    },

    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    mailSignup: {
        type: String,
        required: false,
        trim: true
    },
    sheetImport:{
        type: String
    },
    records:{
        type:Boolean,
        default:false
    },
    updateby: {

        mailUpdate: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: false
        },
        dateUpdate: {
            type: Date,
            required: false

        }
    },
    loans: [
        {
            demand: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Demand'
            },
            dateLoan:{
                type:Date
            }
        }
    ],
    devolutions: [
        {
            demand: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Demand'
            },
            dateDevolution:{
                type:Date
            }
        }
    ],
    lows: [
        {
            demand: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Demand'
            },
            dateLows:{
                type:Date
            }           
        }
    ],
    demands: [
        {
            demand: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Demand'
            },
            dateDemands:{
                type:Date
            }           
        }
    ],
    indDemand:{
        type:Boolean,
        default:false
    },
    demand:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Demand'
    },
    doct:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doct',
    
    },
    pending:{
        type: Boolean,
        default: false
    },
    idemail:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'Email'
    },
    closeBox:{
        type:Boolean,
        default:false
    },
    totalPages:{
        type:Number,
        default:0
    },
    totalArchives:{
        type:Number,
        default:0
    },
    lastUpdateVolume:{
        type:Date
       
    },
    cron:{
        type:Boolean,
        default:true
    },
    cronDate:{
        type:Boolean,
        default:true
    },
    smallestYear:{
        type:String
    },
    biggestYear:{
        type:String
    }



    
})

export const Volume = mongoose.model<Volume>('Volume', volSchema)
