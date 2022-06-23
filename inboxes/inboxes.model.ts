// import { Todo } from '../todos/todos.model';
import { User } from '../users/users.model';
import * as mongoose from 'mongoose'


export interface Inbox extends mongoose.Document {

    mailSignup : String
    sender: mongoose.Types.ObjectId | User
    destined: mongoose.Types.ObjectId | User
    // todo:  mongoose.Types.ObjectId | Todo
    words : String
    create: Date
    

}


const inboxSchema = new mongoose.Schema({

    mailSignup: {
        type: String,
        required: true,
        trim: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false

    },
    destined: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    todo:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Todo',
        required: false
    },
    words:{
        type: String
    },
    create: {
        type: Date,
        default: Date.now
    }


})

export const Inbox = mongoose.model<Inbox>('Inbox', inboxSchema)

