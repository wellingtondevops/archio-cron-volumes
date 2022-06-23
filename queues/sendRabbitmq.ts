import amqp = require('amqplib/callback_api');
import { environment } from '../common/environment'
const connectionAmqp = environment.urlamqp.amqpurl


const sendRabbitmq = async(queue,iduser, spons,volType, comp, dep, stor,guard,shee,x) => {

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
            id: iduser,
            sponsor: spons,
            volumeType:volType,
            company:comp,
            departament:dep,
            storehouse:stor,
            guardType: guard,
            sheet: shee,
            dataSeet:x

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


  export {sendRabbitmq}