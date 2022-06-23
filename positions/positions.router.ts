import { ModelRouter } from "../common/model-router";
import * as restify from "restify";
import { NotFoundError, MethodNotAllowedError, NotExtendedError } from 'restify-errors';
import * as mongoose from "mongoose";

import { authorize } from "../security/authz.handler";
import { Position } from "./positions.model"
import { Archive } from "../archives/archives.model";
import { authenticate } from '../security/auth.handler';
import { User } from "../users/users.model";
import { ObjectId } from 'bson';

import * as cluster from 'cluster';
import * as child_process from 'child_process';

var fs = require('fs');


class PositionsRouter extends ModelRouter<Position> {
    constructor() {
        super(Position);
    }

    protected prepareOne(
        query: mongoose.DocumentQuery<Position, Position>
    ): mongoose.DocumentQuery<Position, Position> {
        return query
            .populate("storehouse", "name")
            .populate("company", "name")

    }

    envelop(document) {
        let resource = super.envelope(document);
        resource._links.position = `${this.basePath}/${resource._id}/listSeal`;
        return resource;
    }


    find = (req, resp, next) => {
        let page = parseInt(req.query._page || 10000000);
        page += 1||1;
        const skip = (page - 1) * this.pageSize;
        Position.count({
            mailSignup: req.authenticated.mailSignup,
            
        })
            .exec()
            .then(count =>
                Position.find({
                    mailSignup: req.authenticated.mailSignup,
                    
                })
                    .populate("storehouse", "name")
                    .populate("company", "name")
                    .populate("departament", "name")
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
    };



    //   delete = (req, resp, next) => {
    //     Archive.find({ volume: req.params.id })
    //       .then(doc => {
    //         if (doc.length === 0) {
    //           this.model
    //             .remove({ _id: req.params.id })
    //             .exec()
    //             .then((cmdResult: any) => {
    //               if (cmdResult.result.n) {
    //                 resp.send(204);
    //               } else {
    //                 throw new NotFoundError("Caixa não encontrada!");
    //               }
    //               return next();
    //             })
    //             .catch(next);
    //         } else {
    //           throw new MethodNotAllowedError(
    //             "Esta Caixa não pode ser excluída pois possui registros Associdados"
    //           );
    //         }
    //       })
    //       .catch(next);
    //   };
    filter = async (req, resp, next) => {
        const _position = req.body.position;
        // const initDate = req.body.initDate || "1900-01-01";
        // const endDate = req.body.endDate || "2900-01-01";


        const filters = req.body;

        const recebe = _position;

        const regex = new RegExp(recebe, "ig");


        let page = parseInt(req.query._page || 1);
        let Size = parseInt(req.query.size || 10);
        this.pageSize = Size;
        page += 1;
        const skip = (page - 1) * this.pageSize;

        let profile = req.authenticated.profiles.toString()


        Position.count(
            Position.find({
                mailSignup: req.authenticated.mailSignup,
                position: regex,
                $and: [
                    filters,

                ]
            })
        )
            .exec()
            .then(
                async count =>
                    await Position.find({
                        mailSignup: req.authenticated.mailSignup,
                        position: regex,
                        $and: [
                            filters,
                        ]
                    })
                        .populate("storehouse", "name")
                        .populate("company", "name")
                        .populate("departament", "name")
                        .sort('position')
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

    };

    save = async (req, resp, next) => {


        let document = new Position({
            position: req.body.positions,
            storehouse: req.body.storehouse,
            street:req.body.street,
            mailSignup: req.authenticated.mailSignup,
            author: req.authenticated._id,
            used: false
        });
        Position.find({
            mailSignup: req.authenticated.mailSignup,
            position: req.body.position,
            street:req.body.street,
            storehouse: req.body.storehouse
        })
            .then(async com => {
                if (com.length === 0) {
                    await document.save().then(this.render(resp, next));
                } else {
                    throw new MethodNotAllowedError(
                        "Posição já Cadastrado, por favor cadastro uma outra..."
                    );
                }
            })
            .catch(next);
    };

    import = async (req, resp, next) => {

        let _pos = req.body.positions.map(el => { return el.POSITION });
        let pos = [].concat.apply([], _pos)

        console.log(pos)
        
        let posi = []
        let err = []

        for (let i = 0; pos.length > i; i++) {

            let document = new Position({
                position: pos[i],
                storehouse:req.body.storehouse,
                street:req.body.street,
                author: req.authenticated._id,
                mailSignup: req.authenticated.mailSignup,
            });

            var p = await Position.find({
                mailSignup: req.authenticated.mailSignup,
                position: pos[i],
                street:req.body.street,
                storehouse: req.body.storehouse
            })

            if (p.length === 0) {


                posi.push(document)
                document.save()
                    .catch(next)

                console.log("item ok: ", posi.length)
            } else {
                err.push(pos)
                let row = i + 1
                let log =
                {

                    "row": row,
                    "msgError": "Caixa já cadastrada",
                    "location": pos[i]
                }
            }
        }
        let finish = {
            "Errors": err.length,
            "Imported": posi.length,
        }
        resp.send(finish)
    };


    applyRoutes(applycation: restify.Server) {
        applycation.post(`${this.basePath}/search`, [
            authorize("DAENERYS"),
            this.filter
        ]);
        applycation.get(`${this.basePath}`, [
            authorize("DAENERYS"),
            this.find
        ]);
        applycation.get(`${this.basePath}/:id`, [
            authorize("DAENERYS"),
            this.validateId,
            this.findById
        ]);
        applycation.post(`${this.basePath}`, [
            authorize("DAENERYS"),
            this.save
        ]);

        applycation.post(`${this.basePath}/import`, [
            authorize("DAENERYS"),
            this.import
        ]);
        applycation.put(`${this.basePath}/:id`, [
            authorize("DAENERYS"),
            this.validateId,
            this.update
        ]);
        applycation.patch(`${this.basePath}/:id`, [
            authorize("DAENERYS"),
            this.validateId,
            this.replace
        ]);
        applycation.del(`${this.basePath}/:id`, [
            authorize("DAENERYS"),
            this.validateId,
            this.delete
        ]);


    }
}

export const positionRouter = new PositionsRouter();
