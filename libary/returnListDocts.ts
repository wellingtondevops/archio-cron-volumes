
import { AccessProfiles } from '../accessprofiles/accessprofiles.model';

import { UserPermissions } from '../userpermissions/userpermissions.model';

const  returnDocts= async (user)=>{

  

    let datas = await UserPermissions.find({ user: user })
        let docs = datas.map(el => { return el.docts })
        let docsPerfil = [].concat.apply([], docs);

        let aacessprofiles = datas.map(el => { return el.accessprofiles })
        let acessprofile = [].concat.apply([], aacessprofiles);
        let auxiddocacess = []
        for (const idprof of acessprofile) {
          const idp = idprof
          const ids = await AccessProfiles.find({ _id: idp }).select("docts")

          let docPs = ids.map(el => { return el.docts })

          auxiddocacess.push(...docPs)
        }

        let docsAcess = [].concat.apply([], auxiddocacess)

           const  docsGeralUser = docsPerfil.concat(docsAcess)
        return  docsGeralUser



   
   
}


// const  returnCompany= async (user)=>{

  

//     let datas = await UserPermissions.find({ user: user })
//         let docs = datas.map(el => { return el.docts })
//         let docsPerfil = [].concat.apply([], docs);

//         let aacessprofiles = datas.map(el => { return el.accessprofiles })
//         let acessprofile = [].concat.apply([], aacessprofiles);
//         let auxiddocacess = []
//         for (const idprof of acessprofile) {
//           const idp = idprof
//           const ids = await AccessProfiles.find({ _id: idp }).select("docts")

//           let docPs = ids.map(el => { return el.docts })

//           auxiddocacess.push(...docPs)
//         }

//         let docsAcess = [].concat.apply([], auxiddocacess)

//            const  docsGeralUser = docsPerfil.concat(docsAcess)
//         return  docsGeralUser



   
   
// }

export {returnDocts}