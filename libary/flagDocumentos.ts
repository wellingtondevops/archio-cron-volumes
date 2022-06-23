
import { Doct } from '../docts/docts.model';

const  setCronDocuments=async (documentId)=>{

    try {
       await Doct.updateOne({_id:documentId},{$set:{cron:true}})
    } catch (error) {
        console.log(`ERRO AO AUTUALIZAR DOCUMENTO FLAG CRON: ${error}`)
    }
   
}

export {setCronDocuments}