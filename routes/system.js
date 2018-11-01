var express = require('express');
var router = express.Router();
var db = require("../db/index");
var multer = require('multer');
var multerx = multer();


router.get('/getComps', function (req, res, next) {
  var rtn = {};
  var sql = "SELECT * FROM `sys_upload_source` where upSrcClass = 2 ;";

  db.queryAsync(sql, function (err, rows) {
    // console.log(rows);
    if (err) {
      rtn.code = 300;
      rtn.msg = err;
    } else {
      rtn.code = 200;
      rtn.msg = "success";
      rtn.data = rows;
    }

    res.json(rtn);

  })

});

router.post('/delComp', multerx.single(), async function (req, res, next) {
  var upSrcId = req.body.upSrcId;
  var upSrcTable = req.body.upSrcTable;
  var upSrcStatus = req.body.upSrcStatus;
  var rtn = {};
  var sql = "UPDATE sys_upload_source SET upSrcStatus = "+ upSrcStatus +" WHERE upSrcId = "+upSrcId;

  try {
    var result1 = await db.query(sql);
    // var result2 = await db.queryAsync("DROP TABLE IF EXISTS `" + upSrcTable + "`;");
    rtn.code = 200;
    rtn.msg = "success";
    rtn.data = result1;
    res.json(rtn);
  } catch (err) {
    rtn.code = 300;
    rtn.msg = err;
    res.json(rtn);
  }

});

router.post('/addComp', multerx.single(), async function (req, res, next) {
  var upSrcName = req.body.upSrcName.trim();
  var upSrcKey = req.body.upSrcKey.trim();
  var tableName = "comp_" + upSrcKey;
  var rtn = {};

  var createTableSql =  //"SET FOREIGN_KEY_CHECKS=0;" +
    // "DROP TABLE IF EXISTS `" + tableName + "`;" +
    "CREATE TABLE `" + tableName + "` (" +
    "`id` int(11) NOT NULL AUTO_INCREMENT," +
    "`ranking` varchar(255) DEFAULT NULL," +
    "`shoptype` varchar(255) DEFAULT NULL," +
    "`goodstitle` varchar(255) NOT NULL," +
    "`goodslink` varchar(255) DEFAULT NULL," +
    "`shopname` varchar(255) DEFAULT NULL," +
    "`shopkeeper` varchar(255) DEFAULT NULL," +
    "`reputation` varchar(255) DEFAULT NULL," +
    "`shopdsr` varchar(255) DEFAULT NULL," +
    "`shopcity` varchar(255) DEFAULT NULL," +
    "`goodspriceo` float DEFAULT NULL," +
    "`goodspricen` float DEFAULT NULL," +
    "`goodsstock` int(11) DEFAULT NULL," +
    "`goodsexpress` float DEFAULT NULL," +
    "`monthsale` int(11) DEFAULT NULL," +
    "`commentnum` int(11) DEFAULT NULL," +
    "`goodsinfo` varchar(255) DEFAULT NULL," +
    "`saleroom` float DEFAULT NULL," +
    "`month` varchar(255) DEFAULT NULL," +
    "PRIMARY KEY (`id`)" +
    ") ENGINE=InnoDB DEFAULT CHARSET=utf8;"
    ")";

    // DROP TABLE IF EXISTS `comp_asds`;
    // CREATE TABLE `comp_asds` (
    //   `id` int(11) NOT NULL AUTO_INCREMENT,
    //   PRIMARY KEY (`id`)
    // ) ENGINE=InnoDB DEFAULT CHARSET=utf8;


  var insertData = {
    upSrcName: upSrcName,
    upSrcKey: upSrcKey,
    upSrcTable: tableName,
    upSrcClass: 2,
    upSrcStatus:1
  }

  try {
    var result1 = await db.query(createTableSql);
    var rows = await db.insert("sys_upload_source", insertData)
    rtn.code = 200;
    rtn.msg = "success";
    rtn.data = rows;
    res.json(rtn);
  } catch (err) {
    rtn.code = 300;
    rtn.msg = err;
    res.json(rtn);
  }




})

module.exports = router;
