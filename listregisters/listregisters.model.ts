import * as mongoose from 'mongoose'
import * as mongoosePaginate from 'mongoose-paginate';


import { Archive } from '../archives/archives.model'

export interface ListRegisters extends mongoose.Document{
    location: string    
}

const listsSchema = new mongoose.Schema({
    archive:{
        type: mongoose.Schema.Types.ObjectId,
        indexes:true,
        ref: 'Archive',        
        required: true
    }

    
})


listsSchema.plugin(mongoosePaginate)
//paginate
export const ListRegisters = mongoose.model<ListRegisters>('ListRegisters',listsSchema)