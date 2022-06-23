
    let _lv = req.body.volumes.map(el => { return el.LOCALIZACAO });
    let lv = [].concat.apply([], _lv)

    let _ref = req.body.volumes.map(el => { return el.REFERENCIA });
    let ref = [].concat.apply([], _ref)


    let vol = []
    let err = []
    let errr = []


    for (let i = 0; lv.length > i; i++) {




      let document = new Volume({
        location: lv[i],
        //description: req.body.description,
        volumeType: req.body.volumeType,
        guardType: req.body.guardType,
        status: "ATIVO",
        storehouse: req.body.storehouse,
        uniqueField: lv[i] + "-" + req.body.storehouse,
        company: req.body.company,
        departament: req.body.departament,
        // comments: req.body.comments,
        // listSeal: req.body.listSeal,
        reference: ref[i],
        author: req.authenticated._id,
        mailSignup: req.authenticated.mailSignup
      });


////futuramente implementar worker

       var v = await Volume.find({
         mailSignup: req.authenticated.mailSignup,
         uniqueField: lv[i] + "-" + req.body.storehouse,
         status: { $ne: "BAIXADO" }
       })
      
      

     
     
 ////futuramente implementar worker

      if (v.length === 0) {
        
        
        vol.push(document)
        document.save().catch(next)
        
        
         console.log("item ok: ", vol.length)
      } else {
        err.push(lv)
        let row = i + 1
        let sheetName = await Sheetvolume.find({ sheet: req.body.sheetName, mailSignup: req.authenticated.mailSignup })
        if (sheetName.length === 0) {
          let documentError = new Sheetvolume({
            sheet: req.body.sheetName,
            mailSignup: req.authenticated.mailSignup,
            logErrors: [
              {
                row: row,
                msgError: "Caixa já cadastrada",
                location: lv[i]
              }
            ]

          })
          documentError.save().catch(next)

        } else {

          let log =
          {

            "row": row,
            "msgError": "Caixa já cadastrada",
            "location": lv[i]
          }

          Sheetvolume.findOneAndUpdate(
            { sheet: req.body.sheetName, mailSignup: req.authenticated.mailSignup },
            { $push: { logErrors: log } },
            function (error, success) {
              if (error) {
                console.log(error);
              } else {

              }
            });

        }
      }
    }

    let sheetErros = ""
    let sheetID = await Sheetvolume.find({ sheet: req.body.sheetName, mailSignup: req.authenticated.mailSignup })
    let _sheetID = sheetID.map(el => { return el._id });

    if (_sheetID.length === 0) {
      sheetErros = "Não foi Registrado Erros"
    } else {

      sheetErros = `/sheetvolumes/excel/${_sheetID[0]}`

    }



    let finish = {
      "Errors": err.length,
      "Imported": vol.length,
      "sheetError": sheetErros
    }
    resp.send(finish)