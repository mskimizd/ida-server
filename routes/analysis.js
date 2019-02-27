var express = require('express');
var path = require('path');
var multer = require('multer');
var cp = require('child_process');
var moment = require('moment');
var fs = require('fs');
var _ = require('lodash');
var NodeCache = require( "node-cache" );
var md5 = require('md5');


var router = express.Router();

var db = require("../db/index");
var multerx = multer();
var myCache = new NodeCache({stdTTL: 604800}); // 7 * 24 * 3600

// console.log(moment(Date.now()).format("YYYY-MM-DD HH:mm:ss'"))
// myCache.set( "ttlKey", "MyExpireData" )

// ts = myCache.getTtl( "ttlKey" )
// console.log(moment(ts).format("YYYY-MM-DD HH:mm:ss'"));

// console.log(md5("asdasdasdasdasd"))


//
router.post('/dataAmountTotal', multerx.single(), async function (req, res, next) {
    var rtn = {};

    res.header('Access-Control-Allow-Credentials', true);

    console.log(req);

    console.log(req.isAuthenticated());

    res.json(rtn);


    // try {
    //     var compsql = "SELECT * FROM `sys_upload_source` where upSrcClass = 2 ;";
    //     var comps = await db.query(compsql);
    //     var statsql = "SELECT SUM(a) as t from ( SELECT COUNT(*)  a FROM ind_industry ";
    //     var compcount = 0;
    //     for(var comp of comps){
    //         var tmpsql = " UNION ALL SELECT COUNT(*)  a FROM "+ comp.upSrcTable +" ";
    //         statsql = statsql + tmpsql;
    //         compcount = compcount + 1;
    //     }
    //     statsql = statsql + ") as aa";
    //     var rowStats = await db.query(statsql);
    //     rtn.code = 200;
    //     rtn.msg = "success";
    //     rtn.data = {
    //         total:rowStats[0].t,
    //         comps:compcount,
    //         platform:2,
    //     };
    //     res.json(rtn);
    // } catch (err) {
    //     console.log(err);
    //     rtn.code = 300;
    //     rtn.msg = err;
    //     res.json(rtn);
    // }
});


router.post('/dataAmountPerMonth', multerx.single(), async function (req, res, next) {
    var rtn = {};
    res.json(rtn);

    // try {
    //     var compsql = "SELECT * FROM `sys_upload_source` where upSrcClass = 2 ;";
    //     var comps = await db.query(compsql);
    //     var statsql = "SELECT SUM(amount) as amount, month from ( SELECT COUNT(*)  as amount , month  FROM ind_industry group by month ";
    //     var compcount = 0;
    //     for(var comp of comps){
    //         var tmpsql = " UNION ALL SELECT COUNT(*) as amount , month  FROM "+ comp.upSrcTable +" group by month";
    //         statsql = statsql + tmpsql;
    //         compcount = compcount + 1;
    //     }
    //     statsql = statsql + ") as aa group by month";
    //     var monthdata = await db.query(statsql);
    //     rtn.code = 200;
    //     rtn.msg = "success";
    //     rtn.data = {
    //         monthdata: _.reject(monthdata,{month:""}),
    //     };
    //     res.json(rtn);
    // } catch (err) {
    //     console.log(err);
    //     rtn.code = 300;
    //     rtn.msg = err;
    //     res.json(rtn);
    // }
});

