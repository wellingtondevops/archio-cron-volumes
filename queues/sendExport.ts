import amqp = require('amqplib/callback_api');
import { environment } from '../common/environment'
const connectionAmqp = environment.urlamqp.amqpurl


const sendExport = async(name, email,queue,company, search,storehouse,initDate, endDate,status,location,mailSignup,idUser,doct,departament,profile,finalCurrent,finalIntermediate) => {

    amqp.connect(connectionAmqp, (err, connection) => {
        if (err) {
          throw err;
        }
        console.log("conectado")
        connection.createChannel((err, channel) => {
          if (err) {
            throw err;
          } 
          let data = {

            name:name,
            email:email,
            company:company,
            search:search,
            initDate:initDate||"1900-01-01",
            endDate:endDate||"2900-01-01",
            status:status,
            location:location||"",
            mailSignup:mailSignup,
            idUser:idUser,
            doct:doct||"null",
            storehouse:storehouse||"null",
            departament:departament||"null",
            profile:profile,
            finalCurrent:finalCurrent,
            finalIntermediate: finalIntermediate
            
           

          }
          
          let message = data
          let queueName = queue
  
          channel.assertQueue(queueName, {
            durable: false
          })
          channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)))
          
          setTimeout(() => {
            connection.createChannel(() => { })
          }, 1000)
  
  
        })
      })    
  };


  export {sendExport}