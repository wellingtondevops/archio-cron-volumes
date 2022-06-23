import { ModelRouter } from '../common/model-router'
import * as restify from 'restify'
import { authorize } from '../security/authz.handler'
import { Profile } from './profiles.model'
import { MethodNotAllowedError } from 'restify-errors'
const cache = require('../cache/cache')

import * as mongoose from 'mongoose'
import { authenticate } from '../security/auth.handler';



class ProfilesRouter extends ModelRouter<Profile> {
    constructor() {
        super(Profile)
    }



    list = async (req, resp, next) => {

        let profile = req.authenticated.profiles.toString()
        // let params = `listprofile:${profile}`
        // const cached = await cache.get(params)

        // if (cached) {

            
        //     resp.send({
        //         "_links": {
        //             "self": "undefined",
        //             "totalPage": 1
        //         }, items: cached
        //     })
        // } else {

            if (profile === 'DAENERYS') {
                const p = await Profile.find({
                    mailSignup: req.authenticated.mailSignup, profileName: { $ne: 'WESTEROS' }
                })
                // cache.set(params, p, 60 * 4)
                resp.send({
                    "_links": {
                        "self": "undefined",
                        "totalPage": 1
                    }, items: p
                })

            } else {
                const pr = await Profile.find({
                    mailSignup: req.authenticated.mailSignup, profileName: { $ne: 'WESTEROS' },
                    profileExternal: true

                })
                // cache.set(params, pr, 60 * 4)
                resp.send({
                    "_links": {
                        "self": "undefined",
                        "totalPage": 1
                    }, items: pr
                })

            }
        }

    

    listRequester = async (req, resp, next) => {
        let profile = req.authenticated.profiles.toString()
        if (profile === 'DAENERYS') {
            Profile.find({
                mailSignup: req.authenticated.mailSignup, profileName: { $eq: 'WESTEROS' }
            })

                .then(this.renderAll(resp, next))
                .catch(next);

        } else {
            Profile.find({
                mailSignup: req.authenticated.mailSignup, profileName: { $eq: 'WESTEROS' },
                profileExternal: true

            })
                .then(this.renderAll(resp, next))
                .catch(next);

        }

    };
    save = async (req, resp, next) => {
        let document = new Profile({
            profileName: req.body.profileName,
            profilePlaceHolder: req.body.profilePlaceHolder,
            profileExternal: req.body.profileExternal,
            author: req.authenticated._id,
            mailSignup: req.authenticated.mailSignup,
            write: req.body.write,
            read: req.body.read,
            change: req.body.change,
            delete: req.body.delete,
        });
        Profile.find({
            mailSignup: req.authenticated.mailSignup,
            $or: [
                { profileName: req.body.profileName },
                { profilePlaceHolder: req.body.profilePlaceHolder }
            ]

        })
            .then(async com => {
                if (com.length === 0) {
                    await document.save().then(this.render(resp, next));
                } else {
                    throw new MethodNotAllowedError(
                        "Perfil já cadastrado!"
                    );
                }
            })
            .catch(next);
    };


    //========== find all

    applyRoutes(applycation: restify.Server) {

        applycation.get(`${this.basePath}`, [authorize('SNOW', 'TYWIN', 'DAENERYS', 'STARK', 'TULLY'), this.find])
        applycation.get(`${this.basePath}/list`, [this.list])
        applycation.get(`${this.basePath}/listRequester`, [this.listRequester])
        applycation.post(`${this.basePath}`, [authorize('SNOW', 'TYWIN', 'DAENERYS'), this.save])
        applycation.patch(`${this.basePath}`, [authorize('DAENERYS'), this.update])
        applycation.get(`${this.basePath}`, [authorize('SNOW', 'TYWIN', 'DAENERYS', 'STARK', 'TULLY'), this.findAll])
        applycation.get(`${this.basePath}/:id`, [authorize('SNOW', 'TYWIN', 'DAENERYS', 'STARK', 'TULLY'), this.validateId, this.findById])

    }
}
export const profilesRouter = new ProfilesRouter()
