

import * as restify from 'restify'
import * as bcrypt from 'bcrypt'
import * as mongoose from 'mongoose'
import { environment } from '../common/environment'
import { ModelRouter } from '../common/model-router'
import { UserPermissions } from './userpermissions.model'
import { AccessProfiles } from '../accessprofiles/accessprofiles.model';
import { Company } from '../companies/companies.model'
import { NotFoundError, MethodNotAllowedError } from 'restify-errors';
import { Doct } from '../docts/docts.model'
import { authenticate } from '../security/auth.handler';
import { authorize } from '../security/authz.handler'



class UserPermissionsRouter extends ModelRouter<UserPermissions> {
    constructor() {
        super(UserPermissions)
        // this.on('beforeRender', document => {
        //     document.password = undefined
        // })
    }
    protected prepareOne(query: mongoose.DocumentQuery<UserPermissions, UserPermissions>): mongoose.DocumentQuery<UserPermissions, UserPermissions> {
        return query
            .populate("company", "name")
            .populate("docts", "name")


    }

    envelop(document) {
        let resource = super.envelope(document)
        const depID = document.accessprofiles._id ? document.accessprofiles._id : document.accessprofiles
        resource._links.accessprofiles = `/userpermissions/${depID}`
        return resource
    }

    show = async (req, resp, next) => {

        try {
            const show = await this.prepareOne(this.model.findById(req.params.id)
                .populate("company", "name")
                .populate("docts", "name")
                .populate("accessprofiles", "name")
            ).then(show => {
                resp.send(show)
            })
                .catch(next)
        } catch (error) {
            console.log(`Erro ao exibir de Perfis de acesso - ${error}`)
            throw new MethodNotAllowedError(`Erro ao exibir de Perfis de acesso - ${error}`)

        }


    }

    updateUserPermissions = async (req, resp, next) => {

        try {
            const options = { runValidators: true, new: true }
            UserPermissions.findByIdAndUpdate(req.params.id, req.body, options)
                .then(this.render(resp, next))

        } catch (error) {
            console.log(`Erro ao atualizar Permissões de Acesso - ${error}`)
            throw new MethodNotAllowedError(`Erro ao atualizar Permissões de Acesso - ${error}`)

        }

    }


    listDocuments = async (req, resp, next) => {
        const dataPermissions = await (await UserPermissions.find({ _id: req.params.id }).sort('name')).pop()
        const { company, docts } = dataPermissions
        let listdocUser = []
        let docUser = []
        docUser.push(docts)
        let docs = docUser.pop()
        for (const doc of docs) {
            const d = doc
            listdocUser.push(d)

        }

      
        const listdocCompanies = await Doct.find({ "_id": { $nin: listdocUser }, company: company })
        .sort('name')
        .select('id')
        .select('name')

        resp.send(listdocCompanies)



    }
    listDocumentsUsers = async (req, resp, next) => {



        const dataPermissions = (await UserPermissions.find({ _id: req.params.id })
        .populate("docts", "name")
        .sort("name")).pop()
        const { docts } = dataPermissions
        resp.send(docts)

    }
    addDocuments =  async(req,resp,next)=>{
       

        const { docts}= req.body
        // console.log(docts)
        for(const doct of docts){
            const d = doct.toString()
          await UserPermissions.findOneAndUpdate({"_id":req.params.id},{$push: {docts:d }})
        }
       resp.send({mss:"Documentos Adicionados com Suscesso"})

    }
    removeDocuments =  async(req,resp,next)=>{
       

        const { docts}= req.body
        // console.log(docts)
        for(const doct of docts){
            const d = doct.toString()
          await UserPermissions.findOneAndUpdate({"_id":req.params.id},{$pull: {docts:d }})
        }
       resp.send({mss:"Documentos removidos com Suscesso"})

    }



    listProfiles = async (req, resp, next) => {


        const dataPermissions = await (await UserPermissions.find({ _id: req.params.id })).pop()
        const { company, accessprofiles } = dataPermissions
        let listprofUser = []
        let proUser = []
        proUser.push(accessprofiles)
        let profs = proUser.pop()
        for (const prof of profs) {
            const p = prof
            listprofUser.push(p)

        }

        const listdocCompanies = await AccessProfiles.find({ "_id": { $nin: listprofUser }, company: company })
        .sort('name')
        .select('id').select('name')

        resp.send(listdocCompanies)



    }
    listProfilesUsers = async (req, resp, next) => {


        const dataPermissions = (await UserPermissions.find({ _id: req.params.id })
        .sort('name')
        .populate("accessprofiles", "name")).pop()
        const { accessprofiles } = dataPermissions
        resp.send(accessprofiles)

       
        

    }
    




    applyRoutes(applycation: restify.Server) {


        applycation.get(`${this.basePath}/:id`, [authorize('DAENERYS', 'STARK'), this.show])
        applycation.del(`${this.basePath}/:id`, [authorize('DAENERYS', 'STARK'), this.delete])
        
        applycation.patch(`${this.basePath}/:id`, [authorize('DAENERYS', 'STARK'), this.updateUserPermissions])
        applycation.get(`${this.basePath}/listdoumentos/:id`, [authorize('DAENERYS', 'STARK'), this.listDocuments])

        applycation.get(`${this.basePath}/listprofiles/:id`, [authorize('DAENERYS', 'STARK'), this.listProfiles])
        applycation.get(`${this.basePath}/listdoumentosuser/:id`, [authorize('DAENERYS', 'STARK'), this.listDocumentsUsers])
        applycation.get(`${this.basePath}/listprofilesuser/:id`, [authorize('DAENERYS', 'STARK'), this.listProfilesUsers])
        applycation.post(`${this.basePath}/addocuemnts/:id`, [authorize('DAENERYS', 'STARK'), this.addDocuments])
        applycation.post(`${this.basePath}/rmdocuemnts/:id`, [authorize('DAENERYS', 'STARK'), this.removeDocuments])
        




    }
}
export const userPermissionsRouter = new UserPermissionsRouter()