import * as jestCli from 'jest-cli'
import * as fs from 'fs'

import {Server} from './server/server'
import {environment} from './common/environment'
import {usersRouter} from './users/users.router'
import {companiesRouter} from './companies/companies.router'
import {storehousesRouter} from './storehouses/storehouses.router'
import {volumesRouter} from './volumes/volumes.router'
import {doctsRouter} from './docts/docts.router'
import {archivesRouter} from './archives/archives.router'
import { User } from './users/users.model';
import { Company } from './companies/companies.model';
import { Doct } from './docts/docts.model';
import { Volume } from './volumes/volumes.model';
import { Archive } from './archives/archives.model';

let server: Server
const beforeAllTests = ()=>{
  environment.db.url = process.env.DB_URL || 'mongodb://earchivedb:$enh434rch1v3@ds119755.mlab.com:19755/earchive'
  environment.server.port = process.env.SERVER_PORT || 3001
  server = new Server()
  return server.bootstrap([
    usersRouter
    
  ])
  .then(()=>User.remove({}).exec())
  .then(()=>{
    let admin = new User()
    admin.name = 'super'
    admin.email = 'super@super.com'
    admin.password = '1234567'
    admin.profiles = ['DAENERYS']
    return admin.save()
  })
  
  
}

const afterAllTests = ()=>{
  return server.shutdown()
}

beforeAllTests()
.then(()=>jestCli.run())
.then(()=>afterAllTests())
.catch(error=>{
  console.error(error)
  process.exit(1)
})
