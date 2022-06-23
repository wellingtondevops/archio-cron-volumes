

import { Departament } from '../departaments/departaments.model';

const  setCronDepartaments=async (departamentId)=>{

    try {
      await  Departament.updateOne({_id:departamentId},{$set:{cron:true}})
        
    } catch (error) {
        console.log(`ERRO AO AUTUALIZAR DEPARTAMENTO FLAG CRON: ${error}`)
    }
   
}

export {setCronDepartaments}