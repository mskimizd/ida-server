var express = require('express');
var router = express.Router();

var passport = require('../auth/index');


router.post('/login', function(req, res, next) {

  passport.authenticate('local', function(err, user, info) {

    if (err) { return next(err); }
    if (!user) { 
      return res.json({
        status:"failure"
      })
    }
    req.logIn(user, function(err) {
      if (err) { return next(err); }
      return res.json({
        status:"success"
      })
    });

    // passport.authenticate('local', { successRedirect: '/',
    // failureRedirect: '/login',
    // failureFlash: true })

  })(req, res, next);

});

module.exports = router;
