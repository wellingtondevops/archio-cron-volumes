import { SheetName } from '../sheetnames/sheetnames.model';
import { ModelRouter } from '../common/model-router'
import * as restify from 'restify'
import { NotFoundError, MethodNotAllowedError } from 'restify-errors'
import * as mongoose from 'mongoose'
import { authorize } from '../security/authz.handler'
import { CompanyService } from '../companyservices/companyservices.model';
import { Batch } from './batches.model'
import { Volume } from '../volumes/volumes.model'
import { authenticate } from '../security/auth.handler';
import { Pictures } from '../pictures/pictures.model'
import { Archive } from '../archives/archives.model'
import { User } from '../users/users.model'
import { Doct } from '../docts/docts.model'
import { Worksheet } from '../worksheets/worksheets.model'
import axios from 'axios'
var XLSX = require('xlsx')
import { environment } from '../common/environment'
import { saveSheet } from '../utils/importworksheet';
// import { sendRabbitmqIndex } from '../queues/sendRabbitmqIndex';
import { setCronDepartaments } from '../libary/flagDepartaments';
import { setCronDocuments } from '../libary/flagDocumentos'
import { controlVolume } from '../volumes/controlvolumes';
import { setCronVolumes } from '../libary/flagVolumes';
// const cache = require('../cache/cache')

const moment = require('moment-timezone');

class BatchesRouter extends ModelRouter<Batch>{

    constructor() {
        super(Batch)
    }

    protected prepareOne(query: mongoose.DocumentQuery<Batch, Batch>): mongoose.DocumentQuery<Batch, Batch> {
        return query
            .populate('company', 'name')
            .populate('doct')
            .populate('author', 'name')
            .populate('volume', 'location closeBox')
            .populate('storehouse', 'name')
            .populate('departament', 'name')

    }

    envelop(document) {
        let resource = super.envelope(document)
        resource._links.menu = `${this.basePath}/${resource._id}`
        return resource

    }

    saveBatch = async (req, resp, next) => {

        try {
            let _batchNr = await Batch.findOne({ mailSignup: req.authenticated.mailSignup, }).sort({ dateCreated: -1 })
            if (_batchNr === null) {

                let document = new this.model({
                    batchNr: 1,
                    company: req.body.company,
                    doct: req.body.doct,
                    author: req.authenticated._id,
                    mailSignup: req.authenticated.mailSignup,
                    dateCreated: moment().tz('America/Sao_Paulo'),
                    comments: req.body.comments,
                    btnEdit: true,
                    sourceVolume: true,


                })
                document.save()
                    .then(this.render(resp, next))
                    .catch(next)

            } else {
                let addNr = Number(_batchNr.batchNr) + 1
                let document = new this.model({
                    batchNr: addNr || 1,
                    company: req.body.company,
                    doct: req.body.doct,
                    author: req.authenticated._id,
                    mailSignup: req.authenticated.mailSignup,
                    dateCreated: moment().tz('America/Sao_Paulo'),
                    comments: req.body.comments,
                    btnEdit: true,
                    sourceVolume: true,
                })
                document.save()
                    .then(this.render(resp, next))
                    .catch(next)

            }
        } catch (e) {
            console.log(e)
        }
    }


