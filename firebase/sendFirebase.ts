import {environment} from "../common/environment"
const admin = require('firebase-admin')



admin.initializeApp({
  credential: admin.credential.cert({
    "type": environment.firebase.type,
    "project_id": environment.firebase.project_id,
    "private_key_id": environment.firebase.private_key_id,
    "private_key": environment.firebase.private_key,
    "client_email": environment.firebase.client_email,
    "client_id": environment.firebase.client_id,
    "auth_uri": environment.firebase.auth_uri,
    "token_uri": environment.firebase.token_uri,
    "auth_provider_x509_cert_url": environment.firebase.auth_provider_x509_cert_url,
    "client_x509_cert_url": environment.firebase.client_x509_cert_url
  }),
  databaseURL: environment.firebase.databaseURL
});
const db =  admin.database();


const  sendFirebase= async (titleSend,msg,user,mailSignup)=>{





      const newNotification = {
        title: titleSend,
        msg: msg,
        linkIcon: "",
        attachment: "",
        user: 'email-'+user.toString(),
        mailSignup: mailSignup,
        active: true,
        dateCreated: Date.now()
      }
     await db.ref('notifications').push(newNotification)
  

   
   
}

export {sendFirebase}