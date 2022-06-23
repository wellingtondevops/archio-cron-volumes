import * as mongoose from 'mongoose'
import { validateCPF } from '../common/validator'

export interface Company extends mongoose.Document {
    name: string,
    adress: string,
    province: string,
    city: string,
    fone: string,
    email: string,
    answerable: string,
    typePerson: string,
    cnpj: string,
    cpf: string,
    dateCreated: Date
}

const CompSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 80,
        trim: true
    },
    adress: {
        type: String,
        required: false,
        maxlength: 80,
        trim: true

    },
    province: {
        type: String,
        required: false,
        maxlength: 15,
        trim: true
    },
    city: {
        type: String,
        required: false,
        maxlength: 50,
        trim: true
    },
    fone: {
        type: String,
        required: false,
        maxlength: 20,
        trim: true
    },
    email: {
        type: String,
        unique: false,
        match: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        required: true,
        trim: true
    },
    answerable: {
        type: String,
        required: false,
        maxlength: 80,
        trim: true
    },
    typePerson: {
        type: String,
        required: true,
        enum: ['FISICA', 'JURIDICA'],
        trim: true

    },    

    cnpj: {
        type: String,        
        match: /(?<=\D|^)(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}|\d{3}\.?\d{3}\.?\d{3}-?\d{2})(?=\D|$)/,
        required: false,
    },
    cpf: {
        type: String,
        required: false,
        validate: {
            validator: validateCPF,
            message: '{PATH}: ESTE CPF ({VALUE}) É INVÁLIDO!'
        },

    },
    dateCreated: {
        type: Date,
        default: Date.now
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    mailSignup: {
        type: String,
        required: true,
        trim: true
    },
    updateby: {
        
        mailUpdate: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required:false
        },
        dateUpdate:{
            type:Date,
            required:false
          
        }
    },


})

export const Company = mongoose.model<Company>('Company', CompSchema)



