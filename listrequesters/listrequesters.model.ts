import * as mongoose from 'mongoose'
import { User } from '../users/users.model';
import { validateCPF } from '../common/validator'



export interface ListRequesters extends mongoose.Document {
    
}

const listrSchema = new mongoose.Schema({


    name: {
        type: String,
        required: true,
        maxlength: 80,
        minlength: 3,
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
        required: false,
        trim: true
    
      },
      password: {
        type: String,
        select: false,
        required: false
    
      },
      //TYPE USERS:
    
      /*
      SNOW= USUÁRIO NORMAL FAZ NADA SÓ VISUALIZA
      TYWIN= VISUALIZA  INSERE NOVOS REGISTROS E APAGA
      DAENERYS = FAZ TUDO QUE OS OUTROS FAZEM PORÉM CRIA NOVOS TIPOS DE DOCUMENTOS NOVOS DEPOSITOS
       NOVAS COMPANHIAS
      */
      profile: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Profile'
      }, // a vanessa só vai passar o id do profile o resto é com o backend, deverá preencher profiles e externalUser, não mais a vanessa. para efeito de front
      //o profiles ainda será a referencia para controlar as coisas.
    
    
      profiles: {
        type: [String],
        required: false,
        enum: ['SNOW', 'TYWIN', 'DAENERYS', 'STARK', 'TULLY','WESTEROS'],
        //DAENERYS -ADMINISTRADOR
        //SNOW - USUÁRIO PESQUISADOR
        //TYWIN - USUÁRIO INDEXADOR
        //STARK - ADMININSTRADOR DO CLIENTE
        //TULLY - USUÁRIO DO CLIENTE
        //WESTEROS - SOLICITANTE 
        trim: true
      },
      mailSignup: {
        type: String,
        required: true,
        trim: true
      },
      isSponser: {
        type: Boolean,
        required: true,
        default: false
      },
      isRequester: {
        type: Boolean,
        required: false,
        default: false
      },
    
      dateCreated: {
        type: Date,
        default: Date.now
      },
      externalUser: {
        type: Boolean,    ///somente será true se o tipo do user for stark ou for criado por um outro stark
        default: false
      },
      createdBy: {
        type: String, //agora vamos registrar quem criou o usuário
        
      },
    
    
      acceptanceTerm: {
        type: Boolean,
        default: false   /// sinaliza se vizualizou
      },
      DateAcceptanceTerm: {
        type: Date     // data na qual vizualizou
        
      },
      print: {
        type: Boolean,  //ira controlar as ações como por exemplo, imprimir
        default: true
      },
      download: {
        type: Boolean,    // ira controlar ação de donwnload
        default: true
      },
      physicalDocuments:
      {
        type: Boolean,   // ira controlar se usuário pode solicitar documentos
        required:false,
        default:false
      },
      creator: {
        type: mongoose.Schema.Types.ObjectId,
        indexes: true,
        ref: 'Users'                                   /// controla quem criou
      },
      creationDate: {
        type: Date,
        default: Date.now
      },
    
    
    
      updateBy: [
        {
          creator: {
            type: mongoose.Schema.Types.ObjectId,
            indexes: true,
            ref: 'Users'                                   /// quem alterou
          },
          updateDate: {
            type: Date,
            default: Date.now
          }
        }
      ],
      userActive: {
        type: Boolean,   //ira fazer o controle de desativação do user  (deletar)
        default: true
      },
    
    
      permissions: [
        {
          company: {
            type: mongoose.Schema.Types.ObjectId,
            indexes: true,
            ref: 'Company'
          },
          docts: [{
            type: mongoose.Schema.Types.ObjectId,
            indexes: true,
            ref: 'Doct'
          }]
        }
      ],
    
   
})


export const ListRequesters = mongoose.model<ListRequesters>('ListRequesters', listrSchema)