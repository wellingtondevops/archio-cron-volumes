import * as mongoose from 'mongoose'
import { Company } from '../companies/companies.model';
import { authorize } from '../security/authz.handler';
import { authenticate } from '../security/auth.handler';
import { Departament } from '../departaments/departaments.model';


export interface ReduceDepartament extends mongoose.Document {
    company: mongoose.Types.ObjectId  | Company,
    departament: mongoose.Types.ObjectId | Departament
    mailSignup:String
    dateReduce: Date
    filesDay: Number
    volumesDay: Number
    pagesDay: Number
    aggregateDateArchives:[{dateOcorr:Date}]
    totalPageArchiveDepartament:[{dateOcorr:Date}]
    departamentName:String

}

const ReduceDepartamentsSchema = new mongoose.Schema({


    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    mailSignup:{
        type:String
    },
    departament: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Departament'
    },
    departamentName:{
        type: String
    },
    totalPageArchiveDepartament:[
        {
            dateOcorr:{
                type:Date,
                
            },
            total:{
                type:Number,
                default: 0
            }
        }
    ],
    totalVolumesDepartaments:{type:Number},
    aggregateDateVolumes:[
        {
            dateOcorr:{
                type:Date,
                default: () => new Date(+ new Date ()+ 1*24*60*60*1000)
            },
            total:{
                type:Number,
                default:0
            }
        }
        
    ],
    totalArchivesDepartaments:{
        type:Number
    },
    aggregateDateArchives:[
        {
            dateOcorr:{
                type:Date,
                default:""
            },
            total:{
                type:Number,
                default:0
            }
        }
    ],
    aggregateDatePagesArchives:[
        {
            dateOcorr:{
                type:Date
            },
            total:{
                type:Number
            }
        }
    ]

   
})

export const ReduceDepartament = mongoose.model<ReduceDepartament>('ReduceDepartament', ReduceDepartamentsSchema)