import * as mongoose from 'mongoose'
import { Volume } from '../volumes/volumes.model'
import { Company } from '../companies/companies.model'
import { Doct } from '../docts/docts.model'
import { Storehouse } from '../storehouses/storehouses.model'
import { Pictures } from '../pictures/pictures.model'
import * as mongoosePaginate from 'mongoose-paginate';
import { KeyObject } from 'crypto';
import { Demand } from '../demands/demands.model';
import { Email } from '../emails/emails.model'


export interface Archive extends mongoose.Document {
    loans: []
    devolutions: []
    demands: []
    lows: []
    indDemand: boolean
    create: any
    picture: any
    status: any
    departament: any
    company: mongoose.Types.ObjectId | Company,
    storehouse: mongoose.Types.ObjectId | Storehouse,
    volume: mongoose.Types.ObjectId | Volume,
    doct: mongoose.Types.ObjectId | Doct,
    tag: [string],
    created: Date,
    imagePresence: Boolean,
    pictures: mongoose.Types.ObjectId | Pictures,
    demand: mongoose.Types.ObjectId | Demand,
    final : Boolean,
	finalCurrent : Boolean,
	finalIntermediate : Boolean
}


const archSchema = new mongoose.Schema({


    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true

    },
    storehouse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Storehouse',

    },

    volume: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Volume',


        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company',

        }

    },
    departament: {
        type: mongoose.Schema.Types.ObjectId,

        ref: 'Departament',

    },
    doct: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doct'
    },
    tag: {
        type: [String],


    },
    tagSearch: {
        type: String,
    },

    uniqueness: {
        type: String,  /// concatenar version-uniquefields-id_volume
        select: false,


    },
    version: {
        type: Number,
        default: 1
    },
    create: {
        type: Date,
        default: Date.now
    },
    imagePresence: {
        type: Boolean,
        select: false,

        default: false
    },


    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    mailSignup: {
        type: String,
        select: false,

        trim: true
    },
    picture: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pictures',
    },
    status: {
        type: [String],

        default: 'ATIVO',
        enum: ['ATIVO', 'BAIXADO', 'EMPRESTADO'],

    },
    updateby: {

        mailUpdate: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',

        },
        dateUpdate: {
            type: Date,


        }
    },
    startDateCurrent: {
        type: Date
    },
    finalDateCurrent: {
        type: Date
    },
    finalCurrent:{
        type:Boolean,
        default:false
    },

    finalDateIntermediate: {
        type: Date
    },
    finalIntermediate:{
        type:Boolean,
        default:false
    },

    finalFase: {
        type: String
    },
    final:{
        type:Boolean,
        default:false
    },
    sponsor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'

    },
    sheetImport:{
        type: String
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
    pending:{
        type: Boolean,
        default: false
    },
    idemail:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'Email'
    }

})


archSchema.plugin(mongoosePaginate)

export const Archive = mongoose.model<Archive>('Archive', archSchema)