var express = require('express');
var path = require('path');
var multer = require('multer');
var cp = require('child_process');
var moment = require('moment');
var _ = require('lodash');

var router = express.Router();
var upload = multer({ dest: 'uploads/' })

var db = require("../db/index");
// var fieldsMap = require("../conf/fields-map");

/* Upload files */
router.post('/upload', upload.single('file'), async function (req, res, next) {

    var rtn = {};
    var json = {
        upRealname: req.file.originalname,
        upSavename: req.file.filename,
        upPath: req.file.path.replace("\\", "/"),
        upExt: path.extname(req.file.originalname),
        upMinetype: req.file.mimetype,
        upSource: req.body.dataSource.split(',').pop()
    }
    try {
        var rows = await db.insert("sys_upload", json)
        rtn.code = 200;
        rtn.msg = "success";
        rtn.data = rows;
    } catch (err) {
        rtn.code = 300;
        rtn.msg = err;
    }
    res.json(rtn);
    return;
});

/* Get uploaded files */
router.post('/getUploaded', upload.single(), async function (req, res, next) {
    var page = req.body.page;
    var rtn = {};

    if(page === undefined) page = 1;
    var sql = "select * from upload_view order by upTimestamp desc";
    try {
        var rows = await db.query(sql)
        for (var index in rows) {
            rows[index]['upTimestamp'] = moment(rows[index]['upTimestamp']).format("YYYY-MM-DD HH:mm:ss")
        }
        rtn.code = 200;
        rtn.msg = "success";
        rtn.data = {
            total:rows.length,
            rows:_.slice(rows, (parseInt(page)-1)*10, (parseInt(page))*10),
        };
    } catch (err) {
        rtn.code = 300;
        rtn.msg = err;
    }
    res.json(rtn);
    return;

});

/* Get progress of importing file  */
router.post('/getStatus', upload.single(), async function (req, res, next) {
    var upIdList = req.body.upIdList;
    var rtn = {};
    var sql = "select upId, upStatus from sys_upload where upId in (" +upIdList+")";
    try {
        var rows = await db.query(sql)
        rtn.code = 200;
        rtn.msg = "success";
        rtn.data = rows;
    } catch (err) {
        rtn.code = 300;
        rtn.msg = err;
    }
    res.json(rtn);
    return;

});

router.post('/import', upload.single(), async function (req, res, next) {
    var upId = req.body.upId;
    var upPath = req.body.upPath;
    var upSrcTable = req.body.upSrcTable;
    var upSrcClassKey = req.body.upSrcClassKey;
    var rtn = {};

    var cont = false;



    // update file status to 'importing'
    var updateStatusSql = "update sys_upload set upStatus=1 where upid=" + upId;
    try {
        var rows = await db.query(updateStatusSql)
    } catch (err) {
        rtn.code = 300;
        rtn.msg = err;
        res.json(rtn);
        return;
    }

    var cp1 = cp.fork("./external/excel-import.js");
    cp1.send({
        filePath: upPath,
        tableName: upSrcTable,
        // fields: fieldsMap[upSrcClassKey],
        fieldsKey:upSrcClassKey
    });

    cp1.on("exit", function () {
        console.log("导入完成");
        var updateStatusSql = "update sys_upload set upStatus=9 where upid=" + upId;
        db.queryAsync(updateStatusSql, function(err, res){
            if(err) console.log(err);
        })

    })

    rtn.code = 200;
    rtn.msg = "开始导入";
    res.json(rtn);
    return;

});

module.exports = router;
