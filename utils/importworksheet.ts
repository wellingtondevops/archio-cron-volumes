import { Worksheet } from '../worksheets/worksheets.model';
var XLSX = require('xlsx')


const  saveSheet=async (xlData,idSheet,company,doct,headers,sponsor,idus)=>{
    for (let i = 0; xlData.length > i; i++) {
        let sub = ' - '

        let field = Object.values(xlData[i]).toString()
        let newfield = field.replace(',', ' - ')

        var term = newfield
        var replaceList = {
            1: "one ",
            2: "two ",
            3: "three ",
            4: "four ",
            5: "five ",
            6: "six ",
            7: "seven ",
            8: "eight ",
            9: "nine ",
            0: "zero "
        };
        let listChange = term.replace(/0|1|2|3|4|5|6|7|8|9/gi, function (item) {
            let it = replaceList[item];
            let itemLista = it.replace(/(?:^|\s)\S/g, function (element) { return element });
            return itemLista;
        });



        let document = new Worksheet({
            sheetName: idSheet,
            company: company,
            doct: doct,
            fieldSearch:listChange,
            Columns: headers,
            fieldColumns: Object.values(xlData[i]),
            mailSignup: sponsor,
            author: idus
        })

         document.save()

    }
   
}

export {saveSheet}