var Excel = require('exceljs');
var moment = require('moment');

var workbook = new Excel.Workbook();
workbook.xlsx.readFile("C:/Users/zhu/Desktop/1.xlsx")
    .then(function () {
        // workbook.eachSheet(function(worksheet,id){
        //     console.log(id)
        // })
        var worksheet = workbook.getWorksheet("data");
        console.log(worksheet.rowCount);
        console.log(worksheet.columnCount);
        // var values = [];
        worksheet.eachRow(function(row ,rownumber){
            if(rownumber<10){
                console.log(rownumber);
                // var valtmp = [];
                row.eachCell(function(cell, colNumber) {
                    // console.log(cell.type);
                    if(cell.type==4){
                        console.log(cell.value);
                        console.log(moment(cell.value).format("YYYYMM"));
                    }
                //     var cval  =  cell.value;
                //     if(typeof cval == "object"){
                //         if(cval.hasOwnProperty('text')){
                //             cval = cval.text;
                //         }else if(cval.hasOwnProperty('result')){
                //             cval = cval.result;
                //         }
                //     }
                //     valtmp.push(cval);
                });
                // values.push(valtmp);
            }
        })
        // console.log(values);
    });