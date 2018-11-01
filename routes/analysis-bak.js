var express = require('express');
var path = require('path');
var multer = require('multer');
var cp = require('child_process');
var moment = require('moment');
var fs = require('fs');
var _ = require('lodash');

var router = express.Router();

var db = require("../db/index");
var multerx = multer()

router.post('/getPlatformSale', multerx.single(), async function (req, res, next) {
    var rtn = {};
    var rawdata = [];
    var shoptypes = [];
    var months = [];
    var monthdata = {};

    try {
        var sqlShoptypeSaleTotal = "SELECT shoptype, sum(monthsale) as monthSaleTotal, sum(saleroom) as saleRoomTotal FROM comp_babycare GROUP BY shoptype ORDER BY saleRoomTotal desc";
        var rowsShoptypeSaleTotal = await db.query(sqlShoptypeSaleTotal);
        shoptypes = rowsShoptypeSaleTotal.map((row) => {
            var rowjson = {
                shoptype: row.shoptype,
                monthSaleTotal:0,
                saleRoomTotal:0,
                // monthSaleTotal: row.monthSaleTotal,
                // saleRoomTotal: row.saleRoomTotal.toFixed(1),
                data: {}
            }
            rawdata.push(rowjson);
            return row.shoptype;
        });

        var sqlMonthSaleTotal = "SELECT sum(monthsale) as monthSaleSum, sum(saleroom) as saleRoomSum, month  FROM comp_babycare GROUP BY month order by month";
        var rowsMonthSaleTotal = await db.query(sqlMonthSaleTotal);
        months = rowsMonthSaleTotal.map((row) => {
            monthdata[row.month] = {
                monthSaleSum: row.monthSaleSum,
                saleRoomSum: row.saleRoomSum.toFixed(0)
            }
            return row.month;
        });

        var sqlShoptypeSale = "SELECT shoptype, sum(monthsale) as monthSaleSum, sum(saleroom) as saleRoomSum, month  FROM comp_babycare GROUP BY shoptype, month order by saleRoomSum desc";
        var rowsShoptypeSale = await db.query(sqlShoptypeSale);
        for (var row of rowsShoptypeSale) {
            var index = _.indexOf(shoptypes, row.shoptype);
            rawdata[index].monthSaleTotal += row.monthSaleSum;
            rawdata[index].saleRoomTotal += row.saleRoomSum;       
            rawdata[index].data[row.month] = {
                monthSaleSum: row.monthSaleSum,
                saleRoomSum: row.saleRoomSum.toFixed(1)
            }
        }

        rtn.code = 200;
        rtn.msg = "success";
        rtn.data = {
            rawdata: _.slice(rawdata, 0, 10),
            shoptypes: _.slice(shoptypes, 0, 10),
            months: _.pull(months, ''),
            monthdata: monthdata
        };
        res.json(rtn);
    } catch (err) {
        console.log(err);
        rtn.code = 300;
        rtn.msg = err;
        res.json(rtn);
    }
});

router.post('/getShopSale', multerx.single(), async function (req, res, next) {
    var rtn = {};
    var rawdata = [];
    var shopkeepers = [];
    var months = [];
    var monthdata = {};

    try {
        var sqlShopSaleTotal = "SELECT shopkeeper, shoptype, sum(monthsale) as monthSaleTotal, sum(saleroom) as saleRoomTotal FROM comp_babycare GROUP BY shopkeeper ORDER BY saleRoomTotal desc";
        var rowsShopSaleTotal = await db.query(sqlShopSaleTotal);
        shopkeepers = rowsShopSaleTotal.map((row) => {
            var rowjson = {
                shopkeeper: row.shopkeeper,
                shoptype: row.shoptype,
                monthSaleTotal:0,
                saleRoomTotal:0,
                // monthSaleTotal: row.monthSaleTotal,
                // saleRoomTotal: row.saleRoomTotal.toFixed(1),
                data: {}
            }
            rawdata.push(rowjson);
            return row.shopkeeper;
        });

        var sqlMonthSaleTotal = "SELECT sum(monthsale) as monthSaleSum, sum(saleroom) as saleRoomSum, month  FROM comp_babycare GROUP BY month order by month";
        var rowsMonthSaleTotal = await db.query(sqlMonthSaleTotal);
        months = rowsMonthSaleTotal.map((row) => {
            monthdata[row.month] = {
                monthSaleSum: row.monthSaleSum,
                saleRoomSum: row.saleRoomSum.toFixed(0)
            }
            return row.month;
        });

        var sqlShopSale = "SELECT shopkeeper, sum(monthsale) as monthSaleSum, sum(saleroom) as saleRoomSum, month  FROM comp_babycare GROUP BY shopkeeper, month order by saleRoomSum desc";
        var rowsShopSale = await db.query(sqlShopSale);
        for (var row of rowsShopSale) {
            var index = _.indexOf(shopkeepers, row.shopkeeper);
            rawdata[index].monthSaleTotal += row.monthSaleSum;
            rawdata[index].saleRoomTotal += row.saleRoomSum;       
            rawdata[index].data[row.month] = {
                monthSaleSum: row.monthSaleSum,
                saleRoomSum: row.saleRoomSum.toFixed(1)
            }
        }

        rtn.code = 200;
        rtn.msg = "success";
        rtn.data = {
            rawdata: _.slice(rawdata, 0, 10),
            shopkeepers: _.slice(shopkeepers, 0, 10),
            months: _.pull(months, ''),
            monthdata: monthdata
        };
        res.json(rtn);
    } catch (err) {
        console.log(err);
        rtn.code = 300;
        rtn.msg = err;
        res.json(rtn);
    }
});

