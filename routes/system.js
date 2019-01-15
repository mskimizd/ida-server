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
    "`id`  int(11) NOT NULL AUTO_INCREMENT ,"+
    "`ranking`  varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL ,"+
    "`shoptype`  varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL ,"+
    "`goodstitle`  varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL ,"+
    "`goodslink`  varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL ,"+
    "`shopkeeper`  varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL ,"+
    "`goodspricen`  float NULL DEFAULT NULL ,"+
    "`goodsexpress`  varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT '' ,"+
    "`customers`  int(11) NULL DEFAULT NULL ,"+
    "`monthsale`  int(11) NULL DEFAULT NULL ,"+
    "`promo`  varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT '' ,"+
    "`shopcity`  varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL ,"+
    "`shopname`  varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL ,"+
    "`reputation`  varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL ,"+
    "`goodsid`  varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT '' ,"+
    "`saleroom`  float NULL DEFAULT NULL ,"+
    "`month`  varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL ,"+
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
