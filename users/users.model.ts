import * as  mongoose from 'mongoose'
import { validateCPF } from '../common/validator'
import * as bcrypt from 'bcrypt'
import { environment } from '../common/environment'
import { AccessProfiles } from '../accessprofiles/accessprofiles.model'
import { UserPermissions} from '../userpermissions/userpermissions.model'




export interface User extends mongoose.Document {
  [x: string]: any
  name: string,
  email: string,
  password: string,
  permissions: any[],
  profiles: string[],
  matches(password: string): boolean,
  maintenance: Boolean
  movement: Boolean
  hasAny(...profiles: string[]): boolean,
  download: Boolean
  print: Boolean
  physicalDocuments: Boolean
  accessprofile:  mongoose.Types.ObjectId | AccessProfiles
  userpermission:  mongoose.Types.ObjectId | UserPermissions
  usermaster:string
  theme: string
  
}

export interface UserModel extends mongoose.Model<User> {
  findByEmail(email: string, projection?: string): Promise<User>
}
///
const userSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true,
    maxlength: 80,
    minlength: 3,
    trim: true

  },
  theme:{
    type:String,
    required: false,
    default:"bootstrap"
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

  accessprofile:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AccessProfiles'

  },
  // userpermission:{
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'UserPermissions'

  // },
  profiles: {
    type: [String],
    required: false,
    enum: ['SNOW', 'TYWIN', 'DAENERYS', 'STARK', 'TULLY', 'WESTEROS'],
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
    required: false,
    default: true
  },
  download: {
    type: Boolean,    // ira controlar ação de donwnload
    required: false,
    default: true
  },
  physicalDocuments:
  {
    type: Boolean,   // ira controlar se usuário pode solicitar documentos
    required: false,
    default: true
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
  usermaster:{
    type:String,
    indexes: true
  },
  maintenance: {
    type: Boolean,
    default: false
  },
  movement: {
    type: Boolean,
    default: false
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
  controllBox:{
    type:Boolean,
    default:false
  },
  permissions: [
    {
      company: {
        type: mongoose.Schema.Types.ObjectId,
        // indexes: true,
        ref: 'Company'
      },
      docts: [{
        type: mongoose.Schema.Types.ObjectId,
        // indexes: true,
        ref: 'Doct'
      }]
    }
  ],
  receiveCorrection:{
    type:Boolean,
    default:false
  },
  receiveLoan:{
    type:Boolean,
    default:false
  },
  

})

userSchema.statics.findByEmail = function (email: string, projection: string) {

  return User.findOne({ email }, projection) //{email: email}
}

userSchema.methods.matches = function (password: string): boolean {
  return bcrypt.compareSync(password, this.password)
}

const hashPassword = (obj, next) => {
  bcrypt.hash(obj.password, environment.security.saltRounds)
    .then(hash => {
      obj.password = hash
      next()
    }).catch(next)
}

userSchema.methods.hasAny = function (...profiles: string[]): boolean {
  return profiles.some(profile => this.profiles.indexOf(profile) !== -1)
}

const saveMiddleware = function (next) {
  const user: User = this
  if (!user.isModified('password')) {
    next()
  } else {
    hashPassword(user, next)
  }
}

const updateMiddleware = function (next) {
  if (!this.getUpdate().password) {
    next()
  } else {
    hashPassword(this.getUpdate(), next)
  }
}


const forgotMiddleware = function (next) {
  if (!this.getUpdate().password) {
    next()
  } else {
    hashPassword(this.getUpdate(), next)
  }
}


userSchema.pre('save', saveMiddleware)
userSchema.pre('findOneAndUpdate', updateMiddleware)
userSchema.pre('update', updateMiddleware)
userSchema.pre('forgotPassword', forgotMiddleware)


export const User = mongoose.model<User, UserModel>('User', userSchema)