// 带缓存
router.post('/industry', multerx.single(), async function (req, res, next) {
    var sortKey = req.body.key;
    var sortType = req.body.type;
    var limit = req.body.limit;
    var tableName = req.body.table;
    var monthsList = req.body.months;

    var rtn = {};
    var rawdata = [];
    var classcomb = [];
    var months = [];

    var monthCondition = "";
    if (monthsList !== "") {
        monthCondition = "where month in (" + monthsList + ")";
    } else {
        monthCondition = " where month <>'' ";
    }

    try {
        // 数据获取
        var sqlClass = " SELECT largeclass, smallclass, sum(monthsale) as monthSaleSum, sum(saleroom) as saleRoomSum, avg(goodspricen) as priceAvg,  month  FROM  " + tableName + " " + monthCondition + "  GROUP BY largeclass, smallclass, month  ORDER BY largeclass";
        
        var cacheKey = "ind_industry_"+md5(sqlClass);
        cacheResult = myCache.get(cacheKey);
        if ( cacheResult == undefined ){
            console.log("query");
            var rowsClass = await db.query(sqlClass);
            for (var row of rowsClass) {
                var classkey = (row.largeclass + row.smallclass).toUpperCase();
                var index = _.indexOf(classcomb, classkey);
                var saleRoomSum = parseFloat(row.saleRoomSum);
                var monthSaleSum = parseInt(row.monthSaleSum);
                var priceAvg = parseFloat(row.priceAvg);
                if (index == -1) {
                    classcomb.push(classkey);
                    var rowjson = {
                        largeclass: row.largeclass,
                        smallclass: row.smallclass,
                        monthSaleTotal: monthSaleSum,
                        saleRoomTotal: saleRoomSum,
                        priceAvg: priceAvg,
                        data: {}
                    }
                    rowjson.data[row.month] = {
                        monthSaleSum: monthSaleSum,
                        saleRoomSum: parseFloat(saleRoomSum.toFixed(1)),
                        priceAvg: parseFloat(priceAvg.toFixed(1))
                    }
                    rawdata.push(rowjson);
                } else {
                    rawdata[index].monthSaleTotal += monthSaleSum;
                    rawdata[index].saleRoomTotal += saleRoomSum;
                    rawdata[index].priceAvg += priceAvg;
                    rawdata[index].data[row.month] = {
                        monthSaleSum: monthSaleSum,
                        saleRoomSum: parseFloat(saleRoomSum.toFixed(1)),
                        priceAvg: parseFloat(priceAvg.toFixed(1))
                    }
                }
                if (_.indexOf(months, row.month) == -1) {
                    months.push(row.month);
                }
            } 

            for (var i in rawdata) {
                var len = Object.keys(rawdata[i].data).length;
                rawdata[i].priceAvg = parseFloat((rawdata[i].priceAvg / len).toFixed(1));
            }

            months = _.pull(months, '');
            months = _.sortBy(months, function (n) {
                return n
            });

            rtn.code = 200;
            rtn.msg = "success";
            rtn.data = {
                rawdata: _.slice(rawdata, 0, limit),
                classcomb: _.slice(classcomb, 0, limit),
                months: months
            };
            
            myCache.set(cacheKey, rtn.data);
        }else{
            console.log("cache");
            rtn.code = 200;
            rtn.msg = "success";
            rtn.data = cacheResult;
        }

        res.json(rtn);
    } catch (err) {
        console.log(err);
        rtn.code = 300;
        rtn.msg = err;
        res.json(rtn);
    }
});

// ################################ 上：行业 分割线 下：竞品 ##############################

router.post('/overview', multerx.single(), async function (req, res, next) {
    var monthsList = req.body.months;
    var rtn = {};
    var monthCondition = "";
    if (monthsList !== "") {
        monthCondition = "where month in (" + monthsList + ")";
    } else {
        monthCondition = "where month <>''";
    }

    try {
        var tmp = [];
        var data = [];
        var compsql = "SELECT upSrcKey, upSrcTable FROM `sys_upload_source` where upSrcClass = 2 and upSrcStatus =1;";
        var comps = await db.query(compsql);
        for(var comp of comps){
            var sql = "SELECT month, sum(monthsale) as monthSaleSum, sum(saleroom) as saleRoomSum FROM "+ comp.upSrcTable +"  " + monthCondition + " GROUP BY month ORDER BY month; ";
            var rows = await db.query(sql);
            for (var row of rows) {
                var index = _.indexOf(tmp, row.month);
                if (index == -1) {
                    tmp.push(row.month);
                    var rowjson = {
                        month: row.month
                    }
                    rowjson[comp.upSrcKey] = row.saleRoomSum;
                    data.push(rowjson);
                } else {
                    data[index][comp.upSrcKey] = row.saleRoomSum;
                }
            }
        }

        rtn.code = 200;
        rtn.msg = "success";
        rtn.data = {
            monthList: tmp,
            monthData: data
        };
        res.json(rtn);
    } catch (err) {
        console.log(err);
        rtn.code = 300;
        rtn.msg = err;
        res.json(rtn);
    }

});

