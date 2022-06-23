

import { Volume } from "../volumes/volumes.model"

const  setCronVolumes=async (volumes)=>{

    try {
      for (const item of volumes) {
        
           await  Volume.updateOne({_id:item},
            {$set:{cron:true}}
            )

      }
        
    } catch (error) {
        console.log(`ERRO AO AUTUALIZAR VOLUME FLAG CRON: ${error}`)
    }
   
}

export {setCronVolumes}