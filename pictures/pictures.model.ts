import * as mongoose from 'mongoose'
export interface Pictures extends mongoose.Document {
}

const picturesSchema = new mongoose.Schema({

    storehouse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Storehouse'
      },
      doct: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doct'
      },
      volume: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Volume'
      },
      departament: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Departament'
      },
      archive: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Archive'
      },
      company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
      },
      batch: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'Batch'
      },
      thumbnailName: String,
      cod_sgi:{type:Number},
      thumbnailKey: String,
      thumbnailUrl: String,
      originalname: String,
      name: String,
      size: Number,
      page: {
        type: Number,
        required: false
      },
      key: String,
      url: String,
      diretorio: String,
      createdAt: {
        type: Date,
        default: Date.now
      },
      generationDate: {
        type: Date,        
      },
      ind:{
          type:Boolean,
          default:false
      },
      sheetImport:{
        type:String
      }
      
    
})

export const Pictures = mongoose.model<Pictures>('Pictures', picturesSchema)