router.post('/stats', multerx.single(), async function (req, res, next) {
    var tableName = req.body.table;
    var monthsList = req.body.months;
    var rtn = {};

    try {
        var monthCondition = "where month in (" + monthsList + ")";
        var sqlStats = "SELECT sum(monthsale) as monthSaleSum, sum(saleroom) as saleRoomSum FROM  " + tableName + " " + monthCondition;
        var rowStats = await db.query(sqlStats);
        rtn.code = 200;
        rtn.msg = "success";
        rtn.data = rowStats[0];
        res.json(rtn);
    } catch (err) {
        console.log(err);
        rtn.code = 300;
        rtn.msg = err;
        res.json(rtn);
    }
});

router.post('/month', multerx.single(), async function (req, res, next) {
    var tableName = req.body.table;
    var rtn = {};
    try {
        var sqlMonth = "SELECT month FROM  " + tableName + "  where month <>'' GROUP BY month";
        var rowMonths = await db.query(sqlMonth);
        rtn.code = 200;
        rtn.msg = "success";
        rtn.data = rowMonths.map(item => item["month"]);
        res.json(rtn);
    } catch (err) {
        console.log(err);
        rtn.code = 300;
        rtn.msg = err;
        res.json(rtn);
    }
});

router.post('/monthSale', multerx.single(), async function (req, res, next) {
    var tableName = req.body.table;
    var monthsList = req.body.months;
    var rtn = {};
    try {
        var monthCondition = "where month in (" + monthsList + ")";
        var sqlMonthSale = "SELECT month, sum(monthsale) as monthSaleSum, sum(saleroom) as saleRoomSum FROM " + tableName + " " + monthCondition + "  GROUP BY month ORDER BY month;";
        var rowMonthSale = await db.query(sqlMonthSale);
        rtn.code = 200;
        rtn.msg = "success";
        rtn.data = rowMonthSale;
        res.json(rtn);
    } catch (err) {
        console.log(err);
        rtn.code = 300;
        rtn.msg = err;
        res.json(rtn);
    }
});