router.post('/getGoodSale', multerx.single(), async function (req, res, next) {
    var rtn = {};
    var rawdata = [];
    var goods = [];
    var months = [];
    var monthdata = {};

    try {
        var sqlGoodSaleTotal = "SELECT goodstitle, goodslink, sum(monthsale) as monthSaleTotal, sum(saleroom) as saleRoomTotal FROM comp_babycare GROUP BY goodslink ORDER BY saleRoomTotal desc";
        var rowsGoodSaleTotal = await db.query(sqlGoodSaleTotal);
        goods = rowsGoodSaleTotal.map((row) => {
            var rowjson = {
                goodstitle: row.goodstitle,
                goodslink: row.goodslink,
                monthSaleTotal:0,
                saleRoomTotal:0,
                data: {}
            }
            rawdata.push(rowjson);
            return row.goodslink;
        });

        var sqlMonthSaleTotal = "SELECT sum(monthsale) as monthSaleSum, sum(saleroom) as saleRoomSum, month  FROM comp_babycare GROUP BY month order by month";
        var rowsMonthSaleTotal = await db.query(sqlMonthSaleTotal);
        months = rowsMonthSaleTotal.map((row) => {
            monthdata[row.month] = {
                monthSaleSum: row.monthSaleSum,
                saleRoomSum: row.saleRoomSum.toFixed(0)
            }
            return row.month;
        });

        var sqlGoodSale = "SELECT goodslink, sum(monthsale) as monthSaleSum, sum(saleroom) as saleRoomSum, month  FROM comp_babycare GROUP BY goodslink, month order by saleRoomSum desc";
        var rowsGoodSale = await db.query(sqlGoodSale);
        for (var row of rowsGoodSale) {
            var index = _.indexOf(goods, row.goodslink);
            rawdata[index].monthSaleTotal += row.monthSaleSum;
            rawdata[index].saleRoomTotal += row.saleRoomSum;       
            rawdata[index].data[row.month] = {
                monthSaleSum: row.monthSaleSum,
                saleRoomSum: row.saleRoomSum.toFixed(1)
            }
        }

        rtn.code = 200;
        rtn.msg = "success";
        rtn.data = {
            rawdata: _.slice(rawdata, 0, 10),
            goods: _.slice(goods, 0, 10),
            months: _.pull(months, ''),
            monthdata: monthdata
        };
        res.json(rtn);
    } catch (err) {
        console.log(err);
        rtn.code = 300;
        rtn.msg = err;
        res.json(rtn);
    }
});

// Deprecated
router.post('/getGoodSale0', multerx.single(), async function (req, res, next) {
    var rtn = {};
    var sql = fs.readFileSync('./db/sql/good-sale.sql');
    sql = sql.toString().replace(/tableName/g, "comp_babycare");
    try {
        var rows = await db.query(sql);

        var rawdata = [];
        var goods = [];
        var months = [];
        for (var row of rows) {
            var index = _.indexOf(goods, row.goodslink);
            if (index == -1) {
                goods.push(row.goodslink);
                var rowjson = {
                    goodslink: row.goodslink,
                    goodstitle: row.goodstitle,
                    monthSaleTotal: row.monthSaleTotal,
                    saleRoomTotal: row.saleRoomTotal.toFixed(1),
                    data: {}
                }
                rowjson.data[row.month] = {
                    monthSaleSum: row.monthSaleSum,
                    saleRoomSum: row.saleRoomSum.toFixed(1)
                }
                rawdata.push(rowjson);
            } else {
                rawdata[index].data[row.month] = {
                    monthSaleSum: row.monthSaleSum,
                    saleRoomSum: row.saleRoomSum.toFixed(1)
                }
            }
            if (_.indexOf(months, row.month) == -1) {
                months.push(row.month);
            }
        }

        rtn.code = 200;
        rtn.msg = "success";
        rtn.data = {
            rawdata: _.slice(rawdata, 0, 10),
            goods: _.slice(goods, 0, 10),
            months: _.pull(months, '')
        };
        res.json(rtn);
    } catch (err) {
        console.log(err);
        rtn.code = 300;
        rtn.msg = err;
        res.json(rtn);
    }
});

// Deprecated
router.post('/getShopSale0', multerx.single(), async function (req, res, next) {
    var rtn = {};
    var sql = fs.readFileSync('./db/sql/shop-sale.sql');
    sql = sql.toString().replace(/tableName/g, "comp_babycare");
    try {
        var rows = await db.query(sql);

        var rawdata = [];
        var shopkeepers = [];
        var months = [];
        for (var row of rows) {
            var index = _.indexOf(shopkeepers, row.shopkeeper);
            if (index == -1) {
                shopkeepers.push(row.shopkeeper);
                var rowjson = {
                    shopkeeper: row.shopkeeper,
                    shoptype: row.shoptype,
                    monthSaleTotal: row.monthSaleTotal,
                    saleRoomTotal: row.saleRoomTotal.toFixed(1),
                    data: {}
                }
                rowjson.data[row.month] = {
                    monthSaleSum: row.monthSaleSum,
                    saleRoomSum: row.saleRoomSum.toFixed(1)
                }
                rawdata.push(rowjson);
            } else {
                rawdata[index].data[row.month] = {
                    monthSaleSum: row.monthSaleSum,
                    saleRoomSum: row.saleRoomSum.toFixed(1)
                }
            }
            if (_.indexOf(months, row.month) == -1) {
                months.push(row.month);
            }
        }

        rtn.code = 200;
        rtn.msg = "success";
        rtn.data = {
            rawdata: _.slice(rawdata, 0, 10),
            shopkeepers: _.slice(shopkeepers, 0, 10),
            months: _.pull(months, '')
        };
        res.json(rtn);
    } catch (err) {
        console.log(err);
        rtn.code = 300;
        rtn.msg = err;
        res.json(rtn);
    }
});


module.exports = router;
