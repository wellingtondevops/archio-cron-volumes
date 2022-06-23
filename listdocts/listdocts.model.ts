import * as mongoose from 'mongoose'

export interface ListDocts extends mongoose.Document {
    name: string
}

const listsSchema = new mongoose.Schema({
    docts: {
        type: mongoose.Schema.Types.ObjectId,
        indexes: true,
        ref: 'Docts',
        required: true
    }
})

export const ListDocts = mongoose.model<ListDocts>('ListDocts', listsSchema)