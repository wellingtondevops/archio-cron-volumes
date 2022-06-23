import { ModelRouter } from '../common/model-router'
import * as restify from 'restify'
import { NotFoundError, MethodNotAllowedError } from 'restify-errors'
import { Doct, LabelField } from './docts.model';
import { authorize } from '../security/authz.handler'
import { Archive } from '../archives/archives.model'
import { authenticate } from '../security/auth.handler';
import * as mongoose from 'mongoose'
import { Company } from '../companies/companies.model';
import { User } from '../users/users.model';
import { Template } from '../templates/templates.model'
import { templatesRouter } from '../templates/templates.router';
import { cacheddocts } from './cacheddocts';
// const cache = require('../cache/cache')




class DoctsRouter extends ModelRouter<Doct>{
    constructor() {
        super(Doct)
    }

    protected prepareOne(query: mongoose.DocumentQuery<Doct, Doct>): mongoose.DocumentQuery<Doct, Doct> {
        return query
            .populate('company', 'name')


    }

    envelop(document) {
        let resource = super.envelope(document)
        resource._links.menu = `${this.basePath}/${resource._id}/label`
        return resource
    }

    findLabel = async (req, resp, next) => {
        await Doct.findById(req.params.id, "+ label")
            .then(rest => {
                if (!rest) {
                    throw new NotFoundError('Document not found')
                } else {
                    resp.json(rest.label)
                    return next()
                }
            }).catch(next)
    }

    replaceLabel = async (req, resp, next) => {
        await Doct.findById(req.params.id).then(rest => {
            if (!rest) {
                throw new NotFoundError('Document not found')
            } else {
                rest.label = req.body
                return rest.save()
            }
        }).then(rest => {
            resp.json(rest.label)
            return (next)
        }).catch(next)
    }


    save = async (req, resp, next) => {


        let document = new this.model({

            codTopic: req.body.codTopic,
            refTemplateId: req.body.id_child,
            refStructureId: req.body.id_Structure,
            company: req.body.company,
            name: req.body.name,
            dcurrentLabel: req.body.dcurrentLabel,
            dcurrentValue: req.body.dcurrentValue || 0,
            dintermediateLabel: req.body.dintermediateLabel,
            dintermediateValue: req.body.dintermediateValue || 0,
            currentControl: req.body.currentControl || false,
            dfinal: req.body.dfinal,
            label: req.body.label




        })


        Doct.find({
            mailSignup: req.authenticated.mailSignup, company: req.body.company,
            name: req.body.name
        })
            .then(async (com) => {
                if (com.length === 0) {
                    await document.save()
                        .then(this.render(resp, next))
                    if (req.authenticated.isSponser === true) {
                        await Doct.updateOne({ _id: document._id },
                            { author: req.authenticated._id, mailSignup: req.authenticated.mailSignup }).catch(next)
                    } else {
                        await Doct.updateOne({ _id: document._id },
                            { author: req.authenticated._id, mailSignup: req.authenticated.mailSignup }).catch(next)
                    }
                } else {
                    throw new MethodNotAllowedError('Documento já Cadastrado, por favor cadastro um outro...')
                }
            })
            .catch(next)
    }