    filter = (req, resp, next) => {


        let page = parseInt(req.query._page || 1);
        let Size = parseInt(req.query.size || 10);
        this.pageSize = Size;
        page += 1;
        const skip = (page - 1) * this.pageSize;
        let nR = undefined
        let D = undefined


        if (req.body.batchNr === "") {
            nR = undefined
        } else {
            nR = req.body.batchNr
        }
        if (req.body.doct === false) {
            D = undefined
        } else {
            D = req.body.doct
        }

        const filters = []

        let d = {}
        let n = {}

        let _initDate = req.body.initDate || "1900-01-01";
        let _endDate = req.body.endDate || "2900-01-01";

        let initDate = new Date(_initDate)
        const t = 1
        let __endDate = new Date(_endDate)
        let endDate = __endDate.setDate(__endDate.getDate() + 1)

        let dateBatches = {
            dateCreated: {
                $gte: initDate,
                $lte: endDate
            }
        }

        filters.push(dateBatches)
        if (nR !== undefined) {
            n = { batchNr: nR }
            filters.push(n)
        } if (D !== undefined) {
            d = { doct: D }
            filters.push(d)
        }

        Batch

            .count(Batch.find({
                mailSignup: req.authenticated.mailSignup, company: req.body.company, finished: { $ne: true }, $and: filters
            })).exec()
            .then(count => Batch.find({
                mailSignup: req.authenticated.mailSignup, company: req.body.company, finished: { $ne: true }, $and: filters
            })
                .populate("company", "name")
                .populate("doct", "name")
                .sort('batchNr')
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

    filterVolumes = async (req, resp, next) => {




        const data = await Batch.findById(req.params.id)
        const { company, doct } = data



        const _location = req.body.location;
        // const initDate = req.body.initDate || "1900-01-01";
        // const endDate = req.body.endDate || "2900-01-01";
        let _initDate = req.body.initDate || "1900-01-01";
        let _endDate = req.body.endDate || "2900-01-01";

        let initDate = new Date(_initDate)
        const t = 1
        let __endDate = new Date(_endDate)
        let endDate = __endDate.setDate(__endDate.getDate() + 1)
        const filters = req.body;
        const filter =
            delete filters.location &&
            delete filters.initDate &&
            delete filters.endDate;
        const recebe = _location;

        const regex = new RegExp(recebe, "ig");



        let page = parseInt(req.query._page || 1);
        let Size = parseInt(req.query.size || 10);
        this.pageSize = Size;
        page += 1;
        const skip = (page - 1) * this.pageSize;


        Volume.count(
            Volume.find({
                mailSignup: req.authenticated.mailSignup,
                location: regex,
                company: company,

                status: { $ne: "BAIXADO" },
                $or: [
                    { doct: undefined },
                    { doct: doct },
                    { storehouse: req.body.storehouse },
                    { storehouse: undefined }
                ],
                $and: [
                    filters,
                    {
                        dateCreated: {
                            $gte: initDate,
                            $lte: endDate
                        }
                    }
                ]
            })
        )
            .exec()
            .then(
                async count =>
                    await Volume.find({
                        mailSignup: req.authenticated.mailSignup,
                        location: regex,
                        company: company,
                        status: { $ne: "BAIXADO" },
                        $or: [
                            { doct: undefined },
                            { doct: doct }

                        ],
                        $and: [
                            filters,
                            {
                                dateCreated: {
                                    $gte: initDate,
                                    $lte: endDate
                                }
                            }
                        ]
                    })
                        .populate("storehouse", "name")
                        .populate("company", "name")
                        .populate("departament", "name")
                        .populate("doct", "name")
                        .sort('location')
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


    listImagens = async (req, resp, next) => {


        let page = parseInt(req.query._page);
        let Size = parseInt(req.query.size || 24);
        let pageSize = Size;
        // page += 1;
        const skip = (page - 1) * this.pageSize;
        const count = await Pictures.find({
            batch: req.params.id,
            ind: false
        }).count()

        const search = await Pictures.find({
            batch: req.params.id,
            ind: false
        })
            .sort({ originalname: 1 })
            .skip(skip)
            .limit(pageSize)


        const obj = {
            "_links": {
                "self": `${this.basePath}/${req.params.id}/imagens`,
                "currentPage": page,
                "foundItems": count,
                "totalPage": (count / pageSize) | 0 || 1,
            }, items: search
        }

        resp.send(obj)


        if (Size === 1 && count === 0) {

            try {
                controlVolume(req.params.id)
            } catch (error) {
                console.log("Erro ao enviar parametros para fechar")
            }

        }


    }

    delete = async (req, resp, next) => {


        let picturesbuckts = await Pictures.find({ batch: req.params.id, ind: false })
        let listPictures = []
        for (let i = 0; picturesbuckts.length > i; i++) {
            listPictures.push(picturesbuckts[i]._id)
        }
        let obj = { pictures: listPictures }

        axios.post(environment.api.api_upload, obj)
            .then(response => console.log("apagou"))
            .catch(error => {
                console.error('There was an error!', error);
            });

        await this.model.updateOne({ _id: req.params.id }, { $set: { finished: true } })

        resp.send("Lote")


    }

    addVolume = async (req, resp, next) => {

        const dataVolume = await Volume.findById(req.body.volume)
        const dataBatch = await Batch.findById(req.params.id)

        let message = ""

        await Volume.update({ _id: dataVolume._id }, { $set: { doct: dataBatch.doct } })
        await Batch.update({ _id: req.params.id }, { $set: { volume: dataVolume._id, departament: dataVolume.departament, storehouse: dataVolume.storehouse } })
        message = "Documento adcionado e Adcionado Caixa ao Lote!"

        resp.send({
            code: "Success",
            message: message
        })

    }

    indexArchives = async (req, resp, next) => {



        const data = await (await Batch.findById(req.params.id).populate('volume', 'closeBox'))

        
        const { company, doct, volume, storehouse, departament } = data

        let aux = [data]
        let data2 = await aux.map(item => {
            return item.volume;
        });
        let data3 = JSON.stringify(data2.map(item => { return item }))
        let data4 = JSON.parse(data3)
        const checked = data4.map(el => { return el.closeBox }).pop()

        if (checked === true) {
            resp.send(new MethodNotAllowedError(
                "A POSIÇÃO ESCOLHIDA ESTÁ FECHADA PARA INDEXAÇÕES FOR FAVOR FALE COM O ADMINSTRADOR DO ARQUIVO OU ESCOLHA OUTRA POSIÇÃO"
            ))
        } else {

            const queue = "archiveindex"

            const starCurrent = await Doct.findOne({ _id: doct })
            const _idSponsor = await User.find({ email: req.authenticated.mailSignup })
            let idSponsor = await _idSponsor.map(el => { return el._id })
            const idOfSponsor = idSponsor.toString()
            const currentTime = Number(starCurrent.dcurrentValue)
            const intermediateTime = Number(starCurrent.dintermediateValue)
            let arr = starCurrent.label
            const dfinal = starCurrent.dfinal
            const docItem = arr.findIndex((label, index, array) => label.timeControl === true)// retorno da posição na qual o timeControl está ativo.
            
            if (volume === undefined) {
                resp.send(new MethodNotAllowedError(
                    "Por favor escolha uma caixa para indexar seus documentos, ou fale com o Administrador do Arquivo!"
                ))
            } else {


                if (docItem === -1) {
                    const startDateCurrent = 0



                    let document = new Archive({
                        company: company,
                        departament: departament,
                        storehouse: storehouse,
                        volume: volume,
                        doct: doct,
                        tag: req.body.tag,
                        author: req.authenticated._id,
                        mailSignup: req.authenticated.mailSignup,
                        sponsor: idOfSponsor,
                        picture: req.body.picture,
                        create: moment().tz('America/Sao_Paulo')

                    });
                    // cache.delPrefix(prefixSearch).catch()


                    await document.save()
                    // sendRabbitmqIndex(queue, req.authenticated._id, req.authenticated.mailSignup, doct, company, document.id, req.body.picture)
                    setCronDepartaments(departament)
                    setCronDocuments(doct)
                    setCronVolumes([volume])
                        .catch(next)
                    await Pictures.update({ _id: req.body.picture },
                        {
                            $set: {
                                ind: true,
                                volume: volume,
                                departament: departament,
                                archive: document.id,
                                createdAt: moment().tz('America/Sao_Paulo')

                            }
                        }
                    )
                    await Pictures.update({ _id: req.body.picture },
                       
                        { $unset: { batch: 1 } }
                    )
                    resp.send({
                        code: "Success",
                        message: "Indexado com Suscesso!"
                    })

                } else {
                    //RECEBE OS INDICES
                    let init = req.body.tag
                    //PROCURA A DATA DENTRO DO TEXTO PELA POSIÇÃO DO LABEL DO INDICE
                    let _date = init[docItem]


                    let d2 = [{
                        data2: (init[docItem])
                    }]

                    //NOVA IMPLEMENTAÇÃO
                    let dataSplit2 = d2.map(el => { return el.data2 }).toString()


                    let patternDATAFULL = /^[0-9]{2}\/[0-9]{2}\/[0-9]{4}$/
                    let patternCompt = /[0-9]{2}\/[0-9]{4}$/
                    let patternYYYY = /[0-9]{4}$/

                    if (patternDATAFULL.test(dataSplit2)) {
                        // console.log("a DAta "+dataSplit2+" está correta.")
                        let d = dataSplit2.split("/")

                        let year = Number(d[2])
                        let mounth = Number(d[1])
                        let day = Number(d[0])
                        let startDateCurrent = new Date(year, mounth - 1, day + 1)
                        let finalDateCurrent = new Date(year + currentTime, mounth - 1, day + 1)

                        let finalDateIntermediate = new Date(year + (currentTime + intermediateTime), mounth - 1, day + 1)
                        // console.log(" MMYYY Start current"+startDateCurrent+"finalDaeCurrent"+finalDateCurrent+"finalDate Intermediate"+ finalDateIntermediate)
                        let document = new Archive({
                            company: company,
                            departament: departament,
                            storehouse: storehouse,
                            volume: volume,
                            doct: doct,
                            tag: req.body.tag,
                            author: req.authenticated._id,
                            mailSignup: req.authenticated.mailSignup,
                            sponsor: idOfSponsor,
                            picture: req.body.picture,              //  create: dtaa,
                            startDateCurrent: startDateCurrent,
                            finalDateCurrent: finalDateCurrent,
                            finalDateIntermediate: finalDateIntermediate,
                            finalFase: dfinal,
                            create: moment().tz('America/Sao_Paulo')

                        });
                        // cache.delPrefix(prefixSearch).catch()
                        await document.save()
                        setCronDepartaments(departament)
                        setCronDocuments(doct)
                        setCronVolumes([volume])
                        // sendRabbitmqIndex(queue, req.authenticated._id, req.authenticated.mailSignup, doct, company, document.id, req.body.picture)
                            .catch(next)

                            await Pictures.update({ _id: req.body.picture },
                                {
                                    $set: {
                                        ind: true,
                                        volume: volume,
                                        departament: departament,
                                        archive: document.id,
                                        createdAt: moment().tz('America/Sao_Paulo')
        
                                    }
                                }
                            )
                            await Pictures.update({ _id: req.body.picture },
                               
                                { $unset: { batch: 1 } }
                            )
                        resp.send({
                            code: "Success",
                            message: "Indexado com Suscesso!"
                        })

                    } else if (patternCompt.test(dataSplit2)) {
                        let ds = dataSplit2.split("/")
                        let year = Number(ds[1])
                        let mounth = Number(ds[0])
                        let startDateCurrent = new Date(year, mounth, 1)
                        let finalDateCurrent = new Date(year + currentTime, mounth, 1)
                        let finalDateIntermediate = new Date(year + (currentTime + intermediateTime), mounth, 1)
                        // console.log(" MMYYY Start current"+startDateCurrent+"finalDaeCurrent"+finalDateCurrent+"finalDate Intermediate"+ finalDateIntermediate)
                        let document = new Archive({
                            company: company,
                            departament: departament,
                            storehouse: storehouse,
                            volume: volume,
                            doct: doct,
                            tag: req.body.tag,
                            author: req.authenticated._id,
                            mailSignup: req.authenticated.mailSignup,
                            sponsor: idOfSponsor,
                            picture: req.body.picture,
                            //  create: dtaa,
                            startDateCurrent: startDateCurrent,
                            finalDateCurrent: finalDateCurrent,
                            finalDateIntermediate: finalDateIntermediate,
                            finalFase: dfinal,
                            create: moment().tz('America/Sao_Paulo')

                        });

                        // cache.delPrefix(prefixSearch).catch()
                        await document.save()
                        setCronDepartaments(departament)
                        setCronDocuments(doct)
                        setCronVolumes([volume])
                        // sendRabbitmqIndex(queue, req.authenticated._id, req.authenticated.mailSignup, doct, company, document.id, req.body.picture)
                            .catch(next)

                            await Pictures.update({ _id: req.body.picture },
                                {
                                    $set: {
                                        ind: true,
                                        volume: volume,
                                        departament: departament,
                                        archive: document.id,
                                        createdAt: moment().tz('America/Sao_Paulo')
        
                                    }
                                }
                            )
                            await Pictures.update({ _id: req.body.picture },
                               
                                { $unset: { batch: 1 } }
                            )
                        resp.send({
                            code: "Success",
                            message: "Indexado com Suscesso!"
                        })

                    } else if (patternYYYY.test(dataSplit2)) {

                        let year = Number(dataSplit2)
                        let mounth = Number(12)
                        let day = Number(31)
                        let startDateCurrent = new Date(year, mounth, day)

                        let finalDateCurrent = new Date(year + currentTime, mounth, day)

                        let finalDateIntermediate = new Date(year + (currentTime + intermediateTime), mounth, day)

                        // console.log(" MMYYY Start current"+startDateCurrent+"finalDaeCurrent"+finalDateCurrent+"finalDate Intermediate"+ finalDateIntermediate)
                        let document = new Archive({
                            company: company,
                            departament: departament,
                            storehouse: storehouse,
                            volume: volume,
                            doct: doct,
                            tag: req.body.tag,
                            author: req.authenticated._id,
                            mailSignup: req.authenticated.mailSignup,
                            sponsor: idOfSponsor,
                            picture: req.body.picture,
                            //  create: dtaa,
                            startDateCurrent: startDateCurrent,
                            finalDateCurrent: finalDateCurrent,
                            finalDateIntermediate: finalDateIntermediate,
                            finalFase: dfinal,
                            create: moment().tz('America/Sao_Paulo')
                        });

                        // cache.delPrefix(prefixSearch).catch()
                        await document.save()
                        setCronDepartaments(departament)
                        setCronDocuments(doct)
                        setCronVolumes([volume])
                        // sendRabbitmqIndex(queue, req.authenticated._id, req.authenticated.mailSignup, doct, company, document.id, req.body.picture)
                            .catch(next)

                            await Pictures.update({ _id: req.body.picture },
                                {
                                    $set: {
                                        ind: true,
                                        volume: volume,
                                        departament: departament,
                                        archive: document.id,
                                        createdAt: moment().tz('America/Sao_Paulo')
        
                                    }
                                }
                            )
                            await Pictures.update({ _id: req.body.picture },
                               
                                { $unset: { batch: 1 } }
                            )
                        resp.send({
                            code: "Success",
                            message: "Indexado com Suscesso!"
                        })

                    } else if (patternDATAFULL.test(dataSplit2) || patternCompt.test(dataSplit2) || patternYYYY.test(dataSplit2) === false) {

                        resp.send(new MethodNotAllowedError(
                            "Formato de data digitado inválido, Valores aceitos DD/MM/AAAA, MM/AAAA, AAAA!"
                        ))

                    }


                }

            }
        }


    };

    worksheet = async (req, resp, next) => {


        if (req.files.file.type !== "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
            return next(new MethodNotAllowedError(`SOMENTE SÃO PERMITIDOS ARQUIVOS XLSX!`))
        }

        const data = await Batch.findById(req.params.id)
        const { company, doct, volume } = data


        let workbookk = XLSX.readFile(req.files.file.path);

        let sheet_name_list = workbookk.SheetNames;

        let xlData = XLSX.utils.sheet_to_json(workbookk.Sheets[sheet_name_list[0]]);

        const idus = req.authenticated.id
        const sponsor = req.authenticated.mailSignup
        const plan = req.files.file.name
        const sheetN = plan.toString()

        let verifySheet = await SheetName.find({ mailSignup: sponsor, sheetname: sheetN })


        if (verifySheet.length !== 0) {
            return next(new MethodNotAllowedError(`OPS...ESSE PLANILHA ${sheetN}, já foi utilizada, por favor coloque outro nome!`))
        }

        let document = new SheetName({
            sheetname: sheetN,
            mailSignup: sponsor,
            company: company,
            doct: doct,
            author: idus,
            createAt: moment().tz('America/Sao_Paulo')
        })

        await document.save()

        const idSheet = document.id

        let _titles = xlData[0]
        let titles = Object.keys(_titles)
        let oneTitle = ""
        let headers = []
        let coletors: any
        for (let i = 0; titles.length > i; i++) {
            oneTitle = titles[i]
            headers.push(oneTitle)
        }

        try {


            saveSheet(xlData, idSheet, company, doct, headers, sponsor, idus)

            resp.send("Planilha importada com Suscesso!")
        } catch (error) {
            throw new NotFoundError(`Um Erro Ocorreu - ${error}} `)

        }




    }


    search = async (req, resp, next) => {
        var term = req.query.term
        let d = await Batch.find({ _id: req.params.id })

        let docu = await d.map(el => { return el.doct }).toString()

        var replaceList = {
            1: "one ",
            2: "two ",
            3: "three ",
            4: "four ",
            5: "five ",
            6: "six ",
            7: "seven ",
            8: "eight ",
            9: "nine ",
            0: "zero "
        };
        let listChange = term.replace(/0|1|2|3|4|5|6|7|8|9/gi, function (item) {
            let it = replaceList[item];
            let itemLista = it.replace(/(?:^|\s)\S/g, function (elemento) { return elemento });
            return itemLista;
        });

        const recebe = term || ""
        const regex = new RegExp(listChange, 'ig')


        try {
            let result = await Worksheet.aggregate([

                {
                    "$search": {
                        "autocomplete": {
                            "query": `${listChange}`,
                            "path": "fieldSearch",

                            "fuzzy": {
                                "maxEdits": 1
                            }
                        }
                    },

                },
                {
                    $project: {
                        fieldSearch: 1,
                        fieldColumns: 1,
                        doct: 1,
                        score: { $meta: "searchScore" }
                    }
                },

                { $limit: 15 }
            ])


            let data = [];

            for (var i = 0; i < result.length; i++) {

                let a = []
                a.push(result[i])
                let dc = await a.map(el => { return el.doct }).toString()
                if (dc === docu) {
                    data.push(result[i]);

                } else {
                    console.log("deu ruim")
                }
            }
            resp.send(data)

        } catch (e) {
            resp.send({ message: e.message })
        }
    }
    searchSheets = async (req, resp, next) => {
        var term = req.query.term
        let d = await Batch.find({ _id: req.params.id })
        const recebe = req.body.sheetname || ""
        const regex = new RegExp(recebe, 'ig')


        let docu = await d.map(el => { return el.doct }).toString()

        console.log("documento", docu)


        let page = parseInt(req.query._page);
        let Size = parseInt(req.query.size || 10);
        this.pageSize = Size;
        page += 1;
        const skip = (page - 1) * this.pageSize;


        SheetName
            .count(SheetName.find({
                sheetname: regex,
                doct: docu,


            })).exec()
            .then(async count => await SheetName.find({
                sheetname: regex,
                doct: docu,


            }).sort({ originalname: 1 })
                .skip(skip)
                .limit(this.pageSize)
                .then(this.renderAll(resp, next, {
                    page, count, pageSize: this.pageSize, url: req.url
                })))
            .catch(next)




    }



    applyRoutes(applycation: restify.Server) {

        applycation.get(`${this.basePath}`, [authorize('DAENERYS'), this.find])
        applycation.post(`${this.basePath}`, [authorize('DAENERYS'), this.saveBatch])
        applycation.post(`${this.basePath}/search`, [authorize('SNOW', 'TYWIN', 'DAENERYS'), this.filter])
        applycation.post(`${this.basePath}/:id/searchvolumes`, [authorize('SNOW', 'TYWIN', 'DAENERYS'), this.filterVolumes])
        applycation.get(`${this.basePath}/:id/search`, [this.search])
        applycation.patch(`${this.basePath}/:id/addvolume`, [authorize('SNOW', 'TYWIN', 'DAENERYS'), this.addVolume])
        applycation.post(`${this.basePath}/:id/worksheet`, [authorize('SNOW', 'TYWIN', 'DAENERYS'), this.worksheet])
        applycation.post(`${this.basePath}/:id/searchsheets`, [authorize('SNOW', 'TYWIN', 'DAENERYS'), this.searchSheets])
        applycation.post(`${this.basePath}/:id/index`, [authorize('SNOW', 'TYWIN', 'DAENERYS'), this.indexArchives])
        applycation.get(`${this.basePath}/:id/imagens`, [authorize('SNOW', 'TYWIN', 'DAENERYS'), this.listImagens])
        applycation.patch(`${this.basePath}/:id`, [authorize('DAENERYS'), this.validateId, this.update])
        applycation.del(`${this.basePath}/:id`, [authorize('DAENERYS'), this.validateId, this.delete])
        applycation.get(`${this.basePath}/:id`, [authorize('DAENERYS'), this.validateId, this.findById])
    }

}

export const batchesRouter = new BatchesRouter()
