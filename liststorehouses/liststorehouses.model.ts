import * as mongoose from 'mongoose'
import {} from '../storehouses/storehouses.model'


export interface ListStorehouses extends mongoose.Document{
    name: string    
}

const listsSchema = new mongoose.Schema({
    storehouse:{
        type: mongoose.Schema.Types.ObjectId,
        indexes:true,
        ref: 'Storehouse',        
        required: true
    }

    
})


export const ListStorehouses = mongoose.model<ListStorehouses>('ListStorehouses',listsSchema)