import * as mongoose from 'mongoose'


export interface Profile extends mongoose.Document {
    controllBox: any
    accessProfiles: boolean
    reports: boolean
    startcurrentdate: any
    moves: any
    searchDemand:boolean
    newDemand:boolean
    showDemand:boolean
    volumesImport: any
    volumesError: any
    requesters: boolean
    storehouses: boolean
    companies: boolean
    departaments: boolean
    volumes: boolean
    documents: boolean
    archives: boolean
    archivesImport: boolean
    archivesError: boolean
    archivesRegister: boolean
    users: boolean
    templates: boolean
    delete: boolean
    change: boolean
    read: boolean
    write: boolean
    menuServices: boolean,
    companyServices: boolean,
    profileName: string,
    profilePlaceHolder: string,
    profileExternal: boolean,
    mailSignup: string,
    totalcollection: boolean,
    limitDateSearch: string,
    scanning: boolean
    simpleArchives:boolean,
    archivesSearch:boolean
}


const profileSchema = new mongoose.Schema({

    profileName: {
        type: String,
        trim: true
    },
    profilePlaceHolder: {
        type: String,
        trim: true
    },
    profileExternal: {
        type: Boolean,
        default: false
    },
    mailSignup: {
        type: String,
        required: true,
        trim: true
    },
    write: {
        type: Boolean,
        default: true
    },
    read: {
        type: Boolean,
        default: true
    },
    change: {
        type: Boolean,
        default: true
    },
    delete: {
        type: Boolean,
        default: true
    },
    requesters: {
        type: Boolean,
        default: true
    },
    storehouses: {
        type: Boolean,
        default: true
    },
    companies: {
        type: Boolean,
        default: true
    },
    departaments: {
        type: Boolean,
        default: true
    },
    volumes: {
        type: Boolean,
        default: true
    },
    volumesImport: {
        type: Boolean,
        default: true
    },
    volumesError: {
        type: Boolean,
        default: true
    },
    documents: {
        type: Boolean,
        default: true
    },
    archives: {
        type: Boolean,
        default: true
    },
    simpleArchives:{
        type:Boolean,
        default:false
    },
    archivesImport: {
        type: Boolean,
        default: true
    },
    archivesError: {
        type: Boolean,
        default: true
    },
    archivesRegister: {
        type: Boolean,
        default: true
    },
    users: {
        type: Boolean,
        default: true
    },
    scanning:{
        type: Boolean,
        default: true
    },
    templates: {
        type: Boolean,
        default: true
    },
    moves: {
        type: Boolean,
        default: true
    },

    searchDemand: {
        type: Boolean,
        default: true
    },
    newDemand: {
        type: Boolean,
        default: true
    },
    showDemand: {
        type: Boolean,
        default: true
    },
    reports: {
        type: Boolean,
        default: true
    },
    totalcollection: {
        type: Boolean,
        default: true
    },
    companyServices: {
        type: Boolean,
        default: true
    },
    menuServices: {
        type: Boolean,
        default: true
    },
    startcurrentdate: {
        type: Boolean,
        default: true
    },
    limitDateSearch:{
        type: String
    },
    archivesSearch:{
        type:Boolean,
        default:true
    },
    accessProfiles:{
        type:Boolean,
        default:false
      },

})

export const Profile = mongoose.model<Profile>('Profile', profileSchema)