// 带缓存
router.post('/platformSale', multerx.single(), async function (req, res, next) {
    var sortKey = req.body.key;
    var sortType = req.body.type;
    var limit = req.body.limit;
    var tableName = req.body.table;
    var monthsList = req.body.months;

    var rtn = {};
    var rawdata = [];
    var shoptypes = [];
    var months = [];

    try {
        var monthCondition = "where month in (" + monthsList + ")";
        var sqlShoptypeSale = "SELECT shoptype, sum(monthsale) as monthSaleSum, sum(saleroom) as saleRoomSum, month  FROM  " + tableName + " " + monthCondition + " GROUP BY shoptype, month ";

        var cacheKey = tableName+"_"+md5(sqlShoptypeSale);
        cacheResult = myCache.get(cacheKey);
        if ( cacheResult == undefined ){
            var rowsShoptypeSale = await db.query(sqlShoptypeSale);
            for (var row of rowsShoptypeSale) {
                var index = _.indexOf(shoptypes, row.shoptype);
                var saleRoomSum = parseFloat(row.saleRoomSum);
                var monthSaleSum = parseInt(row.monthSaleSum);
                if (index == -1) {
                    shoptypes.push(row.shoptype);
                    var rowjson = {
                        shoptype: row.shoptype,
                        monthSaleTotal: monthSaleSum,
                        saleRoomTotal: saleRoomSum,
                        data: {}
                    }
                    rowjson.data[row.month] = {
                        monthSaleSum: monthSaleSum,
                        saleRoomSum: parseFloat(saleRoomSum.toFixed(1))
                    }
                    rawdata.push(rowjson);
                } else {
                    rawdata[index].monthSaleTotal += monthSaleSum;
                    rawdata[index].saleRoomTotal += saleRoomSum;
                    rawdata[index].data[row.month] = {
                        monthSaleSum: monthSaleSum,
                        saleRoomSum: parseFloat(saleRoomSum.toFixed(1))
                    }
                }
                if (_.indexOf(months, row.month) == -1) {
                    months.push(row.month);
                }
            }
    
            // 排序
            rawdata = _.sortBy(rawdata, function (item) {
                if (sortType == "desc") {
                    return -item[sortKey];
                } else if (sortType == "asc") {
                    return item[sortKey];
                } else {
                    return -item.saleRoomTotal;
                }
            });
            months = _.pull(months, '');
            months = _.sortBy(months, function (n) {
                return n
            });
    
            rtn.code = 200;
            rtn.msg = "success";
            rtn.data = {
                rawdata: _.slice(rawdata, 0, limit),
                shoptypes: _.slice(shoptypes, 0, limit),
                months: _.pull(months, '')
            };
            
            myCache.set(cacheKey,rtn.data);
        }else{
            rtn.code = 200;
            rtn.msg = "success";
            rtn.data = cacheResult;
        }


        res.json(rtn);
    } catch (err) {
        console.log(err);
        rtn.code = 300;
        rtn.msg = err;
        res.json(rtn);
    }
});

router.post('/shopSale', multerx.single(), async function (req, res, next) {
    var sortKey = req.body.key;
    var sortType = req.body.type;
    var limit = req.body.limit;
    var tableName = req.body.table;
    var monthsList = req.body.months;

    var rtn = {};
    var rawdata = [];
    var shopkeepers = [];
    var months = [];

    try {
        // 数据获取
        var monthCondition = "where month in (" + monthsList + ")";
        var sqlShopSale = "SELECT shopkeeper, shoptype, sum(monthsale) as monthSaleSum, sum(saleroom) as saleRoomSum, month  FROM  " + tableName + " " + monthCondition + "  GROUP BY shopkeeper, month";
        
        var cacheKey = tableName+"_"+md5(sqlShopSale);
        cacheResult = myCache.get(cacheKey);
        if ( cacheResult == undefined ){

            var rowsShopSale = await db.query(sqlShopSale);
            for (var row of rowsShopSale) {
                var index = _.indexOf(shopkeepers, row.shopkeeper);
                var saleRoomSum = parseFloat(row.saleRoomSum);
                var monthSaleSum = parseInt(row.monthSaleSum);
                if (index == -1) {
                    shopkeepers.push(row.shopkeeper);
                    var rowjson = {
                        shopkeeper: row.shopkeeper,
                        shoptype: row.shoptype,
                        monthSaleTotal: monthSaleSum,
                        saleRoomTotal: saleRoomSum,
                        data: {}
                    }
                    rowjson.data[row.month] = {
                        monthSaleSum: monthSaleSum,
                        saleRoomSum: parseFloat(saleRoomSum.toFixed(1))
                    }
                    rawdata.push(rowjson);
                } else {
                    rawdata[index].monthSaleTotal += monthSaleSum;
                    rawdata[index].saleRoomTotal += saleRoomSum;
                    rawdata[index].data[row.month] = {
                        monthSaleSum: monthSaleSum,
                        saleRoomSum: parseFloat(saleRoomSum.toFixed(1))
                    }
                }
                if (_.indexOf(months, row.month) == -1) {
                    months.push(row.month);
                }
            }
    
            // 排序
            rawdata = _.sortBy(rawdata, function (item) {
                if (sortType == "desc") {
                    return -item[sortKey];
                } else if (sortType == "asc") {
                    return item[sortKey];
                } else {
                    return -item.saleRoomTotal;
                }
            });
            months = _.pull(months, '');
            months = _.sortBy(months, function (n) {
                return n
            });
    
            rtn.code = 200;
            rtn.msg = "success";
            rtn.data = {
                rawdata: _.slice(rawdata, 0, limit),
                shopkeepers: _.slice(shopkeepers, 0, limit),
                months: months
            };   
            
            myCache.set(cacheKey, rtn.data);
        }else{
            rtn.code = 200;
            rtn.msg = "success";
            rtn.data = cacheResult;            
        }        

        res.json(rtn);
    } catch (err) {
        console.log(err);
        rtn.code = 300;
        rtn.msg = err;
        res.json(rtn);
    }
});

