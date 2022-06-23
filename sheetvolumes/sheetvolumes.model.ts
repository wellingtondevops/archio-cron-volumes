import * as mongoose from 'mongoose'



export interface Sheetvolume extends mongoose.Document {
    sheet: String
    location: String
    row: Number
    dateCreated: Date
    logErrors: any 
}

const sheetvolumesSchema = new mongoose.Schema({

    sheet: {
        type: String,
        require: true,
        trim: true
    },
    dateCreated: {
        type: Date,
        default: Date.now
    },   

    mailSignup: {
        type: String,        
        trim: true
    },
    logErrors: [
        {
            row: {
                type:Number
            },
            msgError:{
                type: String
            },           
            location:{
                type:String
            }
        }
    ]

})

export const Sheetvolume = mongoose.model<Sheetvolume>('Sheetvolume', sheetvolumesSchema)
