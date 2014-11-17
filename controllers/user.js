var UserDetail = require('../models/user_details');
var User = require('../models/user');
var Connection = require('../models/connection');
var Spark = require('../models/spark');
var moment = require('moment');

// Create endpoint /api/users for POSTS
exports.postUser = function(req, res) {
  // Create a new instance of the User model
  var user = new User();

  // Set the user properties that came from the POST data
  user.set(req.body);

  var userdetails = new UserDetail(req.body.details[0]);

  // Save the user and check for errors
  userdetails.save(function(err) {
    if (err)
      res.send(err);
    user.details = userdetails._id;
    user.save(function(err) {
      if (err)
        res.send(err);
      res.json({ message: 'User added to the system!', data: user });
    });
  });
};

// Create endpoint /api/users/details/basic for POSTS
exports.postUserDetailsBasic = function(req, res) {

  // Save the user and check for errors
  User.findById(req.body.user_id,
    function(err,userDetails){
      var dateDob;
      console.log("dob" + req.body.dob);
      if(!req.body.dob)
        dateDob = req.body.dob;
      else
        dateDob = "";
      UserDetail.findByIdAndUpdate(
          userDetails.details,
          {"firstname":req.body.firstname, "lastname":req.body.lastname,
           "gender":req.body.gender, "dob":dateDob, "martial":req.body.martial},
           function(err,model){
            if(err){
              console.log(err);
              res.send(err);
            }
            res.send(model);
           }
      );
    }
  );
};

// Create endpoint /api/users/details/work for POSTS
exports.postUserDetailsWork = function(req, res) {
  
  // Save the user and check for errors
  User.findById(req.body.user_id,
    function(err,userDetails){
      UserDetail.findByIdAndUpdate(
          userDetails.details,
          {"headline":req.body.headline, "skills":req.body.skills,
           "employment":req.body.employment},
           function(err,model){
            if(err)
              res.send(err);
            res.send(model);
           }
      );
    }
  );
};

// Create endpoint /api/users/details/contact for POSTS
exports.postUserDetailsContact = function(req, res) {
  
  // Save the user and check for errors
  User.findById(req.body.user_id,
    function(err,userDetails){
      UserDetail.findByIdAndUpdate(
        userDetails.details, 
        {"telhome":req.body.telhome, "telwork":req.body.telwork,
         "telcontact":req.body.telcontact},
         function(err,model){
          if(err)
            res.send(err);
          res.send(model);
         }
      );
    }
  );
};

// update password
exports.updatePassword = function(req, res){
  User.findById(req.body.user_id,
    function(err,user){
      if(err)res.send(err);
      user.password = req.body.password;
      user.save(function(err,user2){
        if(err)res.send(err);
        res.json(user2);
      });
    }
  );
}

// Create endpoint /api/users for GET
exports.getUsers = function(req, res) {
  // Use the User model to find all user
  User.find(function(err, users) {
    if (err)
      res.send(err);

    res.json(users);
  });
};

// Create endpoint /api/users/:user_id for GET
exports.getUser = function(req, res) {
  
  if (!req.params.user_id.match(/^[0-9a-fA-F]{24}$/)) {
    res.json({"error":"Incorrect User Id"});
  }

  // Use the User model to find a specific user
  User.findById(req.params.user_id)
    .populate("details")
    .exec(
      function(err, user) {
        if (err)
          res.send(err);
        res.json(user);
    });
};

// Create endpoint /api/users/:user_id for GET
exports.getUserByEmail = function(req, res) {
  
  // Use the User model to find a specific user
  User.findOne({"email":req.params.email.toLowerCase()})
    .populate("details")
    .exec(
      function(err, user) {
        if (err)
          res.send(err);
        res.json(user);
    });
};

exports.signupUser = function(req, res){
  // Create a new instance of the User model
  var user = new User();
  var details = new UserDetail();
  user.email = req.body.email.toLowerCase();
  user.password = req.body.password;
  user.details = details._id;
  details.image = "images/placehold/50x50.gif";
  details.save(function(err,details) {
    if (err)
      res.send(err);
    user.save(function(err,user2){
      if (err)
        res.send(err);
      if(!user)
        next();
      
      Connection.update({"email":req.body.email.toLowerCase()},{"user_id_friend":user._id},
            function(err,conn){
              if(err) res.send(err);
              var spark = new Spark();
              spark.title = "My First Spark";
              spark.description = "Demo Spark";
              spark.task_category = "Demo";
              spark.start_date = moment(new Date()).format("MM-DD-YYYY HH:mm:ss");
              spark.end_date = moment(new Date()).format("MM-DD-YYYY HH:mm:ss");
              spark.user = user._id;
              spark.frequency = 0;
              spark.email = req.body.email.toLowerCase();
              spark.status = 1;
              spark.save(function(err,spark){
                if(err) return res.send(err);
                res.json({ message: 'User added to the system!', 
                 data: user });
              });
            }
      );
    }); 
  });
}

// Create endpoint /api/users/:user_id for PUT
exports.postUpload = function(req, res) {
 
  User.findById(req.body.user_id,
    function(err,user){

      if(user.details){
        UserDetail.findById(user.details,
          function(err,details){
                      
            if(err)res.send(err);
            if(req.body.details.image)
              details.image = req.body.details.image;
              details.save(function(err,doc){
              if(err)res.send(err);
              res.send(doc);
            });
          }
        );
      }
    }
  );
};