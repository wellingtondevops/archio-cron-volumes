import { Worksheet } from '../worksheets/worksheets.model';
var XLSX = require('xlsx')


const  searchworksheet =async (term,docu)=>{
   
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
        let itemLista = it.replace(/(?:^|\s)\S/g, function (elemento) { return elemento });
        return itemLista;
    });
    let result = await Worksheet.aggregate([

        {
            "$search": {
                "autocomplete": {
                    "query": `${listChange}`,
                    "path": "fieldSearch",

                    "fuzzy": {
                        "maxEdits": 1
                    }
                }
            },
        },
        {
            $project: {
                fieldSearch: 1,
                fieldColumns: 1,
                doct: 1,
                score: { $meta: "searchScore" }
            }
        },

        { $limit: 10 }
    ])


    let data = [];

    

    for (var i = 0; i < result.length; i++) {

        let a = []
        a.push(result[i])
        let dc = await a.map(el => { return el.doct }).toString()
        if (dc === docu) {
            data.push(result[i]);

        } else {
            console.log("deu ruim")
        }
    }
    
   return data
}

export {searchworksheet}