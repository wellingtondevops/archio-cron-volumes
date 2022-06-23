import { ModelRouter } from '../common/model-router'
import * as restify from 'restify'
import { authorize } from '../security/authz.handler'
import * as mongoose from 'mongoose'
import { Sheetvolume } from './sheetvolumes.model'
import xl = require('excel4node')

let wb = new xl.Workbook()
let ws = wb.addWorksheet('Sheet 1')
let style1 = wb.createStyle({
    font: {
        color: 'black',
        size: 12,
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
let style2 = wb.createStyle({
    font: {
        bold : true,
        color: 'black',
        size: 14
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

class SheetvolumesRouter extends ModelRouter<Sheetvolume> {
    constructor() {
        super(Sheetvolume)
    }

    protected prepareOne(query: mongoose.DocumentQuery<Sheetvolume, Sheetvolume>): mongoose.DocumentQuery<Sheetvolume, Sheetvolume> {
        return query



    }

    envelop(document) {
        let resource = super.envelope(document)
        const sheetvolumeID = document.sheetvolume._id ? document.sheetavolume._id : document.sheetvolume
        resource._links.sheetvolumes = `/sheetvolumes/${sheetvolumeID}`
        return resource
    }


    filter = (req, resp, next) => {

        const recebe = req.body.sheet || ""
        const regex = new RegExp(recebe, 'i')

        const initDate = req.body.initDate || "1900-01-01";    
        const endDate = req.body.endDate || "2900-01-01";

        let page = parseInt(req.query._page || 1)
        page += 1
        const skip = (page - 1) * this.pageSize
        Sheetvolume

            .count(Sheetvolume.find({
                mailSignup: req.authenticated.mailSignup, sheet: regex,
                dateCreated: {
                    $gte: initDate,
                    $lte: endDate
                }
            })).exec()
            .then(count => Sheetvolume.find({
                mailSignup: req.authenticated.mailSignup, sheet: regex,
                dateCreated: {
                    $gte: initDate,
                    $lte: endDate
                }
            }).select('sheet dateCreated')
                .skip(skip)
                .limit(this.pageSize)
                .then(this.renderAll(resp, next, {
                    page, count, pageSize: this.pageSize, url: req.url
                })))
            .catch(next)
    }


    save = async (req, resp, next) => {

        // let sheetName = await Sheetvolume.find({ sheet: req.body.sheet })

        // if (sheetName.length === 1) {
        //     await Sheetvolume.updateOne({ sheet: req.body.sheet, mailSignup: req.authenticated.mailSignup }, {
        //         $push: {
        //             logErrors:[req.body.logErrors]
                   
        //         }
        //     })
        //     resp.send(sheetName)
        // } else {


            let document = new Sheetvolume({
                sheet: Date.now()+"-"+req.body.sheet,
                mailSignup: req.authenticated.mailSignup,
                logErrors:req.body.logErrors
            })
            document.save()
                .then(this.render(resp, next))
                .catch(next)

        //}


    }


    excel = async (req, resp, next) => {

        try {

            let result = await Sheetvolume.find({ _id: req.params.id })

            let _logErrors = await result.map(el => { return el.logErrors });
            let log = [].concat.apply([], _logErrors)
            let _sheet = await result.map(el => { return el.sheet });
            let sheet = [].concat.apply([], _sheet)
            let _location = await log.map(el => { return el.location });
            let location = [].concat.apply([], _location) // retorna a localizaçã
            let _row = await log.map(el => { return el.row });
            let row = [].concat.apply([], _row) // retorna a Linha
            let _msgError = await log.map(el => { return el.msgError });
            let msgError = [].concat.apply([], _msgError) //   

            ws.row(1).filter()
            ws.row(1).freeze()
            ws.cell(1, 1).string('LINHA ERRO').style(style2)
            ws.cell(1, 2).string('LOCALIZACAO').style(style2)
            ws.cell(1, 3).string('TIPO ERRO').style(style2)


            for (let i = 0; row.length > i && location.length > i && msgError.length > i; i++) {
                ws.cell(i + 2, 1).number(row[i]).style(style1)
                ws.cell(i + 2, 2).string(location[i]).style(style1)
                ws.cell(i + 2, 3).string(msgError[i]).style(style1)
            } 
            wb.write('Erros_importacao_plan_' + sheet, resp, next)
        } catch (error) {
        }
    }


    applyRoutes(applycation: restify.Server) {

        applycation.get(`${this.basePath}/:id`, [authorize('TYWIN', 'DAENERYS'), this.validateId, this.findById])
        applycation.get(`${this.basePath}/excel/:id`, this.validateId, this.excel)
        applycation.post(`${this.basePath}/search`, [authorize('SNOW', 'TYWIN', 'DAENERYS'), this.filter])
        applycation.post(`${this.basePath}`, [authorize('SNOW', 'TYWIN', 'DAENERYS'), this.save])



    }
}
export const sheetvolumesRouter = new SheetvolumesRouter()
