import * as mongoose from 'mongoose'
import { Company } from '../companies/companies.model';
import { User  } from '../users/users.model';
import {Doct} from '../docts/docts.model'

export interface Demand extends mongoose.Document {
    volume: any;
    volumeType: any;
    
    itens: any;
    isMoveArchive(isMoveArchive: any);
    nr: number
    company: mongoose.Types.ObjectId  | Company
    docts: mongoose.Types.ObjectId  | Doct
    requester:  mongoose.Types.ObjectId  | User
    author: mongoose.Types.ObjectId  | User
    mailSignup: string
    withdraw: boolean
    delivery: boolean
    loan: boolean
    low: boolean
    moveArchive: boolean
    moveVolume: boolean
    emergency: boolean
    normal: boolean
    demandDate: Date
    processed: boolean
    processedDate: Date
}

const DemandsSchema = new mongoose.Schema({

    nr:{  // nr da demanda
        type:Number,
        default:0,
    },
    company:{   // Empresa
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    requester:{   //Solicitante
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    author: {   // autor
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    mailSignup: {
        type: String,
        required: true,
        trim: true
    },
    loan:{  //tipo de movimentação = Emprestimo
        type: Boolean ,
        default:false
    },
    low:{ //tipo de movimentação = Baixa
        type: Boolean ,
        default:false
    },
    withdraw:{   // formato da entrega = Retirar
        type: Boolean ,
        default:false
    },
    delivery:{    // formato da entrega = entrega
        type: Boolean ,
        default:false
    },
    digital:{    // formato da entrega = Digital
        type: Boolean ,        
        default:false
    },
    moveArchive:{    // tipo movimentação = Movimentação de Arquivos
        type: Boolean ,
        default:false
    },
    moveVolume:{   // tipo movimentação = Movimentação de Volumes
        type: Boolean ,
        default:false
    },
    emergency:{ //Se é Emergencial
        type: Boolean,
        default:false
    },
    normal:{  //Se é Normal
        type: Boolean,
        default:false
    },
    demand:{   // se está ainda como Solicitação
        type:Boolean,
        default:true
    },
    title:{   // titulo se está como Solicitação ainda ou já se transformou em Movimentação
        type: String,
        required: false,
        enum: ['SOLICITAÇÃO', 'MOVIMENTAÇÃO'],
        trim: true,
        default: 'SOLICITAÇÃO'
    },
    demandDate:{
        type: Date
    },
    processed:{    // se já está como processado ou seja já gerou a movimentação
        type: Boolean,
        default:false
    },
    processedDate:{  // data do processamento, ou seja quando de fato movimentou.
        type:Date
    },
    itens:[
        {
            company:{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Archive'
            },
            isMovVolum:{
                type:Boolean
            },
            isMovArchive:{
                type:Boolean
            },
            archive:{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Archive'
            },            
            tagArchive:{
                type: String,
            },
            volume:{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Volume'
            },
            location:{
                type:String
            },
            volumeType:{
                type: String,
                enum: ['BOX', 'CONTAINER', 'GAVETA', 'MAPOTECA'],
                trim: true
            },
            isLoan:{
                type:Boolean,
                default:false
            },
            authorLoan:{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: false
            },
            dateLoan:{
                type: Date
            },
            islow:{
                type:Boolean,
                default:false
            },
            authorLow:{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: false
            },
            dateLow:{
                type:Date
            },
            isDevoluton:{
                type:Boolean,
                default:false
            },
            authorDevolution:{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: false
            },
            dateDevolution:{
                type: Date
            },
            mailSignup: {
                type: String,
                required: true,
                trim: true
            }
        }
    ],
    servicesDemand:[
        {
            quantityItem:{
                type: Number
            },
            itemValue:{
                type:Number
            },
            totalItem:{
                type:Number
            },
            item:{
                type:String
            }
        }
    ],
    totalValueDemand:{
        type:Number        
    }
})


export const Demand = mongoose.model<Demand>('Demand', DemandsSchema)