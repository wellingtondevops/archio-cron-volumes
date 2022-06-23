import { Volume } from './volumes.model';

import * as restify from 'restify'
import { NotFoundError, MethodNotAllowedError } from 'restify-errors'
import * as mongoose from 'mongoose'


import { Batch } from '../batches/batches.model';



const  controlVolume =async (params)=>{

       
    //     const data = await Batch.find({_id:params}).select('volume')
    //     const volume = await data.map(el=>{return el.volume}).pop()
 
    //    try {
    //     await Volume.updateOne({_id:volume.toString()},{$set:{closeBox:true}})
           
    //    } catch (error) {
    //        console.log("Erro ao setar closeControl")
           
    //    }

    

 

}

export {controlVolume}