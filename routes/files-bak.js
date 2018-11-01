var express = require('express');
var path = require('path');
var multer = require('multer');
var Excel = require('exceljs');

var router = express.Router();
var upload = multer({ dest: 'uploads/' })


var db = require("../db/index2");

console.log(db + "!!!");

/* Upload files */
router.post('/upload', upload.single('file'), function (req, res, next) {

    var rtn = {};
    var json = {
        upRealname: req.file.originalname,
        upSavename: req.file.filename,
        upPath: req.file.path.replace("\\", "/"),
        upExt: path.extname(req.file.originalname),
        upMinetype: req.file.mimetype,
        upSource: req.body.dataSource.split(',').pop()
    }

    db.insert("sys_upload", json, function (err, rows) {
        if (err) {
            rtn.code = 300;
            rtn.msg = err;
        } else {
            rtn.code = 200;
            rtn.msg = rows;
        }
        // res.send('respond with a resourcesss');
        res.json(rtn);
    })
});

/* Get uploaded files */
router.post('/getUploaded', upload.single(), async function (req, res, next) {
    var rtn = {};
    var sql = "select * from upload_view order by upTimestamp desc";

    db.query(sql, function (err, rows) {
        if (err) {
            rtn.code = 300;
            rtn.msg = err;
        } else {
            rtn.code = 200;
            rtn.msg = "success";
            rtn.data = rows;
        }
        res.json(rtn);
    });
    });

    /* Get progress of importing file  */
    router.post('/getImportProgress', upload.single(), function (req, res, next) {
        var upid = req.body.fid;
        var rtn = {};
        var sql = "select upProgress from sys_upload where upid=" + upid;
        db.query(sql, function (err, rows) {
            if (err) {
                rtn.code = 300;
                rtn.msg = err;
            } else {
                rtn.code = 200;
                rtn.msg = "success";
                rtn.data = rows[0]['upProgress'];
            }
            res.json(rtn);
        });
    });

    router.post('/import', upload.single(), function (req, res, next) {
        var upid = req.body.upid;
        var up_src = req.body.upsrc;
        var upPath = req.body.filepath;
        var rtn = {};
        var targetDB = null;

        // get import db
        var getDBsql = "select up_src_db from sys_upload_source where up_src='" + up_src + "'";
        console.log(getDBsql);
        db.query(getDBsql, function (err, rows) {
            if (err) {
                rtn.code = 300;
                rtn.msg = err;
                res.json(rtn);
            } else {
                targetDB = rows[0]['up_src_db'];
            }
        });

        // update file status to 'importing'
        var updateStatusSql = "update sys_upload set upStatus=1 where upid=" + upid;
        // console.log(updateStatusSql);
        db.query(updateStatusSql, function (err, rows) {
            if (err) {
                rtn.code = 300;
                rtn.msg = err;
                res.json(rtn);
            } else { }
        });

        // prepare insert
        var fields = ['ranking', 'shoptype', 'goodstitle', 'goodslink', 'shopname', 'shopkeeper', 'reputation', 'shopdsr', 'shopcity', 'goodspriceo', 'goodspricen', 'goodsstock', 'goodsexpress', 'monthsale', 'commentnum', 'goodsinfo', 'saleroom', 'month'];
        var values = [];

        // read excel
        console.log(new Date());
        var workbook = new Excel.Workbook();
        workbook.xlsx.readFile(upPath)
            .then(function () {
                var worksheet = workbook.getWorksheet(1);
                var lastRow = worksheet.lastRow.number;
                worksheet.eachRow(function (row, rnum) {
                    if (rnum > 1) {
                        var valtmp = [];
                        row.eachCell({ includeEmpty: true }, function (cell, colNumber) {
                            var cval = cell.value;
                            if (typeof cval == "object" && cval != null) {
                                // console.log(cval);
                                if (cval.hasOwnProperty('text')) {
                                    cval = cval.text;
                                } else if (cval.hasOwnProperty('result')) {
                                    cval = cval.result;
                                }
                            }
                            valtmp.push(cval);
                        });
                        values.push(valtmp);

                        if (rnum % 1000 == 0 || rnum == lastRow) {
                            db.batch(targetDB, fields, values, function (err, rows) {
                                if (err) {
                                    rtn.code = 300;
                                    rtn.msg = err;
                                    res.json(rtn);
                                } else {
                                    console.log(rnum);
                                }
                            });
                            values = [];
                        }
                    }
                })
                // console.log(new Date());    
                console.log("update sys_upload set upStatus=9 where upid=" + upid);
                db.query("update sys_upload set upStatus=9 where upid="+upid, function (err, rows) {
                    if (err) {
                        console.log(err);
                        rtn.code = 300;
                        rtn.msg = err;
                        res.json(rtn);
                    } else {
                        console.log("asdasdasasasd");
                        rtn.code = 200;
                        rtn.msg = "success";
                        res.json(rtn);
                    }
                }); 
                rtn.code = 200;
                rtn.msg = "success";
                res.json(rtn);

            });

    });

    module.exports = router;
