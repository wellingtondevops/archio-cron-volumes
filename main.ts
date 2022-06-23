

import { Server } from './server/server'
import { usersRouter } from './users/users.router'
import { companiesRouter } from './companies/companies.router'
import { storehousesRouter } from './storehouses/storehouses.router'
import { volumesRouter } from './volumes/volumes.router'
import { doctsRouter } from './docts/docts.router'
import { archivesRouter } from './archives/archives.router'
import { departamentsRouter} from './departaments/departaments.router'
import { listcompaniesRouter } from './listcompanies/listcompanies.router'
import { liststorehousesRouter } from './liststorehouses/liststorehouses.router'
import { mainRouter } from './main.router'
import { picturesRouter } from './pictures/pictures.router'
import { listdoctsRouter } from './listdocts/listdocts.router'
import {listvolumesRouter} from './listvolumes/listvolumes.router'
import { listregistersRouter } from './listregisters/listregisters.router'
import {listdepartamentsRouter} from './listdepartaments/listdepartaments.router'
import {templatesRouter} from './templates/templates.router'
import {signupsRouter} from './signups/singnups.router'
import {auditsRouter} from './audits/audits.router'
import {sheetarchivesRouter} from './sheetarchives/sheetarchives.router'
import {sheetvolumesRouter} from './sheetvolumes/sheetvolumes.router'
import {menuServicesRouter} from './menuservices/menuservices.router'
import {companyServicesRouter} from './companyservices/companyservices.router'
import {profilesRouter} from './profiles/profiles.router'
import {exportArchivesRouter} from './exportarchives/exportarchives.router'
import { reducedepartamentsRouter } from './reducedepartaments/reducedepartaments.router'
import { reducededocumentsRouter } from './reducedocuments/reducedocuments.router'
import { demandsRouter} from './demands/demands.router'
import {listrequestersRouter} from './listrequesters/listrequesters.router'
import { positionRouter } from './positions/positions.router'
import { notifierRouter } from './notifiers/notifiers.router'
import { batchesRouter } from './batches/batches.router'
import { worksheetsRouter} from './worksheets/worksheets.router'
import { sheetnamesRouter } from './sheetnames/sheetnames.router'
import { accessProfilesRouter} from './accessprofiles/accessprofiles.router'
import { userPermissionsRouter } from './userpermissions/userpermissions.router'
import { emailRouter} from './emails/emails.router'







const server = new Server()
server.bootstrap([
  usersRouter,
  accessProfilesRouter,
  userPermissionsRouter,
  companiesRouter,
  templatesRouter,  
  listcompaniesRouter,
  liststorehousesRouter,
  listdepartamentsRouter,
  listvolumesRouter,    
  storehousesRouter,
  volumesRouter,
  doctsRouter,
  departamentsRouter,
  archivesRouter,
  picturesRouter,  
  listdoctsRouter,
  listregistersRouter,
  signupsRouter,
  auditsRouter, 
  sheetarchivesRouter, 
  sheetvolumesRouter, 
  profilesRouter,
  menuServicesRouter,
  companyServicesRouter,
  exportArchivesRouter, 
  reducededocumentsRouter,
  reducedepartamentsRouter,
  demandsRouter,
  listrequestersRouter, 
  positionRouter, 
  batchesRouter,
  notifierRouter,
  worksheetsRouter,
  sheetnamesRouter,
  mainRouter,
  emailRouter

]).then(server => {
  
  console.log(`Worker ${process.pid} started `);
}).catch(error => {
  console.log('👻 Server failed to start 👻')
  console.error(error)
  process.exit(1)
})