/*router.post('/goodSale', multerx.single(), async function (req, res, next) {
    var sortKey = req.body.key;
    var sortType = req.body.type;
    var limit = req.body.limit;
    var tableName = req.body.table;
    var monthsList = req.body.months;

    var rtn = {};
    var rawdata = [];
    var goods = [];
    var months = [];

    try {
        var monthCondition = "where month in (" + monthsList + ")";
        var sqlGoodSale = "SELECT goodslink,goodstitle, sum(monthsale) as monthSaleSum, sum(saleroom) as saleRoomSum, month  FROM  " + tableName + " " + monthCondition + "  GROUP BY goodslink, month order by saleRoomSum desc";
		console.log(new Date());       
	   var rowsGoodSale = await db.query(sqlGoodSale);
	   		console.log(new Date());
        for (var row of rowsGoodSale) {
            var index = _.indexOf(goods, row.goodslink);
            var saleRoomSum = parseFloat(row.saleRoomSum);
            var monthSaleSum = parseInt(row.monthSaleSum);
            if (index == -1) {
                goods.push(row.goodslink);
                var rowjson = {
                    goodslink: row.goodslink,
                    goodstitle: row.goodstitle,
                    monthSaleTotal: monthSaleSum,
                    saleRoomTotal: saleRoomSum,
                    data: {}
                }
                rowjson.data[row.month] = {
                    monthSaleSum: monthSaleSum,
                    saleRoomSum: parseFloat(saleRoomSum.toFixed(1))
                }
                rawdata.push(rowjson);
            } else {
                rawdata[index].monthSaleTotal += monthSaleSum;
                rawdata[index].saleRoomTotal += saleRoomSum;
                rawdata[index].data[row.month] = {
                    monthSaleSum: monthSaleSum,
                    saleRoomSum: parseFloat(saleRoomSum.toFixed(1))
                }
            }
            if (_.indexOf(months, row.month) == -1) {
                months.push(row.month);
            }
        }

        // 排序
        rawdata = _.sortBy(rawdata, function (item) {
            if (sortType == "desc") {
                return -item[sortKey];
            } else if (sortType == "asc") {
                return item[sortKey];
            } else {
                return -item.saleRoomTotal;
            }
        });
        months = _.pull(months, '');
        months = _.sortBy(months, function (n) {
            return n
        });

        rtn.code = 200;
        rtn.msg = "success";
        rtn.data = {
            rawdata: _.slice(rawdata, 0, limit),
            goods: _.slice(goods, 0, limit),
            months: _.pull(months, '')
        };
        res.json(rtn);
    } catch (err) {
        console.log(err);
        rtn.code = 300;
        rtn.msg = err;
        res.json(rtn);
    }
});*/

