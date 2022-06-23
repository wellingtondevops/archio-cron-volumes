import * as mongoose from 'mongoose'
import { Company } from '../companies/companies.model';
import { authorize } from '../security/authz.handler';
import { authenticate } from '../security/auth.handler';
import { Doct} from '../docts/docts.model';


export interface ReduceDocument extends mongoose.Document {
    company: mongoose.Types.ObjectId  | Company,
    doct: mongoose.Types.ObjectId |  Doct,
    mailSignup:String
    dateReduce: Date
    filesDay: Number
    pagesDay: Number
    volumesDay: Number

}

const ReduceDocumentSchema = new mongoose.Schema({


    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    mailSignup:{
        type:String
    },
    doct: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doct'
    },
    documentName:{
        type: String
    },
    totalArchivesDocuments:{type:Number},
    totalPageArchiveDocument:[
        {
            dateOcorr:{
                type:Date
            },
            total:{
                type:Number
            }
        }
    ],
    aggregateDateArchives:[
        {
            dateOcorr:{
                type:Date
            },
            total:{
                type:Number,
                defaul:0
            }
        }
    ],
    aggregateDatePagesArchives:[
        {
            dateOcorr:{
                type:Date
            },
            total:{
                type:Number,
                default:0
            }
        }
    ]
})


export const ReduceDocument = mongoose.model<ReduceDocument>('ReduceDocument', ReduceDocumentSchema)