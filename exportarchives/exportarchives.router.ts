import { ModelRouter } from "../common/model-router";
import * as restify from "restify";
import { Company } from "../companies/companies.model";
import { authorize } from "../security/authz.handler";
import { authenticate } from '../security/auth.handler';
import { User } from "../users/users.model";
import { Doct } from "../docts/docts.model";
import { Archive } from '../archives/archives.model';
import { ExportArchives } from "./exportarchives.model";
import * as moment from 'moment'
import 'moment/locale/pt-br';
import xl = require('excel4node')
import { Volume } from "../volumes/volumes.model";
import { MethodNotAllowedError } from "restify-errors";
import * as fs from 'fs';
import { sendRabbitmq } from "../queues/sendRabbitmqExport";






const wb = new xl.Workbook({
    jszip: {
        compression: 'DEFLATE',
    },
    defaultFont: {

        name: 'Calibri',
        color: 'FFFFFFFF',
    },
    dateFormat: 'm/d/yy hh:mm:ss',



});
const ws = wb.addWorksheet('EXPORTAÇÃO');

let style1 = wb.createStyle({
    font: {
        color: 'black',
        size: 11,
        name: 'Calibri',
    },
    fill: {
        type: 'pattern',
        patternType: 'solid',
        bgColor: '#FFFFFF',
        fgColor: '#FFFFFF',
    },
    border: {
        left: {
            style: 'thin',
            color: 'black',
        },
        right: {
            style: 'thin',
            color: 'black',
        },
        top: {
            style: 'thin',
            color: 'black',
        },
        bottom: {
            style: 'thin',
            color: 'black',
        },


        outline: false,
    }


})
let style2 = wb.createStyle({
    font: {
        bold: true,
        color: 'black',
        size: 12,
        name: 'Calibri',
    },
    fill: {
        type: 'pattern',
        patternType: 'solid',
        bgColor: '#8EA9DB',
        fgColor: '#8EA9DB',
    },
    border: {
        left: {
            style: 'thin',
            color: 'black',
        },
        right: {
            style: 'thin',
            color: 'black',
        },
        top: {
            style: 'thin',
            color: 'black',
        },
        bottom: {
            style: 'thin',
            color: 'black',
        },
        outline: false,
    }



})
let style3 = wb.createStyle({
    font: {
        color: 'black',
        size: 11,
        name: 'Calibri',
    },
    fill: {
        type: 'pattern',
        patternType: 'solid',
        bgColor: '#B4C6E7',
        fgColor: '#B4C6E7',
    },
    border: {
        left: {
            style: 'thin',
            color: 'black',
        },
        right: {
            style: 'thin',
            color: 'black',
        },
        top: {
            style: 'thin',
            color: 'black',
        },
        bottom: {
            style: 'thin',
            color: 'black',
        },


        outline: false,
    },


})



class ExportArchivesRouter extends ModelRouter<ExportArchives> {
    constructor() {
        super(ExportArchives);
    }

    callExport = async (req, resp, next) => {

        const queue = "exportArchives"
        const idus = req.authenticated.id
        const sponsor = req.authenticated.mailSignup
        const bodyData = req.body
        let profile = req.authenticated.profiles.toString()
      

      .then(resp.send({ "mssg": "Sua Planilha está sendo Gerada, logo será notificado!" }))
      .catch(next)

    }

