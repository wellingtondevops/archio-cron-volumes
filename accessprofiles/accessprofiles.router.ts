import { userPermissionsRouter } from './../userpermissions/userpermissions.router';
import { User } from './../users/users.model';


import * as restify from 'restify'
import * as bcrypt from 'bcrypt'
import * as mongoose from 'mongoose'
import { environment } from '../common/environment'
import { ModelRouter } from '../common/model-router'
import { AccessProfiles } from './accessprofiles.model'
import { Company } from '../companies/companies.model'
import { NotFoundError, MethodNotAllowedError } from 'restify-errors';
import { authenticate } from '../security/auth.handler';
import { authorize } from '../security/authz.handler'
import { Doct } from '../docts/docts.model';
import { UserPermissions } from '../userpermissions/userpermissions.model'



class AccessProfilesRouter extends ModelRouter<AccessProfiles> {
    constructor() {
        super(AccessProfiles)
        // this.on('beforeRender', document => {
        //     document.password = undefined
        // })
    }
    protected prepareOne(query: mongoose.DocumentQuery<AccessProfiles, AccessProfiles>): mongoose.DocumentQuery<AccessProfiles, AccessProfiles> {
        return query
            .populate("company", "name")
            .populate("docts", "name")


    }

    envelop(document) {
        let resource = super.envelope(document)
        const depID = document.accessprofiles._id ? document.accessprofiles._id : document.accessprofiles
        resource._links.accessprofiles = `/accessprofiles/${depID}`
        return resource
    }

    save = async (req, resp, next) => {



        try {

            let document = new AccessProfiles({
                company: req.body.company,
                name: req.body.name.toUpperCase().trim(),
                docts: req.body.docts,
                author: req.authenticated._id,
                mailSignup: req.authenticated.mailSignup
            })
            AccessProfiles.find({
                mailSignup: req.authenticated.mailSignup,
                company: req.body.company,
                name: req.body.name
            })
                .then(async (access) => {

                    if (access.length === 0) {
                        await document.save()
                            .then(this.render(resp, next))
                    } else {
                        throw new MethodNotAllowedError(`Perfil ${req.body.name.toUpperCase().trim()}já cadastrado, por favor cadastro um outro nome...`)
                    }
                }).catch(next)

        } catch (error) {
            console.log(`Erro ao criar Perfil de Acesso - ${error}`)
            throw new MethodNotAllowedError(`Erro ao criar Perfil de Acesso - ${error}`)
        }

        // /// regras para somente os admin externos possam ter acesso aos seus perfils.
        // if (req.authenticated.profiles.toString() === "DAENERYS") {

        //     try {

        //         let document = new AccessProfiles({
        //             company: req.body.company,
        //             name: req.body.name.toUpperCase().trim(),
        //             docts: req.body.docts,
        //             author: req.authenticated._id,
        //             mailSignup: req.authenticated.mailSignup
        //         })

        //         this.model.find({
        //             mailSignup: req.authenticated.mailSignup,
        //             company: req.body.company,
        //             name: req.body.name
        //         })
        //             .then(async (access) => {

        //                 if (access.length === 0) {
        //                     await document.save()
        //                         .then(this.render(resp, next))
        //                 } else {
        //                     throw new MethodNotAllowedError(`Perfil ${req.body.name.toUpperCase().trim()}já cadastrado, por favor cadastro um outro nome...`)
        //                 }
        //             }).catch(next)

        //     } catch (error) {
        //         console.log(`Erro ao criar Perfil de Acesso - ${error}`)
        //         throw new MethodNotAllowedError(`Erro ao criar Perfil de Acesso - ${error}`)
        //     }

        // } else {

        //     try {

        //         let document = new AccessProfiles({
        //             company: req.body.company,
        //             name: req.body.name.toUpperCase().trim(),
        //             docts: req.body.docts,
        //             author: req.authenticated._id,
        //             mailSignup: req.authenticated.mailSignup,
        //             usermaster: req.authenticated.usermaster


        //         })

        //         this.model.find({
        //             mailSignup: req.authenticated.mailSignup,
        //             company: req.body.company,
        //             name: req.body.name
        //         })
        //             .then(async (access) => {

        //                 if (access.length === 0) {
        //                     await document.save()
        //                         .then(this.render(resp, next))
        //                 } else {
        //                     throw new MethodNotAllowedError(`Perfil ${req.body.name.toUpperCase().trim()}já cadastrado, por favor cadastro um outro nome...`)
        //                 }
        //             }).catch(next)

        //     } catch (error) {
        //         console.log(`Erro ao criar Perfil de Acesso - ${error}`)
        //         throw new MethodNotAllowedError(`Erro ao criar Perfil de Acesso - ${error}`)
        //     }

        // }





    }

    filter = async (req, resp, next) => {

      


        try {
            const recebe = req.body.name || ""
            const regex = new RegExp(recebe, 'ig')
            let query = {
                mailSignup: req.authenticated.mailSignup, company: req.body.company, name: regex
            }
            let page = parseInt(req.query._page || 1);
            let Size = parseInt(req.query.size || 10);
            this.pageSize = Size;
            page += 1;
            const skip = (page - 1) * this.pageSize;
            AccessProfiles
                .count(AccessProfiles.find(query)).exec()
                .then(count => AccessProfiles.find(query).select('name dateCreated')
                    .populate('company', 'name')
                    .sort('name')
                    .skip(skip)
                    .limit(this.pageSize)
                    .then(this.renderAll(resp, next, {
                        page, count, pageSize: this.pageSize, url: req.url
                    })))
                .catch(next)
        } catch (error) {
            console.log(`Erro ao pesquisar de Perfis de acesso - ${error}`)
            throw new MethodNotAllowedError(`Erro ao pesquisar de Perfis de acesso - ${error}`)

        }

       

    }