router.post('/goodSale', multerx.single(), async function (req, res, next) {

    var sortKey = req.body.key;
    var sortType = req.body.type;
    var limit = req.body.limit;
    var tableName = req.body.table;
    var monthsList = req.body.months;

    var rtn = {};
    var rawdata = [];
    var goods = [];
    var months = [];

    // SELECT * from
    // (SELECT goodslink,goodstitle, sum(monthsale) as monthSaleSum, sum(saleroom) as saleRoomSum  FROM  comp_nuk where month in (201801,201802,201803,201804,201805,201806,201807,201808)  GROUP BY goodslink order by saleRoomSum desc limit 0, 10) as t1
    // INNER JOIN 
    // ( SELECT * from comp_nuk ) as t2
    // on t1.goodslink = t2.goodslink

    // "SELECT goodslink,goodstitle, sum(monthsale) as monthSaleSum, sum(saleroom) as saleRoomSum, month  FROM  " + tableName + " " + monthCondition + "  GROUP BY goodslink, month order by saleRoomSum desc";


    try {
        var monthCondition = "where month in (" + monthsList + ")";
        var sqlGoodSale = "SELECT t1.goodsid, t1.goodstitle, t1.monthSaleTotal, t1.saleRoomTotal, t2.monthsale, t2.saleroom, t2.month FROM " +
            "(SELECT goodsid,goodstitle, sum(monthsale) as monthSaleTotal, sum(saleroom) as saleRoomTotal  FROM " + tableName + " where month in (" + monthsList + ")" +
            "GROUP BY goodsid ORDER BY " + sortKey + " " + sortType + " LIMIT 0, " + limit + " ) as t1 " +
            "INNER JOIN ( SELECT goodsid, monthsale, saleroom, month FROM " + tableName + " where month in (" + monthsList + ")" + ") as t2 " +
            "on t1.goodsid = t2.goodsid ORDER BY t1." + sortKey + " " + sortType  ;
        //console.log(new Date());

        var cacheKey = tableName+"_"+md5(sqlGoodSale);
        cacheResult = myCache.get(cacheKey);
        if ( cacheResult == undefined ){
            var rowsGoodSale = await db.query(sqlGoodSale);
            for (var row of rowsGoodSale) {
                var index = _.indexOf(goods, row.goodsid);
                if (index == -1) {
                    goods.push(row.goodsid);
                    var rowjson = {
                        goodslink: row.goodsid,
                        goodstitle: row.goodstitle,
                        monthSaleTotal: row.monthSaleTotal,
                        saleRoomTotal: row.saleRoomTotal,
                        data: {}
                    }
                    rowjson.data[row.month] = {
                        monthSaleSum: row.monthsale,
                        saleRoomSum: parseFloat(row.saleroom.toFixed(1))
                    }
                    rawdata.push(rowjson);
                } else {
                    rawdata[index].data[row.month] = {
                        monthSaleSum: row.monthsale,
                        saleRoomSum: parseFloat(row.saleroom.toFixed(1))
                    }
                }
                if (_.indexOf(months, row.month) == -1) {
                    months.push(row.month);
                }
            }
            //console.log(new Date());
            //console.log(new Date());
            // 排序
            // rawdata = _.sortBy(rawdata, function (item) {
            //     if (sortType == "desc") {
            //         return -item[sortKey];
            //     } else if (sortType == "asc") {
            //         return item[sortKey];
            //     } else {
            //         return -item.saleRoomTotal;
            //     }
            // });
    
            months = _.pull(months, '');
            months = _.sortBy(months, function (n) {
                return n
            });
    
            //console.log(new Date());
    
            rtn.code = 200;
            rtn.msg = "success";
            rtn.data = {
                rawdata: _.slice(rawdata, 0, limit),
                goods: _.slice(goods, 0, limit),
                months: _.pull(months, '')
            };
            
            myCache.set(cacheKey, rtn.data);
        }else{
            rtn.code = 200;
            rtn.msg = "success";
            rtn.data = cacheResult;            
        }    


        res.json(rtn);

    } catch (err) {
        console.log(err);
        rtn.code = 300;
        rtn.msg = err;
        res.json(rtn);
    }

});


