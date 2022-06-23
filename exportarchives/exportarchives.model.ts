import * as mongoose from 'mongoose'



export interface ExportArchives extends mongoose.Document {
    name: string
}

const exportArchives = new mongoose.Schema({
    archive: {
        type: mongoose.Schema.Types.ObjectId,
        indexes: true,
        ref: 'Archives',
        required: true
    }
})


export const ExportArchives = mongoose.model<ExportArchives>('ExportArchives', exportArchives)