    show = async (req, resp, next) => {

        try {
            const show = await this.prepareOne(this.model.findById(req.params.id)
                .populate("company", "name")
                .populate("docts", "name")
            ).then(show => {
                resp.send(show)
            })
                .catch(next)
        } catch (error) {
            console.log(`Erro ao exibir de Perfis de acesso - ${error}`)
            throw new MethodNotAllowedError(`Erro ao exibir de Perfis de acesso - ${error}`)

        }


    }

    del = async (req, resp, next) => {

        try {

            await UserPermissions.find({ accessprofiles: req.params.id })
                .then((access) => {

                    if (access.length === 0) {
                        this.model.remove({ _id: req.params.id }).exec().then((cmdResult: any) => {
                            if (cmdResult.result.n) {
                                resp.send(204)
                            } else {
                                throw new NotFoundError('Perfil não encontrado!')
                            }
                            return next()
                        }).catch(next)

                    } else {
                        throw new MethodNotAllowedError('Este Perfil não pode ser excluído pois possui Usuários Associados!')
                    }
                }).catch(next)

        } catch (error) {
            console.log(`Erro ao deletar Perfil de Acesso - ${error}`)
            throw new MethodNotAllowedError(`Erro ao deletar Perfil de Acesso - ${error}`)
        }


    };

    list = async (req, resp, next) => {

        

      

            const listAcces = await AccessProfiles.find({
                mailSignup: req.authenticated.mailSignup,
                company: req.query.company
            }).select('name')
                .sort('name')
                .then(listAcces => {
                    resp.send({
                        "_links": {
                            "self": "undefined",
                            "totalPage": 1
                        }, items: listAcces
                    })

                }).catch(next)

        



    }
    updateAcess = async (req, resp, next) => {

        try {
            const options = { runValidators: true, new: true }
            this.model.findByIdAndUpdate(req.params.id, req.body, options)
                .then(this.render(resp, next))

        } catch (error) {
            console.log(`Erro ao atualizar Perfil de Acesso - ${error}`)
            throw new MethodNotAllowedError(`Erro ao atualizar Perfil de Acesso - ${error}`)

        }

    }

    listDocuments = async (req, resp, next) => {
        const dataPermissions = await (await AccessProfiles.find({ _id: req.params.id })).pop()
        const { company, docts } = dataPermissions
        let listdocUser = []
        let docUser = []
        docUser.push(docts)
        let docs = docUser.pop()
        for (const doc of docs) {
            const d = doc
            listdocUser.push(d)

        }


        const listdocCompanies = await Doct.find({ "_id": { $nin: listdocUser }, company: company }).select('id').select('name')

        resp.send(listdocCompanies)



    }
    listDocumentsUsers = async (req, resp, next) => {
        const dataPermissions = (await AccessProfiles.find({ _id: req.params.id }).populate("docts", "name")).pop()
        const { docts } = dataPermissions
        resp.send(docts)

    }
    addDocuments = async (req, resp, next) => {


        const { docts } = req.body
        // console.log(docts)
        for (const doct of docts) {
            const d = doct.toString()
            await AccessProfiles.findOneAndUpdate({ "_id": req.params.id }, { $push: { docts: d } })
        }
        resp.send({ mss: "Documentos Adicionados com Suscesso" })

    }
    removeDocuments = async (req, resp, next) => {


        const { docts } = req.body
        // console.log(docts)
        for (const doct of docts) {
            const d = doct.toString()
            await AccessProfiles.findOneAndUpdate({ "_id": req.params.id }, { $pull: { docts: d } })
        }
        resp.send({ mss: "Documentos removidos com Suscesso" })

    }




    applyRoutes(applycation: restify.Server) {


        applycation.post(`${this.basePath}`, [authorize('DAENERYS', 'STARK'), this.save])
        applycation.get(`${this.basePath}/:id`, [authorize('DAENERYS', 'STARK'), this.show])
        applycation.post(`${this.basePath}/search`, [authorize('DAENERYS', 'STARK'), this.filter])
        applycation.del(`${this.basePath}/:id`, [authorize('DAENERYS', 'STARK'), this.del])
        applycation.get(`${this.basePath}`, [authorize('DAENERYS', 'STARK'), this.list])
        applycation.patch(`${this.basePath}/:id`, [authorize('DAENERYS', 'STARK'), this.updateAcess])
        applycation.get(`${this.basePath}/listdoumentos/:id`, [authorize('DAENERYS', 'STARK'), this.listDocuments])
        applycation.get(`${this.basePath}/listdoumentosprof/:id`, [authorize('DAENERYS', 'STARK'), this.listDocumentsUsers])
        applycation.post(`${this.basePath}/addocuemnts/:id`, [authorize('DAENERYS', 'STARK'), this.addDocuments])
        applycation.post(`${this.basePath}/rmdocuemnts/:id`, [authorize('DAENERYS', 'STARK'), this.removeDocuments])


    }
}
export const accessProfilesRouter = new AccessProfilesRouter()