import * as mongoose from 'mongoose'



export interface Sheetarchive extends mongoose.Document {
    sheet: any
    logErrors: any

   
    dateCreated: Date
   
}

const sheetarchivesSchema = new mongoose.Schema({

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
            },
            tag:{
                type:String
            }           

        }
    ]

})

export const Sheetarchive = mongoose.model<Sheetarchive>('Sheetarchive', sheetarchivesSchema)
