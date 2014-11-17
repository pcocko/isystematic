// Load required packages
var passport = require('passport');
var BasicStrategy = require('passport-http').BasicStrategy;
var User = require('../models/user');
var jwt = require('jwt-simple');
var moment = require('moment');

passport.use(new BasicStrategy(
  function(email, password, callback) {

    User.findOne({ email: email.toLowerCase() }, function (err, user) {
      if (err) { return callback(err); }

      // No user found with that username
      if (!user) { return callback(null, false); }

      // Make sure the password is correct
      user.verifyPassword(password, function(err, isMatch) {
        if (err) { return callback(err); }

        // Password did not match
        if (!isMatch) { return callback(null, false); }

        // Success
        return callback(null, user);
      });
    });
  }
));

exports.isAuthenticated = passport.authenticate('basic', { session : false });

exports.login = function(req, res) {
    res.setHeader('Access-Control-Allow-Origin','*');
    var email = req.body.email || '';
    var password = req.body.password || '';
    var linkedin = req.body.linkedin || '';
    if (email == '' || password == '') {
        console.log("Not username or password entered");
        return res.json({"login":0});
    }
 
    User.findOne({ email: email.toLowerCase() }).populate("details").exec(
      function (err, user) {
        if (err) {
            console.log(err);
            return res.json({"login":0});
        }
        console.log(user);
         // No user found with that username
        if (!user) { return  res.json({"login":0}); }
        
        user.comparePassword(password, function(isMatch) {
            if (!linkedin && !isMatch) {
                console.log("Attempt failed to login with " + user.username);
                return res.json({"login":0});
            }
            
            var expires = moment().add(7,'days').valueOf();
            var token = jwt.encode({
              iss: user.email,
              exp: expires
            }, "BARCELONA");

            return res.json(
                {
                  "login":1, 
                  "user_id":user._id, 
                  "details":user.details,
                  "token" : token,
                  "expires": expires
                });
        });
 
    });
};