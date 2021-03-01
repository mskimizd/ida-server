var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors')
var session = require('express-session')

var passport = require('./auth/index')


var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var filesRouter = require('./routes/files');
var analysisRouter = require('./routes/analysis');
var systemRouter = require('./routes/system');


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({secret: 'ida.me',resave: false, saveUninitialized: true, cookie: { maxAge: 60000 }}));
app.use(express.static(path.join(__dirname, 'public')));

// passport configuration
app.use(passport.initialize());
app.use(passport.session());


// var allowCrossDomain = function (req, res, next) {
//   res.header('Access-Control-Allow-Origin', '*');
//   res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
//   res.header("Content-Type", "application/json;charset=utf-8");
//   next();
// };

// app.use(allowCrossDomain);
app.use(cors({
  "origin": true,
  "credentials": true
}))

app.use(function (req, res, next) {

  // if(req.isAuthenticated() || req.path=="/users/login" || req.path=="/files/upload"){
  //   next();    
  // }else{
  //   res.json({
  //     code: 300
  //   });
  // }

  next(); 

});

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/files', filesRouter);
app.use('/analysis', analysisRouter);
app.use('/system', systemRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


// nodemon
// var debug = require('debug')('my-application'); // debug模块
// app.set('port', process.env.PORT || 3000); // 设定监听端口

// //启动监听
// var server = app.listen(app.get('port'), function() {
//   debug('Express server listening on port ' + server.address().port);
// });

//module.exports = app;//这是 4.x 默认的配置，分离了 app 模块,将它注释即可，上线时可以重新改回来

module.exports = app;