router.post('/outinit', multerx.single(), async function (req, res, next) {
    var tableName = req.body.table;
    var rtn = {};
    try {
        var sqlMonth = "SELECT month FROM  " + tableName + "  where month <>'' GROUP BY month";
        var rowMonths = await db.query(sqlMonth);
        var sqlPromotion = "SELECT promotion FROM  " + tableName + "  where promotion <>'' GROUP BY promotion";
        var rowPromotions = await db.query(sqlPromotion);
        var sqlClass = "SELECT class FROM  " + tableName + "  where class <>'' GROUP BY class";
        var rowClasses = await db.query(sqlClass);                    
        rtn.code = 200;
        rtn.msg = "success";
        rtn.data = {
            month:rowMonths.map(item => item["month"]),
            promotion:rowPromotions.map(item => item["promotion"]),
            class:rowClasses.map(item => item["class"]),
        };
        res.json(rtn);
    } catch (err) {
        console.log(err);
        rtn.code = 300;
        rtn.msg = err;
        res.json(rtn);
    }
});


router.post('/outjdclass', multerx.single(), async function (req, res, next) {
    var tableName = req.body.table;
    var monthsList = req.body.months;
    var promsList = req.body.promotions;

    var rtn = {};
    var rawdata = [];
    var monthPromotionList = [];
    var goodclass = [];
    var months = [];

    var promotionList = [];
    if(typeof promsList != undefined && promsList!=""){
        promotionList = promsList.split(",");
    }

    var condition = "";
    if (monthsList !== "" && promsList !== "") {
        condition = "where month in (" + monthsList + ") and promotion in (" + promotionList.map(item=>"\'"+item+"\'") + ")";
    }else if(monthsList !== "" && promsList == ""){
        condition = "where month in (" + monthsList + ")";
    }else if(promsList !== "" && monthsList == ""){
        condition = "where promotion in (" + promotionList.map(item=>"\'"+item+"\'") + ")";
    }

    try {
        // 数据获取
        var sqlClass = " SELECT month, promotion, class, sum(saleroom) as saleRoomSum FROM  " + tableName + " " + condition + "  GROUP BY month, promotion, class  ORDER BY month";
        
        // var cacheKey = "out_jd_"+md5(sqlClass);
        // cacheResult = myCache.get(cacheKey);
        // if ( cacheResult == undefined ){
            var rowsMonth = await db.query(sqlClass);
            for (var row of rowsMonth) {
                var monthPromotionKey = row.month + row.promotion;
                var index = _.indexOf(monthPromotionList, monthPromotionKey);
                var saleRoomSum = parseFloat(row.saleRoomSum);
                if (index == -1) {
                    monthPromotionList.push(monthPromotionKey);
                    var rowjson = {
                        month: row.month,
                        promotion: row.promotion,
                        saleRoomTotal:saleRoomSum,
                        data:{}
                    }
                    rowjson.data[row.class] = parseFloat(saleRoomSum.toFixed(2));
                    rawdata.push(rowjson);
                }else{
                    rawdata[index].saleRoomTotal += saleRoomSum;
                    rawdata[index].data[row.class] = parseFloat(saleRoomSum.toFixed(2));
                }

                if (_.indexOf(months, row.month) == -1) {
                    months.push(row.month);
                }

                if (_.indexOf(goodclass, row.class) == -1) {
                    goodclass.push(row.class);
                }                
            } 

            months = _.pull(months, '');
            months = _.sortBy(months, function (n) {
                return n
            });

            rtn.code = 200;
            rtn.msg = "success";
            rtn.data = {
                rawdata: rawdata,
                columns:goodclass,
                months: months
            };
            
            // myCache.set(cacheKey, rtn.data);
        // }else{
        //     console.log("cache");
        //     rtn.code = 200;
        //     rtn.msg = "success";
        //     rtn.data = cacheResult;
        // }

        res.json(rtn);
    } catch (err) {
        console.log(err);
        rtn.code = 300;
        rtn.msg = err;
        res.json(rtn);
    }
});


