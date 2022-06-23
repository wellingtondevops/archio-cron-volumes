
import * as restify from "restify";
import * as mongoose from "mongoose";
import * as cluster from 'cluster';
import * as child_process from 'child_process';
import amqp = require('amqplib/callback_api');

import { ModelRouter } from "../common/model-router";
import { NotFoundError, MethodNotAllowedError, NotExtendedError } from 'restify-errors';
import { Notifier } from "./notifiers.model";
import { authorize } from "../security/authz.handler";
import { Archive } from "../archives/archives.model";
import { authenticate } from '../security/auth.handler';
import { environment } from '../common/environment'


class NotifiersRouter extends ModelRouter<Notifier> {
  constructor() {
    super(Notifier);
  }

  protected prepareOne(
    query: mongoose.DocumentQuery<Notifier, Notifier>
  ): mongoose.DocumentQuery<Notifier, Notifier> {
    return query
    // .populate("storehouse", "name")
    // .populate("company", "name")
    // .populate("departament", "name")
    // .populate("volumeLoan.stastatLoan");
  }

  envelop(document) {
    let resource = super.envelope(document);
    resource._links.listSeal = `${this.basePath}/${resource._id}/listSeal`;
    return resource;
  }
  findNotification = async (req, resp, next) => {
    let profile = req.authenticated.profiles.toString()
    let userId = req.authenticated.id.toString()


    Notifier.count(
      Notifier.find({
        mailSignup: req.authenticated.mailSignup,
        user: userId,
        active: true
      })
    )
      .exec()
      .then(count =>
        Notifier.find({
          mailSignup: req.authenticated.mailSignup,
          user: userId,
          active: true
        })
          .limit(10)
          .then(
            this.renderAll(resp, next, {
              count,
              url: req.url
            })
          )
      )
      .catch(next);
  };

  applyRoutes(applycation: restify.Server) {

    applycation.get(`${this.basePath}`, [authorize('SNOW', 'TYWIN', 'DAENERYS', 'STARK', 'TULLY'), this.findNotification])
    applycation.del(`${this.basePath}/:id`, [authorize('SNOW', 'TYWIN', 'DAENERYS', 'STARK', 'TULLY'), this.delete])

  }
}

export const notifierRouter = new NotifiersRouter();
