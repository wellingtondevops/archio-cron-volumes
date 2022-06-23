import * as mongoose from 'mongoose'
import { } from '../companies/companies.model'


export interface ListCompanies extends mongoose.Document {
    name: string
}

const listcSchema = new mongoose.Schema({
    company: {
        type: mongoose.Schema.Types.ObjectId,
        indexes: true,
        ref: 'Company',
        required: true
    }
})


export const ListCompanies = mongoose.model<ListCompanies>('ListCompanies', listcSchema)