router.post('/outjdgood', multerx.single(), async function (req, res, next) {
    var tableName = req.body.table;
    var monthsList = req.body.months;
    var promsList = req.body.promotions;
    var limit = req.body.limit;

    var rtn = {};
    var rawdata = [];
    var monthPromotionList = [];
    var goodcode = [];
    var goodCodeRank = [];
    var months = [];

    var promotionList = [];
    if(typeof promsList != undefined && promsList!=""){
        promotionList = promsList.split(",");
    }

    var condition = "";
    if (monthsList !== "" && promsList !== "") {
        condition = "month in (" + monthsList + ") and promotion in (" + promotionList.map(item=>"\'"+item+"\'") + ")";
    }else if(monthsList !== "" && promsList == ""){
        condition = "month in (" + monthsList + ")";
    }else if(promsList !== "" && monthsList == ""){
        condition = "promotion in (" + promotionList.map(item=>"\'"+item+"\'") + ")";
    }
    

    try {
        // 数据获取
        // var sqlClass = " SELECT month, promotion, goodcode, sum(saleroom) as saleRoomSum FROM  " + tableName + " WHERE " + condition + "  GROUP BY month, promotion, goodcode  ORDER BY month";
        var sqlClass = " SELECT month, promotion, goodcode, sum(saleroom) as saleRoomSum FROM  " + tableName + " WHERE goodcode in ( SELECT t.goodcode FROM ( SELECT goodcode FROM " + tableName + " WHERE " + condition + " GROUP BY goodcode ORDER BY sum(saleroom) desc LIMIT " + limit + "  ) as t ) and " + condition + "  GROUP BY month, promotion, goodcode  ORDER BY month";
        // console.log(sqlClass);
        var cacheKey = "out_jd_"+md5(sqlClass);
        cacheResult = myCache.get(cacheKey);
        if ( cacheResult == undefined ){
            var rowsMonth = await db.query(sqlClass);
            for (var row of rowsMonth) {
                var monthPromotionKey = row.month + row.promotion;
                var index = _.indexOf(monthPromotionList, monthPromotionKey);
                var saleRoomSum = parseFloat(row.saleRoomSum);
                if (index == -1) {
                    monthPromotionList.push(monthPromotionKey);
                    var rowjson = {
                        month: row.month,
                        promotion: row.promotion,
                        saleRoomTotal:saleRoomSum,
                        data:{}
                    }
                    rowjson.data[row.goodcode] = parseFloat(saleRoomSum.toFixed(2)); 
                    rawdata.push(rowjson);
                }else{
                    rawdata[index].saleRoomTotal += saleRoomSum;
                    rawdata[index].data[row.goodcode] = parseFloat(saleRoomSum.toFixed(2));
                }

                if (_.indexOf(months, row.month) == -1) {
                    months.push(row.month);
                }

                if (_.indexOf(goodcode, row.goodcode) == -1) {
                    goodcode.push(row.goodcode);
                    goodCodeRank.push({name:row.goodcode, value:saleRoomSum});
                }else{
                    goodCodeRank[_.indexOf(goodcode, row.goodcode)].value += saleRoomSum;
                }
                
                
            }

            months = _.pull(months, '');
            goodCodeRank = _.sortBy(goodCodeRank, function (good) {
                return -good.value;
            });
            goodcode = [];
            for(gcode of goodCodeRank){
                goodcode.push(gcode.name);
            }

            rtn.code = 200;
            rtn.msg = "success";
            rtn.data = {
                rawdata: rawdata,
                columns: goodcode, //_.slice(goodcode, 0, 10),
                months: months
            };
            
            myCache.set(cacheKey, rtn.data);
        }else{
            console.log("cache");
            rtn.code = 200;
            rtn.msg = "success";
            rtn.data = cacheResult;
        }

        res.json(rtn);
    } catch (err) {
        console.log(err);
        rtn.code = 300;
        rtn.msg = err;
        res.json(rtn);
    }
});



module.exports = router;
