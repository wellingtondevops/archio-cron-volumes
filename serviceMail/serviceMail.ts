import { environment } from '../common/environment'
import sgMail = require("@sendgrid/mail");

export const EmailService = async (to, subject, body) => {
  sgMail.send({
    to: to,
    // from: 'wellington.carvalho@smartscan.com.br',
    from:'suporte@archio.com.br',
    subject: subject,
    html: body,    
  },false, (err) => {
    if(err) console.error(err);
    else console.log("Sent email");
})
}
sgMail.setApiKey(environment.email.sendgridkey)