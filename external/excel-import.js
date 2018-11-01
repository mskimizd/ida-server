var Excel = require('exceljs');
var moment = require('moment');

var db = require("../db/index");
var fieldsMap = require("../conf/fields-map");

console.log(new Date());
var workbook = new Excel.Workbook();

process.on("message", function (msg) {
    var filePath = msg.filePath;
    var tableName = msg.tableName;
    if(msg.fieldsKey=="out"){ // 出货数据 jd和tb不一样
        var fields = fieldsMap[tableName];
    }else{
        var fields = fieldsMap[msg.fieldsKey];
    }
    var fieldsLength = fields.length;
    console.log("[" + new Date() + "] start resolve excel");
    workbook.xlsx.readFile(filePath)
        .then(async function () {
            var lines = [];
            var all = [];
            var worksheet = workbook.getWorksheet("原始数据");
            worksheet.eachRow(function (row, rowNumber) {
                if (rowNumber > 1) {
                    var line = [];
                    row.eachCell({ includeEmpty: true }, function (cell, colNumber) {
                        // console.log(cell.toCsvString()+"  "+cell.type);
                        // console.log(cell);
                        if (colNumber <= fieldsLength) {
                            if (cell.type == 4) {
                                line.push(moment(cell.value).format("YYYYMM"));
                            } else {
                                line.push(cell);
                            }
                        }
                    });

                    var offset = fields.length - line.length;
                    for (var i = offset; i > 0; i--) {
                        line.push("");
                    }
                    lines.push(line);
                    if (rowNumber % 1000 == 0 || rowNumber == worksheet.rowCount) {
                        all.push(lines);
                        lines = [];
                    }
                }
            });

            var lc = 0;
            console.log("[" + new Date() + "] start import data");
            for (var xlines of all) {
                try {
                    // console.log(xlines.length);
                    lc = lc + xlines.length;
                    var progress = Math.ceil(lc * 100 / worksheet.rowCount);
                    var result = await db.batch(tableName, fields, xlines);
                    // var result2 = await db.query("update sys_upload set upProgress=" + progress + " where upid=" + upid)
                } catch (err) {
                    console.log(err);
                }
            }

            console.log("[" + new Date() + "] import data finished");
            process.exit(0);

        });
})