    listStructure = async (req, resp, next) => {
        try {

            let gru = await Template.find({ "_id": mongoose.Types.ObjectId(req.body.id_Structure) }).
                select('classes.subclasses.groups._id classes.subclasses.groups.codTopic classes.subclasses.groups.topic classes.subclasses.groups.currentLabel classes.subclasses.groups.currentValue classes.subclasses.groups.intermediateLabel classes.subclasses.groups.intermediateValue classes.subclasses.groups.final  ')
            let gg = await gru.map(el => { return el.classes });
            let _gg = [].concat.apply([], gg)
            let ggg = await _gg.map(el => { return el.subclasses });
            let _ggg = [].concat.apply([], ggg)
            let gggg = await _ggg.map(el => { return el.groups })
            let group = [].concat.apply([], gggg)  //retorno dos groups para ser usado no groups
            let cl = await Template.find({ "_id": mongoose.Types.ObjectId(req.body.id_Structure) })
                .select('classes._id classes.codTopic classes.topic classes.currentLabel classes.currentValue classes.intermediateLabel classes.intermediateValue classes.final  ')
            let classe = await cl.map(el => { return el.classes });
            let _classe = [].concat.apply([], classe) // retorno das classes
            ///////////////////////////////////////////////////////////////
            let sbc = await Template.find({ "_id": mongoose.Types.ObjectId(req.body.id_Structure) }).
                select('classes.subclasses._id classes.subclasses.codTopic classes.subclasses.topic classes.subclasses.currentLabel classes.subclasses.currentValue classes.subclasses.intermediateLabel classes.subclasses.intermediateValue classes.subclasses.final  ')

            let subclasse = sbc[0].classes.map(item => {
                return item.subclasses
            });
            let _subclasse = [].concat.apply([], subclasse) // retorno das subclasses     
            //////////////////////////////////////////////////////////////////         
            let sgr = await Template.find({ "_id": mongoose.Types.ObjectId(req.body.id_Structure) })
            let c = await sgr.map(el => { return el.classes });
            let _c = [].concat.apply([], c)
            let d = await _c.map(el => { return el.subclasses });
            let _d = [].concat.apply([], d)
            let g = await _d.map(el => { return el.groups })
            let _g = [].concat.apply([], g)  //retorno dos groups para ser usado no subgroups, 
            let sg = await _g.map(el => { return el.subgroups })
            let subgroup = [].concat.apply([], sg) //retorno subgroups            
            let array1 = [].concat.apply(_classe, _subclasse)
            let array2 = [].concat.apply(array1, group)
            let array3 = [].concat.apply(array2, subgroup)
            array3 = array3.sort(function (a, b) {

                return (a.codTopic > b.codTopic) ? 1 : ((b.codTopic > a.codTopic) ? -1 : 0);

            });


            resp.send(array3)
            //let asck = array3.find(asck => asck.id === req.body.id_child); ///
        } catch (error) {
            console.error(`Erro interno!`, error)

        }




    }
    showObjectStruture = async (req, resp, next) => {
        try {

            let gru = await Template.find({ "_id": mongoose.Types.ObjectId(req.body.id_Structure) }).
                select('classes.subclasses.groups._id classes.subclasses.groups.codTopic classes.subclasses.groups.topic classes.subclasses.groups.currentLabel classes.subclasses.groups.currentValue classes.subclasses.groups.intermediateLabel classes.subclasses.groups.intermediateValue classes.subclasses.groups.final  ')
            let gg = await gru.map(el => { return el.classes });
            let _gg = [].concat.apply([], gg)
            let ggg = await _gg.map(el => { return el.subclasses });
            let _ggg = [].concat.apply([], ggg)
            let gggg = await _ggg.map(el => { return el.groups })
            let group = [].concat.apply([], gggg)  //retorno dos groups para ser usado no groups
            let cl = await Template.find({ "_id": mongoose.Types.ObjectId(req.body.id_Structure) })
                .select('classes._id classes.codTopic classes.topic classes.currentLabel classes.currentValue classes.intermediateLabel classes.intermediateValue classes.final  ')
            let classe = await cl.map(el => { return el.classes });
            let _classe = [].concat.apply([], classe) // retorno das classes
            ///////////////////////////////////////////////////////////////
            let sbc = await Template.find({ "_id": mongoose.Types.ObjectId(req.body.id_Structure) }).
                select('classes.subclasses._id classes.subclasses.codTopic classes.subclasses.topic classes.subclasses.currentLabel classes.subclasses.currentValue classes.subclasses.intermediateLabel classes.subclasses.intermediateValue classes.subclasses.final  ')

            let subclasse = sbc[0].classes.map(item => {
                return item.subclasses
            });
            let _subclasse = [].concat.apply([], subclasse) // retorno das subclasses     
            //////////////////////////////////////////////////////////////////         
            let sgr = await Template.find({ "_id": mongoose.Types.ObjectId(req.body.id_Structure) })
            let c = await sgr.map(el => { return el.classes });
            let _c = [].concat.apply([], c)
            let d = await _c.map(el => { return el.subclasses });
            let _d = [].concat.apply([], d)
            let g = await _d.map(el => { return el.groups })
            let _g = [].concat.apply([], g)  //retorno dos groups para ser usado no subgroups, 
            let sg = await _g.map(el => { return el.subgroups })
            let subgroup = [].concat.apply([], sg) //retorno subgroups            
            let array1 = [].concat.apply(_classe, _subclasse)
            let array2 = [].concat.apply(array1, group)
            let array3 = [].concat.apply(array2, subgroup)


            let asck = array3.find(asck => asck.id === req.body.id_child); ///
            resp.send(asck)
        } catch (error) {
            console.error(`Erro interno!`, error)

        }




    }
    saveStructure = async (req, resp, next) => {




        try {

            let gru = await Template.find({ "_id": mongoose.Types.ObjectId(req.body.id_Structure) }).
                select('classes.subclasses.groups._id classes.subclasses.groups.codTopic classes.subclasses.groups.topic classes.subclasses.groups.currentLabel classes.subclasses.groups.currentValue classes.subclasses.groups.intermediateLabel classes.subclasses.groups.intermediateValue classes.subclasses.groups.final  ')
            let gg = await gru.map(el => { return el.classes });
            let _gg = [].concat.apply([], gg)
            let ggg = await _gg.map(el => { return el.subclasses });
            let _ggg = [].concat.apply([], ggg)
            let gggg = await _ggg.map(el => { return el.groups })
            let group = [].concat.apply([], gggg)  //retorno dos groups para ser usado no groups
            let cl = await Template.find({ "_id": mongoose.Types.ObjectId(req.body.id_Structure) })
                .select('classes._id classes.codTopic classes.topic classes.currentLabel classes.currentValue classes.intermediateLabel classes.intermediateValue classes.final  ')
            let classe = await cl.map(el => { return el.classes });
            let _classe = [].concat.apply([], classe) // retorno das classes
            ///////////////////////////////////////////////////////////////
            let sbc = await Template.find({ "_id": mongoose.Types.ObjectId(req.body.id_Structure) }).
                select('classes.subclasses._id classes.subclasses.codTopic classes.subclasses.topic classes.subclasses.currentLabel classes.subclasses.currentValue classes.subclasses.intermediateLabel classes.subclasses.intermediateValue classes.subclasses.final  ')

            let subclasse = sbc[0].classes.map(item => {
                return item.subclasses
            });
            let _subclasse = [].concat.apply([], subclasse) // retorno das subclasses     
            //////////////////////////////////////////////////////////////////         
            let sgr = await Template.find({ "_id": mongoose.Types.ObjectId(req.body.id_Structure) })
            let c = await sgr.map(el => { return el.classes });
            let _c = [].concat.apply([], c)
            let d = await _c.map(el => { return el.subclasses });
            let _d = [].concat.apply([], d)
            let g = await _d.map(el => { return el.groups })
            let _g = [].concat.apply([], g)  //retorno dos groups para ser usado no subgroups, 
            let sg = await _g.map(el => { return el.subgroups })
            let subgroup = [].concat.apply([], sg) //retorno subgroups            
            let array1 = [].concat.apply(_classe, _subclasse)
            let array2 = [].concat.apply(array1, group)
            let array3 = [].concat.apply(array2, subgroup)


            let asck = array3.find(asck => asck.id === req.body.id_child); /// resultante do filtro de pesquisa..........

            /////agora só é implentar a criação de documento usando os abributos enviados da template.......

            let document = new this.model({
                codTopic: asck.codTopic,
                refTemplateId: req.body.id_child,
                refStructureId: req.body.id_Structure,
                company: req.body.company,
                name: asck.codTopic + '-' + asck.topic,
                dcurrentLabel: asck.currentLabel,
                dcurrentValue: asck.currentValue || 0,
                dintermediateLabel: asck.intermediateLabel,
                dintermediateValue: asck.intermediateValue || 0,
                dfinal: asck.final,
                label: req.body.label


            })

            Doct.find({
                mailSignup: req.authenticated.mailSignup,
                name: req.body.name,
                company: req.body.company
            })
                .then(async (com) => {
                    if (com.length === 0) {
                        await document.save()
                            .then(this.render(resp, next))
                        if (req.authenticated.isSponser === true) {
                            await Doct.updateOne({ _id: document._id },
                                { author: req.authenticated._id, mailSignup: req.authenticated.mailSignup }).catch(next)
                        } else {
                            await Doct.updateOne({ _id: document._id },
                                { author: req.authenticated._id, mailSignup: req.authenticated.mailSignup }).catch(next)
                        }
                    } else {
                        throw new MethodNotAllowedError('Documento já Cadastrado, por favor cadastro um outro...')
                    }
                })
                .catch(next)

            //resp.send(asck)

        } catch (error) {
            console.error(`Erro interno!`, error)

        }


    }
    find = (req, resp, next) => {
        let page = parseInt(req.query._page || 1);
        page += 1;
        const skip = (page - 1) * this.pageSize;



        let profile = req.authenticated.profiles.toString()

        if (profile === 'DAENERYS') {
            Doct
                .count(Doct.find({
                    mailSignup: req.authenticated.mailSignup
                })).exec()
                .then(count => Doct.find({
                    mailSignup: req.authenticated.mailSignup
                })
                    .populate('company', 'name')
                    .populate('author', ' name email')
                    .sort('name')
                    .skip(skip)
                    .limit(this.pageSize)
                    .then(this.renderAll(resp, next, {
                        page, count, pageSize: this.pageSize, url: req.url
                    })))
                .catch(next)
        } else {
            Doct
                .count(Doct.find({
                    mailSignup: req.authenticated.mailSignup, _id: req.authenticated.docts
                })).exec()
                .then(count => Doct.find({
                    mailSignup: req.authenticated.mailSignup, _id: req.authenticated.docts
                })
                    .populate('company', 'name')
                    .populate('author', ' name email')
                    .sort('name')
                    .skip(skip)
                    .limit(this.pageSize)
                    .then(
                        this.renderAll(resp, next, {
                            page,
                            count,
                            pageSize: this.pageSize,
                            url: req.url
                        })
                    )
                )
                .catch(next);

        }
    }
    filter = async (req, resp, next) => {

        const recebe = req.body.name || ""
        const regex = new RegExp(recebe, 'ig')

        const _filter = req.body
        const filter = delete _filter.name

        let profile = req.authenticated.profiles.toString()

        const keybords = JSON.stringify(req.body).replace("{", "").replace("}", "") // tudo q o user digitou nos filtros.


        // let params = `searchdocuments:userid-${req.authenticated._id}-terms-${keybords}-doctname-${recebe}-page-${req.query._page}`

        // const cached = await cache.get(params)
        // if (cached) {
        //     resp.send(cached)

        // } else {
        let page = parseInt(req.query._page || 1);
        let Size = parseInt(req.query.size || 10);
        this.pageSize = Size;
        page += 1;
        const skip = (page - 1) * this.pageSize;

        if (profile === 'DAENERYS') {


            let query = {
                mailSignup: req.authenticated.mailSignup, company: req.body.company,
                name: new RegExp(recebe, "ig")
            }


            Doct
                .count(Doct.find(query)).exec()
                .then(count => Doct.find(query).select('name retention dcurrentValue dfinal dintermediateValue dateCreated')
                    .populate('company', 'name')
                    .sort('name')
                    .skip(skip)
                    .limit(this.pageSize)
                    .then(
                        this.renderAll(resp, next, {
                            page,
                            count,
                            pageSize: this.pageSize,
                            url: req.url
                        })
                    )
                )
                .catch(next);
            // cacheddocts(query, params, req.url, req.query._page, req.query.size)


        } else {


            let user = await User.find({ _id: req.authenticated._id }).select("permissions.docts")
            let data = user[0].permissions.map(item => {
                return item.docts;
            });
            let doct = [].concat.apply([], data)


            let query = {
                mailSignup: req.authenticated.mailSignup, _id: doct, company: req.body.company,
                name: new RegExp(recebe, "ig")
            }
            Doct
                .count(Doct.find(query)).exec()
                .then(count => Doct.find(query)
                    .select('name retention dcurrentValue dfinal dintermediateValue dateCreated')
                    .populate('company', 'name')
                    .sort('name')
                    .skip(skip)
                    .limit(this.pageSize)
                    .then(
                        this.renderAll(resp, next, {
                            page,
                            count,
                            pageSize: this.pageSize,
                            url: req.url
                        })
                    )
                )
                .catch(next);
            // cacheddocts(query, params, req.url, req.query._page, req.query.size)


        }
    }


