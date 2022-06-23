import { Router } from './common/router'
import * as restify from 'restify'


class MainRouter extends Router {
  applyRoutes(application: restify.Server) {
    application.get('/', (req, resp, next) => {
      resp.json({
        // signups: '/signups',
        // accessprofiles:'/accessprofiles',
        // users: '/users',
        // companies: '/companies',        
        // storehouses: '/storehouses',
        volumes: '/volumes',
        // docts: '/docts',
        // departaments:'/departaments',
        archives: '/archives',
        // audits:'/audits',
        // requesters: '/requesters',
        // services: '/services',       
        // volumeloans: '/volumeloans',
        // pictures: '/pictures',
        // templates:'/templates',       
        // listcompanies: '/listcompanies',
        // liststorehouses: '/liststorehouses',
        // listdepartaments:'/listdepartaments',
        // listdocts: '/listdocts',
        // listvolumes:'/listvolumes',
        // listregisters:'/listregisters',         
        // sheetarchives:'/sheetarchives',
        // sheetvolumes:'/sheetvolumes',
        // menuservices:'/menuservices',   
        // notifiers:'/notifiers',   
        // profiles:'/profiles',
        // companyservices:'/companyservices',
        // exportarchives:'/exportarchives',
        // demands:'demands',
        // listrequesters:'/listrequesters',
        // positions:'positions',
        // batches:'batches',
        // worksheets:'worksheets',
        // sheetnames:'sheetnames',
        // userpermissions:'userpermissions',
        // emails: 'emails',
        version: '1.0.0'
      })
    })
  }
}

export const mainRouter = new MainRouter()
