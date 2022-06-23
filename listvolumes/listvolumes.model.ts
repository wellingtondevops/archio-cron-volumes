import * as mongoose from 'mongoose'
import {Volume} from '../volumes/volumes.model'

export interface ListVolumes extends mongoose.Document{
    location: string    
}

const listsSchema = new mongoose.Schema({
    volume:{
        type: mongoose.Schema.Types.ObjectId,
        indexes:true,
        ref: 'Volume',        
        required: true,
        unique:true
    },
    storehouse:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Storehouse',

    }

    
})


export const ListVolumes = mongoose.model<ListVolumes>('ListVolumes',listsSchema)