    del = async (req, resp, next) => {

        let params = `doctshow:${req.params.id}`
        let prefixSearch = `searchdocuments`
        let listDocts = `listdocts`


        await Archive.find({ doct: req.params.id })
            .then((arc) => {
                if (arc.length === 0) {
                    this.model.remove({ _id: req.params.id }).exec().then((cmdResult: any) => {
                        if (cmdResult.result.n) {
                            resp.send(204)
                        } else {
                            throw new NotFoundError('Documento não encontrado!')
                        }
                        return next()
                    }).catch(next)
                } else {
                    throw new MethodNotAllowedError('Este Documento não pode ser excluído pois possui registros Associdado')
                }
            }).catch(next)
        // cache.del(params)
        // cache.delPrefix(prefixSearch)
        // cache.delPrefix(listDocts)

    }
    show = async (req, resp, next) => {


        // let params = `doctshow:${req.params.id}`
        // const cached = await cache.get(params)

        // if (cached) {

        //     resp.send(
        //         cached
        //     )

        // } else {

        const show = await this.prepareOne(this.model.findById(req.params.id))
        // cache.set(params, show, 60 * 4)
        resp.send(
            show
        )



    }






    up = (req, resp, next) => {


        // let params = `doctshow:${req.params.id}`
        // let prefixSearch = `searchdocuments`
        // let listDocts = `listdocts`

        // cache.del(params)
        // cache.delPrefix(prefixSearch)
        // cache.delPrefix(listDocts)


        const options = { runValidators: true, new: true }
        this.model.findByIdAndUpdate(req.params.id, req.body, options)
            .then(this.render(resp, next))
            .catch(next)
    }




