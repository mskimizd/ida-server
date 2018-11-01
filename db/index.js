const mysql = require('mysql')
var pool = mysql.createPool({
    host: "localhost",
    user: "user1",
    password: "123456",
    database: "ida"
});

function queryAsync(sql,callback){
    pool.getConnection(function(err,connection){
        if (err) {
            callback(err,[]);
        }else{
            connection.query(sql, function (err,rows) {
                connection.release();
                callback(err,rows);
            });
        }
    });
}

// 接收一个sql语句 以及所需的values
// 这里接收第二参数values的原因是可以使用mysql的占位符 '?'
// 比如 query(`select * from my_database where id = ?`, [1])

let query = function (sql, values) {
    // 返回一个 Promise
    return new Promise((resolve, reject) => {
        pool.getConnection(function (err, connection) {
            if (err) {
                reject(err)
            } else {
                connection.query(sql, values, (err, rows) => {

                    if (err) {
                        reject(err)
                    } else {connection
                        resolve(rows)
                    }
                    // 结束会话
                    connection.release()
                })
            }
        })
    })
}

let batch = function (table, keys, values) {
    var sql = "Insert into "+ table + "(" + keys + ")" + "values ?";
    return new Promise((resolve, reject) => {
        pool.getConnection(function (err, connection) {
            if (err) {
                reject(err)
            } else {
                connection.query(sql, [values], (err, rows) => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(rows)
                    }
                    // 结束会话
                    connection.release()
                })
            }
        })
    })    
}

let insert = function insert(table, data) {
    var sql = "Insert into " + table;
    var keys = "";
    var values = "";
    for (var key in data) {
        keys = keys + key + ","
        values = values + "'" + data[key] + "'" + ","
    }
    keys = keys.substring(0, keys.length - 1);
    values = values.substring(0, values.length - 1);
    sql = sql + "(" + keys + ")" + "values" + "(" + values + ")";    
    return new Promise((resolve, reject) => {
        pool.getConnection(function (err, connection) {
            if (err) {
                reject(err)
            } else {
                connection.query(sql, (err, rows) => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(rows)
                    }
                    connection.release()
                })
            }
        })

    })
}


var db = {
    query:query,
    queryAsync:queryAsync,
    insert:insert,
    batch:batch,
}

module.exports = db;
