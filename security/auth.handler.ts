import * as restify from 'restify'
import * as jwt from 'jsonwebtoken'
import { NotAuthorizedError } from 'restify-errors'
import { User } from '../users/users.model'
import { environment } from '../common/environment'
import { Profile } from '../profiles/profiles.model'
import * as mongoose from 'mongoose'
import * as ms from 'ms'

// const sgMail = require('@sendgrid/mail');

// sgMail.setApiKey(environment.email.sendgridkey)

export const authenticate: restify.RequestHandler = (req, resp, next) => {
  const { email, password } = req.body
  User.findByEmail(email, '+password') //1st
    .then(async user => {
      if (user && user.matches(password.trim())) { //2nd
        //gerar o token
        //3rd
        // const token = jwt.sign({ sub: user.email, iss: 'archio-api',exp: Math.floor(Date.now() / 1000) + (60 * 60)},
        const token = jwt.sign({ sub: user.email, iss: 'archio-api'},
          environment.security.apiSecret)

        let pr = await Profile.find({ "_id": mongoose.Types.ObjectId(user.profile) })
        let write = pr.map(el => { return el.write }).toString()
        let read = pr.map(el => { return el.read }).toString()
        let change = pr.map(el => { return el.change }).toString()
        let del = pr.map(el => { return el.delete }).toString()
        // let controllBox =pr.map(el=>{return el.controllBox}).toString()
        let requesters = pr.map(el => { return el.requesters }).toString()
        let storehouses = pr.map(el => { return el.storehouses }).toString()
        let companies = pr.map(el => { return el.companies }).toString()
        let departaments = pr.map(el => { return el.departaments }).toString()
        let volumes = pr.map(el => { return el.volumes }).toString()
        let documents = pr.map(el => { return el.documents }).toString()
        let archives = pr.map(el => { return el.archives }).toString()
        let archivesImport = pr.map(el => { return el.archivesImport }).toString()
        let archivesError = pr.map(el => { return el.archivesError }).toString()
        let archivesRegister = pr.map(el => { return el.archivesRegister }).toString()
        let users = pr.map(el => { return el.users }).toString()
        let templates = pr.map(el => { return el.templates }).toString()
        let volumesError = pr.map(el=>{return el.volumesError}).toString() 
        let volumesImport = pr.map(el=>{return el.volumesImport}).toString() 
        let moves = pr.map(el=>{return el.moves}).toString() 
        let searchDemand = pr.map(el=>{return el.searchDemand}).toString() 
        let newDemand = pr.map(el=>{return el.newDemand}).toString() 
        let showDemand = pr.map(el=>{return el.showDemand}).toString() 
        let externalUser = pr.map(el=>{return el.profileExternal}).toString()
        let startcurrentdate = pr.map(el=>{return el.startcurrentdate}).toString()
        let companyServices = pr.map(el=>{return el.companyServices}).toString()
        let menuServices = pr.map(el=>{return el.menuServices}).toString()
        let reports = pr.map(el=>{return el.reports}).toString()
        let totalcollection = pr.map(el=>{return el.totalcollection}).toString()
        let scanning =pr.map(el=>{return el.scanning}).toString()
        let simpleArchives=pr.map(el=>{return el.simpleArchives}).toString()
        let accessprofiles =pr.map(el=>{return el.accessProfiles}).toString()
        let archivesSearch= pr.map(el=>{return el.archivesSearch}).toString()

        
  


        resp.json({
          name: user.name, id: user._id, 
          email: user.email,
          profile: user.profiles,
          theme: user.theme,
          accessToken: token,
          acceptanceTerm: user.acceptanceTerm,
          userExternal:JSON.parse(externalUser),
          actions: [{
            write: JSON.parse(write),
            read: JSON.parse(read),
            change: JSON.parse(change),
            delete: JSON.parse(del),
            print: user.print,
            download: user.download,
            controllBox:user.controllBox
          }],
          routes:[{
            requesters: JSON.parse(requesters),
            accessprofiles: JSON.parse(accessprofiles),
            storehouses: JSON.parse(storehouses),
            storehousesShow: JSON.parse(storehouses),
            companies: JSON.parse(companies),
            companiesShow: JSON.parse(companies),
            departaments: JSON.parse(departaments),
            departamentsShow: JSON.parse(departaments),
            volumesSearch: JSON.parse(volumes),
            volumes: JSON.parse(volumes),
            volumeShow:JSON.parse(volumes),
            volumesError:JSON.parse(volumesError),
            volumesImport:JSON.parse(volumesImport),
            documents: JSON.parse(documents),
            documentsShow: JSON.parse(documents),
            archivesSearch: JSON.parse(archivesSearch),
            archives: JSON.parse(archives),
            archivesShow: JSON.parse(archives),
            archivesImport: JSON.parse(archivesImport),
            archivesError: JSON.parse(archivesError),
            archivesRegister: JSON.parse(archivesRegister),
            users: JSON.parse(users),
            userShow:JSON.parse(users),
            templates: JSON.parse(templates),
            templatesShow: JSON.parse(templates),
            moves:JSON.parse(moves),
            searchDemand:JSON.parse(searchDemand),
            newDemand:JSON.parse(newDemand),
            showDemand:JSON.parse(showDemand),
            startcurrentdate:JSON.parse(startcurrentdate),
            companyServices:JSON.parse(companyServices),
            companyServicesShow:JSON.parse(companyServices),
            menuServices:JSON.parse(menuServices),
            menuServicesShow:JSON.parse(menuServices),
            reports:JSON.parse(reports),
            totalcollection:JSON.parse(totalcollection),
            scanning:JSON.parse(scanning),
            simpleArchives:JSON.parse(simpleArchives)
          }]
        })

      } else {
        return next(new NotAuthorizedError('Email o Password incorreto!'))
      }
    }).catch(next)
}