    applyRoutes(applycation: restify.Server) {


        applycation.post(`${this.basePath}/search`, [authorize('SNOW', 'TYWIN', 'DAENERYS'), this.filter])
        applycation.get(`${this.basePath}`, [authorize('SNOW', 'TYWIN', 'DAENERYS', 'STARK', 'TULLY'), this.find])
        applycation.get(`${this.basePath}/:id`, [authorize('SNOW', 'TYWIN', 'DAENERYS', 'STARK', 'TULLY'), this.validateId, this.show])
        applycation.post(`${this.basePath}`, [authorize('TYWIN', 'DAENERYS'), this.save])
        applycation.post(`${this.basePath}/listStructure`, [authorize('TYWIN', 'DAENERYS'), this.listStructure])
        applycation.post(`${this.basePath}/showObjectStruture`, [authorize('TYWIN', 'DAENERYS'), this.showObjectStruture])

        applycation.post(`${this.basePath}/structure`, [authorize('TYWIN', 'DAENERYS'), this.saveStructure])
        applycation.put(`${this.basePath}/:id`, [authorize('TYWIN', 'DAENERYS'), this.validateId, this.replace])
        applycation.patch(`${this.basePath}/:id`, [authorize('TYWIN', 'DAENERYS'), this.validateId, this.up])
        applycation.del(`${this.basePath}/:id`, [authorize('TYWIN', 'DAENERYS'), this.validateId, this.delete])
        applycation.get(`${this.basePath}/:id/label`, [authorize('SNOW', 'TYWIN', 'DAENERYS', 'STARK', 'TULLY'), this.validateId, this.findLabel])
        applycation.put(`${this.basePath}/:id/label`, [authorize('TYWIN', 'DAENERYS'), this.validateId, this.replaceLabel])
    }
}
export const doctsRouter = new DoctsRouter()