    excelBase64 = async (req, resp, next) => {



        const text = req.body.search || "";
        let _initDate = req.body.initDate || "1900-01-01";
        let _endDate = req.body.endDate || "2900-01-01";
        let initDate = new Date(_initDate)
        const t = 1
        let __endDate = new Date(_endDate)
        let endDate = __endDate.setDate(__endDate.getDate() + 1)
        const _status = req.body.status || "ATIVO";
        const location = req.body.location || undefined;
        const recebe = req.body.status;
        const regex = new RegExp(recebe, "ig");
        const order = Archive.create || req.body.order;
        const filters = req.body;
        const filter = delete filters.search && delete filters.initDate;
        delete filters.endDate && delete filters.location;

        let page = parseInt(req.query._page || 1);
        let Size = parseInt(req.query.size || 50);
        this.pageSize = Size;
        page += 1;
        const skip = (page - 1) * this.pageSize;

        let profile = req.authenticated.profiles.toString()

        try {
            if (req.body.company !== undefined || null) {
                if (profile === 'DAENERYS') {
                    console.log("to aqui")
                    if (text === "") {
                        //---busca sem com texto em branco
                        if (location === undefined) {

                            const result = await Archive.find({
                                mailSignup: req.authenticated.mailSignup,

                                $and: [
                                    filters,
                                    {
                                        create: {
                                            $gte: initDate,
                                            $lte: endDate
                                        }
                                    }
                                ]
                            })
                                .populate("company", "name")
                                .populate("storehouse", "name")
                                .populate("volume", "location")
                                .populate("departament", "name")
                                .populate("doct", "name")
                                .populate("picture", "page")
                                .then(result => {

                                    let dp = result.map(el => { return el.departament });
                                    let _dp = [].concat.apply([], dp);
                                    let _department = _dp.map(el => { return el.name });

                                    let lc = result.map(el => { return el.volume });
                                    let _lc = [].concat.apply([], lc);
                                    let _location = _lc.map(el => { return el.location });

                                    let st = result.map(el => { return el.status });
                                    let _st = [].concat.apply([], st);

                                    let doc = result.map(el => { return el.doct });
                                    let _doc = [].concat.apply([], doc);
                                    let _document = _doc.map(el => { return el.name });

                                    let sto = result.map(el => { return el.storehouse });
                                    let _sto = [].concat.apply([], sto);
                                    let _storehouse = _sto.map(el => { return el.name });
                                    let tag = result.map(el => { return el.tag.toString() });
                                    let _tag = [].concat.apply([], tag);

                                    let create = result.map(el => { return el.create });

                                    let pict = result.map(el => {
                                        if (el.picture !== undefined) {
                                            return el.picture;
                                        }
                                        else {
                                            return el.picture = [{
                                                "_id": "000000000",
                                                "page": 0
                                            }];
                                        }
                                    }
                                    )
                                    let _pict = [].concat.apply([], pict);
                                    let pitur = _pict.map(el => { return el.page });

                                    ws.row(1).filter()
                                    ws.row(1).freeze()

                                    ws.cell(1, 1).string('DEPARTAMENTO').style(style2)
                                    ws.cell(1, 2).string('POSIÇÃO').style(style2);
                                    ws.cell(1, 3).string('STATUS').style(style2);
                                    ws.cell(1, 4).string('DOCUMENTO').style(style2);
                                    ws.cell(1, 5).string('DEPOSITO').style(style2);
                                    ws.cell(1, 6).string('INDEXAÇÃO').style(style2);
                                    // ws.cell(1, 7).string('ANEXO').style(style2);
                                    ws.cell(1, 7).string('PAGINAS').style(style2);
                                    ws.cell(1, 8).string('CRIADO').style(style2);

                                    for (let i = 0; _department.length > i && _location.length > i
                                        && _st.length > i && _document.length
                                        && _storehouse.length > i && _tag.length > i
                                        && pitur.length > i
                                        ;
                                        i++) {

                                        let estilo = ''
                                        if (i % 2 === 0) {

                                            estilo = style1
                                        } else {

                                            estilo = style3

                                        }

                                        ws.cell(i + 2, 1).string(_department[i]).style(estilo)
                                        ws.cell(i + 2, 2).string(_location[i]).style(estilo)
                                        ws.cell(i + 2, 3).string(_st[i]).style(estilo)
                                        ws.cell(i + 2, 4).string(_document[i]).style(estilo)
                                        ws.cell(i + 2, 5).string(_storehouse[i]).style(estilo)
                                        ws.cell(i + 2, 6).string(_tag[i].replace(/,/g, " | ")).style(estilo)
                                        ws.cell(i + 2, 7).number(pitur[i]).style(estilo)
                                        ws.cell(i + 2, 8).string(moment(create[i]).format('DD/MM/YYYY')).style(estilo)

                                    }


                                    wb.writeToBuffer().then(function (buffer) {
                                        wb.write(`${Date.now()}-${req.authenticated.email}-Exportacao.xlsx`, next)
                                        let data = buffer.toString('base64')
                                        let file = {
                                            name: `${Date.now()}-${req.authenticated.email}-Exportacao.xlsx`,
                                            file: data
                                        }

                                        resp.send(file)

                                    })

                                })

                                .catch(next)

                        } else {
                            const locations = await Volume.find({
                                mailSignup: req.authenticated.mailSignup,
                                location: new RegExp(location, "ig")
                            }).select("_id");

                            const result = await Archive.find({
                                mailSignup: req.authenticated.mailSignup,

                                volume: locations,
                                $and: [
                                    filters,

                                    {
                                        create: {
                                            $gte: initDate,
                                            $lte: endDate
                                        }
                                    }
                                ]
                            })
                                .populate("company", "name")
                                .populate("storehouse", "name")
                                .populate("volume", "location")
                                .populate("departament", "name")
                                .populate("doct", "name")
                                .populate("picture", "page")
                                .then(result => {

                                    let dp = result.map(el => { return el.departament });
                                    let _dp = [].concat.apply([], dp);
                                    let _department = _dp.map(el => { return el.name });

                                    let lc = result.map(el => { return el.volume });
                                    let _lc = [].concat.apply([], lc);
                                    let _location = _lc.map(el => { return el.location });

                                    let st = result.map(el => { return el.status });
                                    let _st = [].concat.apply([], st);

                                    let doc = result.map(el => { return el.doct });
                                    let _doc = [].concat.apply([], doc);
                                    let _document = _doc.map(el => { return el.name });

                                    let sto = result.map(el => { return el.storehouse });
                                    let _sto = [].concat.apply([], sto);
                                    let _storehouse = _sto.map(el => { return el.name });
                                    let tag = result.map(el => { return el.tag.toString() });
                                    let _tag = [].concat.apply([], tag);

                                    let create = result.map(el => { return el.create });

                                    let pict = result.map(el => {
                                        if (el.picture !== undefined) {
                                            return el.picture;
                                        }
                                        else {
                                            return el.picture = [{
                                                "_id": "000000000",
                                                "page": 0
                                            }];
                                        }
                                    }
                                    )
                                    let _pict = [].concat.apply([], pict);
                                    let pitur = _pict.map(el => { return el.page });

                                    ws.row(1).filter()
                                    ws.row(1).freeze()

                                    ws.cell(1, 1).string('DEPARTAMENTO').style(style2)
                                    ws.cell(1, 2).string('POSIÇÃO').style(style2);
                                    ws.cell(1, 3).string('STATUS').style(style2);
                                    ws.cell(1, 4).string('DOCUMENTO').style(style2);
                                    ws.cell(1, 5).string('DEPOSITO').style(style2);
                                    ws.cell(1, 6).string('INDEXAÇÃO').style(style2);
                                    // ws.cell(1, 7).string('ANEXO').style(style2);
                                    ws.cell(1, 7).string('PAGINAS').style(style2);
                                    ws.cell(1, 8).string('CRIADO').style(style2);

                                    for (let i = 0; _department.length > i && _location.length > i
                                        && _st.length > i && _document.length
                                        && _storehouse.length > i && _tag.length > i
                                        && pitur.length > i
                                        ;
                                        i++) {

                                        let estilo = ''
                                        if (i % 2 === 0) {

                                            estilo = style1
                                        } else {

                                            estilo = style3

                                        }

                                        ws.cell(i + 2, 1).string(_department[i]).style(estilo)
                                        ws.cell(i + 2, 2).string(_location[i]).style(estilo)
                                        ws.cell(i + 2, 3).string(_st[i]).style(estilo)
                                        ws.cell(i + 2, 4).string(_document[i]).style(estilo)
                                        ws.cell(i + 2, 5).string(_storehouse[i]).style(estilo)
                                        ws.cell(i + 2, 6).string(_tag[i].replace(/,/g, " | ")).style(estilo)
                                        ws.cell(i + 2, 7).number(pitur[i]).style(estilo)
                                        ws.cell(i + 2, 8).string(moment(create[i]).format('DD/MM/YYYY')).style(estilo)

                                    }

                                    wb.writeToBuffer().then(function (buffer) {
                                        wb.write(`${Date.now()}-${req.authenticated.email}-Exportacao.xlsx`, next)
                                        let data = buffer.toString('base64')
                                        let file = {
                                            name: `${Date.now()}-${req.authenticated.email}-Exportacao.xlsx`,
                                            file: data
                                        }

                                        resp.send(file)
                                    })
                                }).catch(next)

                        }
                        //----------------------------------------------------------------------------------
                    } else {

                        let text2 = '"' + text.split(" ").join('" "') + '"' || ""
                        // ---busca com indice preenchido
                        // console.log(text2)
                        if (location === undefined) {

                            const result = await Archive.find(
                                {
                                    mailSignup: req.authenticated.mailSignup,

                                    $and: [
                                        filters,
                                        {
                                            $text: {
                                                $search: text2
                                            }
                                        },
                                        {
                                            create: {
                                                $gte: initDate,
                                                $lte: endDate
                                            }
                                        }
                                    ]
                                },
                                {
                                    score: {
                                        $meta: "textScore"
                                    }
                                }
                            )
                                .sort({
                                    score: {
                                        $meta: "textScore"
                                    }
                                })
                                .populate("company", "name")
                                .populate("storehouse", "name")
                                .populate("volume", "location")
                                .populate("departament", "name")
                                .populate("doct", "name")
                                .populate("picture", "page")
                                .then(result => {

                                    let dp = result.map(el => { return el.departament });
                                    let _dp = [].concat.apply([], dp);
                                    let _department = _dp.map(el => { return el.name });

                                    let lc = result.map(el => { return el.volume });
                                    let _lc = [].concat.apply([], lc);
                                    let _location = _lc.map(el => { return el.location });

                                    let st = result.map(el => { return el.status });
                                    let _st = [].concat.apply([], st);

                                    let doc = result.map(el => { return el.doct });
                                    let _doc = [].concat.apply([], doc);
                                    let _document = _doc.map(el => { return el.name });

                                    let sto = result.map(el => { return el.storehouse });
                                    let _sto = [].concat.apply([], sto);
                                    let _storehouse = _sto.map(el => { return el.name });
                                    let tag = result.map(el => { return el.tag.toString() });
                                    let _tag = [].concat.apply([], tag);

                                    let create = result.map(el => { return el.create });

                                    let pict = result.map(el => {
                                        if (el.picture !== undefined) {
                                            return el.picture;
                                        }
                                        else {
                                            return el.picture = [{
                                                "_id": "000000000",
                                                "page": 0
                                            }];
                                        }

                                    }
                                    )
                                    let _pict = [].concat.apply([], pict);
                                    let pitur = _pict.map(el => { return el.page });

                                    ws.row(1).filter()
                                    ws.row(1).freeze()

                                    ws.cell(1, 1).string('DEPARTAMENTO').style(style2)
                                    ws.cell(1, 2).string('POSIÇÃO').style(style2);
                                    ws.cell(1, 3).string('STATUS').style(style2);
                                    ws.cell(1, 4).string('DOCUMENTO').style(style2);
                                    ws.cell(1, 5).string('DEPOSITO').style(style2);
                                    ws.cell(1, 6).string('INDEXAÇÃO').style(style2);
                                    // ws.cell(1, 7).string('ANEXO').style(style2);
                                    ws.cell(1, 7).string('PAGINAS').style(style2);
                                    ws.cell(1, 8).string('CRIADO').style(style2);

                                    for (let i = 0; _department.length > i && _location.length > i
                                        && _st.length > i && _document.length
                                        && _storehouse.length > i && _tag.length > i
                                        && pitur.length > i
                                        ;
                                        i++) {

                                        let estilo = ''
                                        if (i % 2 === 0) {

                                            estilo = style1
                                        } else {

                                            estilo = style3

                                        }

                                        ws.cell(i + 2, 1).string(_department[i]).style(estilo)
                                        ws.cell(i + 2, 2).string(_location[i]).style(estilo)
                                        ws.cell(i + 2, 3).string(_st[i]).style(estilo)
                                        ws.cell(i + 2, 4).string(_document[i]).style(estilo)
                                        ws.cell(i + 2, 5).string(_storehouse[i]).style(estilo)
                                        ws.cell(i + 2, 6).string(_tag[i].replace(/,/g, " | ")).style(estilo)
                                        ws.cell(i + 2, 7).number(pitur[i]).style(estilo)
                                        ws.cell(i + 2, 8).string(moment(create[i]).format('DD/MM/YYYY')).style(estilo)

                                    }

                                    wb.writeToBuffer().then(function (buffer) {
                                        wb.write(`${Date.now()}-${req.authenticated.email}-Exportacao.xlsx`, next)
                                        let data = buffer.toString('base64')
                                        let file = {
                                            name: `${Date.now()}-${req.authenticated.email}-Exportacao.xlsx`,
                                            file: data
                                        }

                                        resp.send(file)
                                    })

                                }).catch(next)

                        } else {

                            //comeco aqui amanha
                            // console.log("Opa Opa opa aqui tem sim");
                            const locations = await Volume.find({
                                mailSignup: req.authenticated.mailSignup,
                                location: new RegExp(location, "ig")
                            }).select("_id");

                            const result = await Archive.find(
                                {
                                    mailSignup: req.authenticated.mailSignup,

                                    volume: locations,

                                    $and: [
                                        filters,
                                        {
                                            $text: {
                                                $search: text2
                                            }
                                        },
                                        {
                                            create: {
                                                $gte: initDate,
                                                $lte: endDate
                                            }
                                        }
                                    ]
                                },
                                {
                                    score: {
                                        $meta: "textScore"
                                    }
                                }
                            )
                                .sort({
                                    score: {
                                        $meta: "textScore"
                                    }
                                })
                        }
                    }
                } else {
                    if (text === "") {
                        //---busca sem com texto em branco
                        if (location === undefined) {
                            let user = await User.find({ _id: req.authenticated._id })
                                .select("permissions.docts")
                                .select("permissions.company");
                            let data = user[0].permissions.map(item => {
                                return item.docts;
                            });

                            let doct = [].concat.apply([], data)

                            let data2 = user[0].permissions.map(item => {
                                return item.company;
                            });

                            let company = data2;


                            const result = await Archive.find({
                                mailSignup: req.authenticated.mailSignup,
                                company: company,
                                doct: doct,

                                $and: [
                                    filters,
                                    {
                                        create: {
                                            $gte: initDate,
                                            $lte: endDate
                                        }
                                    }
                                ]
                            })
                                .populate("company", "name")
                                .populate("storehouse", "name")
                                .populate("volume", "location")
                                .populate("departament", "name")
                                .populate("doct", "name")
                                .populate("picture", "page")
                                .then(result => {

                                    let dp = result.map(el => { return el.departament });
                                    let _dp = [].concat.apply([], dp);
                                    let _department = _dp.map(el => { return el.name });

                                    let lc = result.map(el => { return el.volume });
                                    let _lc = [].concat.apply([], lc);
                                    let _location = _lc.map(el => { return el.location });

                                    let st = result.map(el => { return el.status });
                                    let _st = [].concat.apply([], st);

                                    let doc = result.map(el => { return el.doct });
                                    let _doc = [].concat.apply([], doc);
                                    let _document = _doc.map(el => { return el.name });

                                    let sto = result.map(el => { return el.storehouse });
                                    let _sto = [].concat.apply([], sto);
                                    let _storehouse = _sto.map(el => { return el.name });

                                    let tag = result.map(el => { return el.tag.toString() });
                                    let _tag = [].concat.apply([], tag);

                                    let create = result.map(el => { return el.create });

                                    let pict = result.map(el => {
                                        if (el.picture !== undefined) {
                                            return el.picture;
                                        }
                                        else {
                                            return el.picture = [{
                                                "_id": "000000000",
                                                "page": 0
                                            }];
                                        }
                                    }
                                    )
                                    let _pict = [].concat.apply([], pict);
                                    let pitur = _pict.map(el => { return el.page });

                                    ws.row(1).filter()
                                    ws.row(1).freeze()
                                    ws.cell(1, 1).string('DEPARTAMENTO').style(style2)
                                    ws.cell(1, 2).string('POSIÇÃO').style(style2);
                                    ws.cell(1, 3).string('STATUS').style(style2);
                                    ws.cell(1, 4).string('DOCUMENTO').style(style2);
                                    ws.cell(1, 5).string('DEPOSITO').style(style2);
                                    ws.cell(1, 6).string('INDEXAÇÃO').style(style2);
                                    // ws.cell(1, 7).string('ANEXO').style(style2);
                                    ws.cell(1, 7).string('PAGINAS').style(style2);
                                    ws.cell(1, 8).string('CRIADO').style(style2);

                                    for (let i = 0; _department.length > i && _location.length > i
                                        && _st.length > i && _document.length
                                        && _storehouse.length > i && _tag.length > i
                                        && pitur.length > i
                                        ;
                                        i++) {

                                        let estilo = ''
                                        if (i % 2 === 0) {

                                            estilo = style1
                                        } else {

                                            estilo = style3

                                        }

                                        ws.cell(i + 2, 1).string(_department[i]).style(estilo)
                                        ws.cell(i + 2, 2).string(_location[i]).style(estilo)
                                        ws.cell(i + 2, 3).string(_st[i]).style(estilo)
                                        ws.cell(i + 2, 4).string(_document[i]).style(estilo)
                                        ws.cell(i + 2, 5).string(_storehouse[i]).style(estilo)
                                        ws.cell(i + 2, 6).string(_tag[i].replace(/,/g, " | ")).style(estilo)
                                        ws.cell(i + 2, 7).number(pitur[i]).style(estilo)
                                        ws.cell(i + 2, 8).string(moment(create[i]).format('DD/MM/YYYY')).style(estilo)

                                    }
                                    wb.writeToBuffer().then(function (buffer) {
                                        wb.write(`${Date.now()}-${req.authenticated.email}-Exportacao.xlsx`, next)
                                        let data = buffer.toString('base64')
                                        let file = {
                                            name: `${Date.now()}-${req.authenticated.email}-Exportacao.xlsx`,
                                            file: data
                                        }

                                        resp.send(file)
                                    })



                                }).catch(next)



                        } else {
                            let user = await User.find({ _id: req.authenticated._id })
                                .select("permissions.docts")
                                .select("permissions.company");
                            let data = user[0].permissions.map(item => {
                                return item.docts;
                            });

                            let doct = [].concat.apply([], data)

                            let data2 = user[0].permissions.map(item => {
                                return item.company;
                            });

                            let company = data2;
                            const locations = await Volume.find({
                                mailSignup: req.authenticated.mailSignup,
                                company: company,
                                location: new RegExp(location, "ig")
                            }).select("_id");

                            const result = await Archive.find({
                                mailSignup: req.authenticated.mailSignup,
                                company: company,
                                doct: doct,
                                volume: locations,
                                $and: [
                                    filters,

                                    {
                                        create: {
                                            $gte: initDate,
                                            $lte: endDate
                                        }
                                    }
                                ]
                            })
                                .populate("company", "name")
                                .populate("storehouse", "name")
                                .populate("volume", "location")
                                .populate("departament", "name")
                                .populate("doct", "name")
                                .populate("picture", "page")
                                .then(result => {

                                    let dp = result.map(el => { return el.departament });
                                    let _dp = [].concat.apply([], dp);
                                    let _department = _dp.map(el => { return el.name });

                                    let lc = result.map(el => { return el.volume });
                                    let _lc = [].concat.apply([], lc);
                                    let _location = _lc.map(el => { return el.location });

                                    let st = result.map(el => { return el.status });
                                    let _st = [].concat.apply([], st);

                                    let doc = result.map(el => { return el.doct });
                                    let _doc = [].concat.apply([], doc);
                                    let _document = _doc.map(el => { return el.name });

                                    let sto = result.map(el => { return el.storehouse });
                                    let _sto = [].concat.apply([], sto);
                                    let _storehouse = _sto.map(el => { return el.name });

                                    let tag = result.map(el => { return el.tag.toString() });
                                    let _tag = [].concat.apply([], tag);

                                    let create = result.map(el => { return el.create });

                                    let pict = result.map(el => {
                                        if (el.picture !== undefined) {
                                            return el.picture;
                                        }
                                        else {
                                            return el.picture = [{
                                                "_id": "000000000",
                                                "page": 0
                                            }];
                                        }
                                    }
                                    )
                                    let _pict = [].concat.apply([], pict);
                                    let pitur = _pict.map(el => { return el.page });

                                    ws.row(1).filter()
                                    ws.row(1).freeze()

                                    ws.cell(1, 1).string('DEPARTAMENTO').style(style2)
                                    ws.cell(1, 2).string('POSIÇÃO').style(style2);
                                    ws.cell(1, 3).string('STATUS').style(style2);
                                    ws.cell(1, 4).string('DOCUMENTO').style(style2);
                                    ws.cell(1, 5).string('DEPOSITO').style(style2);
                                    ws.cell(1, 6).string('INDEXAÇÃO').style(style2);
                                    // ws.cell(1, 7).string('ANEXO').style(style2);
                                    ws.cell(1, 7).string('PAGINAS').style(style2);
                                    ws.cell(1, 8).string('CRIADO').style(style2);

                                    for (let i = 0; _department.length > i && _location.length > i
                                        && _st.length > i && _document.length
                                        && _storehouse.length > i && _tag.length > i
                                        && pitur.length > i
                                        ;
                                        i++) {

                                        let estilo = ''
                                        if (i % 2 === 0) {

                                            estilo = style1
                                        } else {

                                            estilo = style3

                                        }
                                        ws.cell(i + 2, 1).string(_department[i]).style(estilo)
                                        ws.cell(i + 2, 2).string(_location[i]).style(estilo)
                                        ws.cell(i + 2, 3).string(_st[i]).style(estilo)
                                        ws.cell(i + 2, 4).string(_document[i]).style(estilo)
                                        ws.cell(i + 2, 5).string(_storehouse[i]).style(estilo)
                                        ws.cell(i + 2, 6).string(_tag[i].replace(/,/g, " | ")).style(estilo)
                                        ws.cell(i + 2, 7).number(pitur[i]).style(estilo)
                                        ws.cell(i + 2, 8).string(moment(create[i]).format('DD/MM/YYYY')).style(estilo)

                                    }
                                    wb.writeToBuffer().then(function (buffer) {
                                        wb.write(`${Date.now()}-${req.authenticated.email}-Exportacao.xlsx`, next)
                                        let data = buffer.toString('base64')
                                        let file = {
                                            name: `${Date.now()}-${req.authenticated.email}-Exportacao.xlsx`,
                                            file: data
                                        }

                                        resp.send(file)
                                    })

                                }).catch(next)
                        }
                        //----------------------------------------------------------------------------------
                    } else {

                        let text2 = '"' + text.split(" ").join('" "') + '"' || ""

                        if (location === undefined) {
                            let user = await User.find({ _id: req.authenticated._id })
                                .select("permissions.docts")
                                .select("permissions.company");
                            let data = user[0].permissions.map(item => {
                                return item.docts;
                            });

                            let doct = [].concat.apply([], data)

                            let data2 = user[0].permissions.map(item => {
                                return item.company;
                            });

                            let company = data2;

                            const result = await Archive.find(
                                {
                                    mailSignup: req.authenticated.mailSignup,
                                    company: company,
                                    doct: doct,

                                    $and: [
                                        filters,
                                        {
                                            $text: {
                                                $search: text2
                                            }
                                        },
                                        {
                                            create: {
                                                $gte: initDate,
                                                $lte: endDate
                                            }
                                        }
                                    ]
                                },
                                {
                                    score: {
                                        $meta: "textScore"
                                    }
                                }
                            )
                                .sort({
                                    score: {
                                        $meta: "textScore"
                                    }
                                })
                                .populate("company", "name")
                                .populate("storehouse", "name")
                                .populate("volume", "location")
                                .populate("departament", "name")
                                .populate("doct", "name")
                                .populate("picture", "page")
                                .then(result => {

                                    let dp = result.map(el => { return el.departament });
                                    let _dp = [].concat.apply([], dp);
                                    let _department = _dp.map(el => { return el.name });

                                    let lc = result.map(el => { return el.volume });
                                    let _lc = [].concat.apply([], lc);
                                    let _location = _lc.map(el => { return el.location });

                                    let st = result.map(el => { return el.status });
                                    let _st = [].concat.apply([], st);

                                    let doc = result.map(el => { return el.doct });
                                    let _doc = [].concat.apply([], doc);
                                    let _document = _doc.map(el => { return el.name });

                                    let sto = result.map(el => { return el.storehouse });
                                    let _sto = [].concat.apply([], sto);
                                    let _storehouse = _sto.map(el => { return el.name });

                                    let tag = result.map(el => { return el.tag.toString() });
                                    let _tag = [].concat.apply([], tag);

                                    let create = result.map(el => { return el.create });


                                    let pict = result.map(el => {
                                        if (el.picture !== undefined) {
                                            return el.picture;
                                        }
                                        else {
                                            return el.picture = [{
                                                "_id": "000000000",
                                                "page": 0
                                            }];
                                        }
                                    }
                                    )
                                    let _pict = [].concat.apply([], pict);
                                    let pitur = _pict.map(el => { return el.page });

                                    ws.row(1).filter()
                                    ws.row(1).freeze()

                                    ws.cell(1, 1).string('DEPARTAMENTO').style(style2)
                                    ws.cell(1, 2).string('POSIÇÃO').style(style2);
                                    ws.cell(1, 3).string('STATUS').style(style2);
                                    ws.cell(1, 4).string('DOCUMENTO').style(style2);
                                    ws.cell(1, 5).string('DEPOSITO').style(style2);
                                    ws.cell(1, 6).string('INDEXAÇÃO').style(style2);
                                    // ws.cell(1, 7).string('ANEXO').style(style2);
                                    ws.cell(1, 7).string('PAGINAS').style(style2);
                                    ws.cell(1, 8).string('CRIADO').style(style2);

                                    for (let i = 0; _department.length > i && _location.length > i
                                        && _st.length > i && _document.length
                                        && _storehouse.length > i && _tag.length > i
                                        && pitur.length > i
                                        ;
                                        i++) {

                                        let estilo = ''
                                        if (i % 2 === 0) {

                                            estilo = style1
                                        } else {

                                            estilo = style3

                                        }


                                        ws.cell(i + 2, 1).string(_department[i]).style(estilo)
                                        ws.cell(i + 2, 2).string(_location[i]).style(estilo)
                                        ws.cell(i + 2, 3).string(_st[i]).style(estilo)
                                        ws.cell(i + 2, 4).string(_document[i]).style(estilo)
                                        ws.cell(i + 2, 5).string(_storehouse[i]).style(estilo)
                                        ws.cell(i + 2, 6).string(_tag[i].replace(/,/g, " | ")).style(estilo)
                                        ws.cell(i + 2, 7).number(pitur[i]).style(estilo)
                                        ws.cell(i + 2, 8).string(moment(create[i]).format('DD/MM/YYYY')).style(estilo)
                                    }

                                    wb.writeToBuffer().then(function (buffer) {
                                        wb.write(`${Date.now()}-${req.authenticated.email}-Exportacao.xlsx`, next)
                                        let data = buffer.toString('base64')
                                        let file = {
                                            name: `${Date.now()}-${req.authenticated.email}-Exportacao.xlsx`,
                                            file: data
                                        }
                                        resp.send(file)
                                    })


                                }).catch(next)

                        } else {
                            let user = await User.find({ _id: req.authenticated._id })
                                .select("permissions.docts")
                                .select("permissions.company");
                            let data = user[0].permissions.map(item => {
                                return item.docts;
                            });

                            let doct = [].concat.apply([], data)

                            let data2 = user[0].permissions.map(item => {
                                return item.company;
                            });

                            let company = data2;
                            const locations = await Volume.find({
                                mailSignup: req.authenticated.mailSignup,
                                company: company,
                                location: new RegExp(location, "ig")
                            }).select("_id");
                            const result = await Archive.find(
                                {
                                    mailSignup: req.authenticated.mailSignup,
                                    company: company,
                                    doct: doct,
                                    volume: locations,

                                    $and: [
                                        filters,
                                        {
                                            $text: {
                                                $search: text2
                                            }
                                        },
                                        {
                                            create: {
                                                $gte: initDate,
                                                $lte: endDate
                                            }
                                        }
                                    ]
                                },
                                {
                                    score: {
                                        $meta: "textScore"
                                    }
                                }
                            )
                                .sort({
                                    score: {
                                        $meta: "textScore"
                                    }
                                }).populate("company", "name")
                                .populate("storehouse", "name")
                                .populate("volume", "location")
                                .populate("departament", "name")
                                .populate("doct", "name")
                                .populate("picture", "page")
                                .then(result => {

                                    let dp = result.map(el => { return el.departament });
                                    let _dp = [].concat.apply([], dp);
                                    let _department = _dp.map(el => { return el.name });

                                    let lc = result.map(el => { return el.volume });
                                    let _lc = [].concat.apply([], lc);
                                    let _location = _lc.map(el => { return el.location });

                                    let st = result.map(el => { return el.status });
                                    let _st = [].concat.apply([], st);

                                    let doc = result.map(el => { return el.doct });
                                    let _doc = [].concat.apply([], doc);
                                    let _document = _doc.map(el => { return el.name });

                                    let sto = result.map(el => { return el.storehouse });
                                    let _sto = [].concat.apply([], sto);
                                    let _storehouse = _sto.map(el => { return el.name });

                                    let tag = result.map(el => { return el.tag.toString() });
                                    let _tag = [].concat.apply([], tag);

                                    let create = result.map(el => { return el.create });
                                    let pict = result.map(el => {
                                        if (el.picture !== undefined) {
                                            return el.picture;
                                        }
                                        else {
                                            return el.picture = [{
                                                "_id": "000000000",
                                                "page": 0
                                            }];
                                        }

                                    }
                                    )
                                    let _pict = [].concat.apply([], pict);
                                    let pitur = _pict.map(el => { return el.page });

                                    ws.row(1).filter()
                                    ws.row(1).freeze()

                                    ws.cell(1, 1).string('DEPARTAMENTO').style(style2)
                                    ws.cell(1, 2).string('POSIÇÃO').style(style2);
                                    ws.cell(1, 3).string('STATUS').style(style2);
                                    ws.cell(1, 4).string('DOCUMENTO').style(style2);
                                    ws.cell(1, 5).string('DEPOSITO').style(style2);
                                    ws.cell(1, 6).string('INDEXAÇÃO').style(style2);
                                    // ws.cell(1, 7).string('ANEXO').style(style2);
                                    ws.cell(1, 7).string('PAGINAS').style(style2);
                                    ws.cell(1, 8).string('CRIADO').style(style2);

                                    for (let i = 0; _department.length > i && _location.length > i
                                        && _st.length > i && _document.length
                                        && _storehouse.length > i && _tag.length > i
                                        && pitur.length > i
                                        ;
                                        i++) {

                                        let estilo = ''
                                        if (i % 2 === 0) {

                                            estilo = style1
                                        } else {

                                            estilo = style3

                                        }
                                        ws.cell(i + 2, 1).string(_department[i]).style(estilo)
                                        ws.cell(i + 2, 2).string(_location[i]).style(estilo)
                                        ws.cell(i + 2, 3).string(_st[i]).style(estilo)
                                        ws.cell(i + 2, 4).string(_document[i]).style(estilo)
                                        ws.cell(i + 2, 5).string(_storehouse[i]).style(estilo)
                                        ws.cell(i + 2, 6).string(_tag[i].replace(/,/g, " | ")).style(estilo)
                                        ws.cell(i + 2, 7).number(pitur[i]).style(estilo)
                                        ws.cell(i + 2, 8).string(moment(create[i]).format('DD/MM/YYYY')).style(estilo)

                                    }

                                    wb.writeToBuffer().then(function (buffer) {
                                        wb.write(`${Date.now()}-${req.authenticated.email}-Exportacao.xlsx`, next)
                                        let data = buffer.toString('base64')
                                        let file = {
                                            name: `${Date.now()}-${req.authenticated.email}-Exportacao.xlsx`,
                                            file: data
                                        }

                                        resp.send(file)
                                    })

                                }).catch(next)
                        }
                    }
                }

            } else {
                // console.log("opa agora digitaram")
                throw new MethodNotAllowedError(
                    "Por favor Escolha uma Empresa válida!"
                );
            }

        } catch (error) {
            console.log(error)
            resp.send(error)
        }

    };




    applyRoutes(applycation: restify.Server) {
        // applycation.post(`${this.basePath}`, [this.callExport]);
        // applycation.post(`${this.basePath}/excelBase64`, [this.excelBase64]);

    }
}
export const exportArchivesRouter = new ExportArchivesRouter();
