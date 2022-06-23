import * as restify from 'restify'
import * as fs from 'fs'
import * as mongoose from 'mongoose'
import { tokenParser } from '../security/token.parser'
import { logger } from '../common/logger'
import { environment } from '../common/environment'
import { Router } from '../common/router'
import { mergePatchBodyParser } from './merge-patch.parser'
import { handleError } from './error.handler'
import { Certificate } from 'crypto';
import * as corsMiddleware from 'restify-cors-middleware'
import { authorize } from '../security/authz.handler';
import { authenticate } from '../security/auth.handler';
import * as cluster from 'cluster'
import * as child_process from 'child_process'
import * as morgan from 'morgan'









          
          




export class Server {

  application: restify.Server

  initializeDb(): mongoose.MongooseThenable {
    (<any>mongoose).Promise = global.Promise
    return mongoose.connect(environment.db.url, {
      useMongoClient: true
    })
  }

  


  

  

  initRoutes(routers: Router[]): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        const options: restify.ServerOptions = {
          name: 'archio-api',
          version: '1.0.0',
          log: logger

        }
        if (environment.security.enableHTTPS) {
          options.certificate = fs.readFileSync(environment.security.certificate),
            options.key = fs.readFileSync(environment.security.key)
        }

        this.application = restify.createServer(options)

        const corsOptions: corsMiddleware.Options = {
          preflightMaxAge: 86400,
          origins: ['*'],
          allowHeaders: ['authorization'],
          exposeHeaders: ['x-custom-header','request-id'],

        }
        const cors: corsMiddleware.CorsMiddleware = corsMiddleware(corsOptions)


        this.application.use(morgan('dev'))


        this.application.pre(cors.preflight)

        // this.application.pre(restify.plugins.requestLogger({
        //   log: logger
        // }))

        this.application.use(cors.actual)


        this.application.use(restify.plugins.urlEncodedBodyParser())
        this.application.use(restify.plugins.queryParser())
        this.application.use(restify.plugins.bodyParser({maxBodySize:9000, maxFieldsSize:100 * 1024 * 1024}))


        this.application.use(mergePatchBodyParser)
        this.application.use(tokenParser)

        //routes

        for (let router of routers) {
          router.applyRoutes(this.application)
        }

        this.application.listen(environment.server.port, () => {
          resolve(this.application)
        })



        this.application.on('restifyError', handleError)
        

      } catch (error) {
        reject(error)
      }
    })
  }

  bootstrap(routers: Router[] = []): Promise<Server> {
    return this.initializeDb().then(() =>
      this.initRoutes(routers).then(() => this))
  }
  shutdown() {
    return mongoose.disconnect().then(() => this.application.close())
  }


}