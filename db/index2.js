var mysql = require("mysql");
var pool = mysql.createPool({
    host:"localhost",
    user:"user1",
    password:"123456",
    database:"ida"
});

function query(sql,callback){
    pool.getConnection(function(err,connection){
        connection.query(sql, function (err,rows) {
            connection.release();
            callback(err,rows);
        });
    });
}

function batch(table, keys, values, callback){
    var sql = "Insert into "+ table + "(" + keys + ")" + "values ?";
    pool.getConnection(function(err,connection){
        connection.query(sql, [values], function (err,rows) {
            callback(err,rows);
            // connection.release();
        });
    });       
}

function insert(table, data, callback){
    var sql = "Insert into "+ table;
    var keys = "";
    var values = "";
    for(var key in data){
        keys = keys + key + ","
        values = values + "'" +data[key] +"'" + ","
    }
    keys = keys.substring(0,keys.length-1); 
    values = values.substring(0,values.length-1);
    sql = sql + "(" + keys + ")" + "values" + "(" + values + ")";
    query(sql, callback);
}

/**
 * 只支持and, or 使用in范围
 * TODO
 * @param {*} table 
 * @param {*} keys [k1,k2,k3] or *
 * @param {*} conditions [{field:k1, value:v1, type:"wildcard"},{field:k2, value:[va2,vb2], type:"in"},{field:k3, value:v3, type:"equal"}]
 * @param {*} callback 
 */
function select(table, keys, conditions, callback){
    var sql = "Select";
    var fields = "";
    var where = "";
    if(keys=="*"){
        fields = " * "
    }else{
        for(var f of keys){
            keys = keys + " " + key + " ,"
        } 
        keys = keys.substring(0,keys.length-1);        
    }

    for(var cond of conditions){
        if(cond.type == "equal"){
            where = where + cond.field + "=" + cond.value + " and ";
        }else if(cond.type == "wildcard"){
            where = where + cond.field + "=%" + cond.value + "% and ";
        }else if(cond.type == "wildcard"){
            where = where + cond.field + "=%" + cond.value + "% and ";
        }
    }
}

var db = {
    query:query,
    insert:insert,
    batch:batch
}

module.exports = db;
// exports.query = query;