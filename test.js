var fs = require('fs');

var _ = require('lodash');

var db = require("./db/index");

var sql = fs.readFileSync('./db/sql/shop-sale.sql');
sql = sql.toString().replace(/tableName/g, "comp_babycare");

var rows = db.queryAsync(sql, function (err, rows) {
    var rawdata = [];
    var shopkeeper = [];
    var month = [];
    for (var row of rows) {
        var index = _.indexOf(shopkeeper, row.shopkeeper);
        if(index==-1){
            shopkeeper.push(row.shopkeeper);
            var rowjson = {
                shopkeeper:row.shopkeeper,
                shoptype:row.shoptype,
                monthSaleTotal:row.monthSaleTotal,
                saleRoomTotal:row.saleRoomTotal,
                data:{}
            }
            rowjson.data[row.month]={
                monthSaleSum:row.monthSaleSum,
                saleRoomSum:row.saleRoomSum
            }
            rawdata.push(rowjson);
        }else{
            rawdata[index].data[row.month]={
                monthSaleSum:row.monthSaleSum,
                saleRoomSum:row.saleRoomSum
            }
        }
        if(_.indexOf(month, row.month)==-1){
            month.push(row.month);
        }        
        // console.log(row.shopkeeper);

    }

    console.log(shopkeeper);
    console.log(month);
    console.log(rawdata[0]);
});
    // console.log(rows);
