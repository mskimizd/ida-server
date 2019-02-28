var db = require("../db/index");
var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy(
    async function(username, password, done) {

        // console.log("check!");
        try {
            var userCheckSql = "SELECT * FROM `sys_users` where username='"+username+"' and password='"+password+"'";
            var users = await db.query(userCheckSql);
            if(users.length == 0){
                return done(null, false, { message: 'Incorrect username or password.' });
            }
        } catch (err) {
            return done(null, false, { message: 'system error' });
        }            
        // console.log(users);

        // var user = {
        //     id: '1',
        //     username: 'admin',
        //     password: 'admin'
        // }; // 可以配置通过数据库方式读取登陆账号

        // if (username !== user.username) {
        //     return done(null, false, { message: 'Incorrect username.' });
        // }
        // if (password !== user.password) {
        //     return done(null, false, { message: 'Incorrect password.' });
        // }

        // console.log(users[0]);
        var user = users[0];
        return done(null, user);
 
    }
));

passport.serializeUser(function (user, done) {//保存user对象
    done(null, user);//可以通过数据库方式操作
});

passport.deserializeUser(function (user, done) {//删除user对象
    done(null, user);//可以通过数据库方式操作
});

module.exports = passport;