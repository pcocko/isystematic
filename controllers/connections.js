var User = require('../models/user');
var UserDetail = require('../models/user_details');
var Connection = require('../models/connection');
var ConnectionStream = require('../models/connection_stream');
var Notification = require('../models/notification');
var async = require('async');
var tools = require('../tools/tools');

// Create endpoint /api/users/connections/ for POSTS
// Save a list of connections
exports.postConnections = function(req, res) {
  
  var update = "";
  if(req.body.user_invite_id)
    update = {"user_id":req.body.user_id,"user_id_friend":req.body.user_invite_id,
           "status":req.body.status, "user_views":0, "email":req.body.email_invite.toLowerCase()}
  else
    update = {"user_id":req.body.user_id,
           "status":req.body.status, "user_views":0, "email":req.body.email_invite.toLowerCase()}

  var data = {"user_id":req.body.user_id,"user_id_friend":req.body.user_invite_id};         
  Connection.update(
          data,
          update,
          {upsert:true},
          function(err, model) {
            if(err) res.send(err);
            var connStream = new ConnectionStream(data);
            connStream.save(function(err){
              res.send(model);
            });
          }
        );
};

// Add new friend
exports.postFriend = function(req, res){
  var user_id_friend;

  Connection.findById(req.params.connection_id,
    function(err,conn){
      if(err)return res.send(err);
      user_id_friend = conn.user_id;
      Connection.update({"user_id":user_id_friend,"user_id_friend":req.params.user_id},{"status":1,"user_views":1},
        function(err,conn2){
          if(err) return res.send(err);
          var data = {
            "user_id":req.params.user_id,
            "user_id_friend":user_id_friend,
            "status":1,
            "user_views":0
          }
          var aConn = new Connection(data);
          aConn.save(function(err,conn3){
            var aConnStream = new ConnectionStream(data);
            aConnStream.save(function(err,conn3){
              User.findById(user_id_friend)
              .populate("details")
              .exec(function(err,user){
                if(err)return res.send(err);
                var obj = new Object();
                obj.email = user.email;
                if(user.details){
                  obj.firstname = user.details.firstname;
                  obj.lastname = user.details.lastname;
                }
                res.json(obj);
              });
            });
          });
        });
    }
  );
}

// Add new friend request
exports.postFriendReq = function(req, res){
  var data = {
    "user_id_friend":req.params.user_id_friend,
    "user_id":req.params.user_id,
    "status":2,
    "user_views":0
  };
  var aConn = new Connection(data);
  aConn.save(function(err,conn){
    var aConnStream = ConnectionStream(data);
    aConnStream.save(function(err,conn){
      User.findById(req.params.user_id)
      .populate("details")
      .exec(function(err,user){
        if(err)return res.send(err);
        var obj = new Object();
        obj.email = user.email;
        if(user.details){
          obj.firstname = user.details.firstname;
          obj.lastname = user.details.lastname;
        }
        res.json(obj);
      });
    });
  });
}

// Create endpoint /api/connections/:user_id/:user_id_friend for PUT
exports.putConnection = function(req, res) {

  Connection.update(
          {"user_id":req.params.user_id,"user_id_friend":req.params.userfriend},
          {"user_views":req.body.user_views,"status":req.body.status},
          {upsert:false},
          function(err, model) {
            if(err)
                res.send(err);
          }
  );

  Connection.find({"user_id":req.params.user_id,"user_id_friend":req.params.userfriend},
      function(err, model) {
            if(err)
                res.send(err);
             res.json(model);
          });
};

// Create endpoint /api/users/connections/:user_id for GET
exports.getConnections = function(req, res) {
  // Use the User model to find all user
  Connection.find({"user_id":req.params.user_id}).populate('user_id_friend').exec(
    function (err, docs) {
   	  if (err)
        res.send(err);
      User.populate(docs,
          {path:"user_id_friend.details", model:"UserDetail"},
          function(err, details){
            if(err)
              res.send(err);
            res.json(details);
          }
      );
    }
  );
};

// Get followers list
exports.getAddFollowersList = function(req, res){
  
  var records = [];

  Connection.find({"user_id_friend":req.params.user_id,"status":1})
    .populate('user_id')
    .exec(function (err, docs) {
      async.each(
        docs,
        function(doc, callback2){
          var friend = new Object();
          friend.email = doc.user_id.email;
          friend.user_id = doc.user_id._id;
          records.push(friend);
       
          User.findById(doc.user_id).populate(
            "details").exec(
            function(err,user){
              if (err) throw err;
              friend.firstname = user.details.firstname;
              friend.lastname = user.details.lastname;
              friend.image = user.details.image;
              callback2();
            }
          );
        },
        function(err,model){ 
          res.json(records);
        }
      );
  }); 
}

// Get Pending connections
exports.getPendingConnections = function(req, res){
  var records = [];

  Connection.find({"user_id_friend":req.params.user_id,"status":2})
    .populate("user_id")
    .exec(function (err, docs) {
      async.each(
        docs,
        function(doc, callback){
          var friend = new Object();
          if(doc.user_id){
            friend.email = doc.user_id.email;
            friend.user_friends_id = doc._id;
            records.push(friend);

            User.findById(doc.user_id).populate(
              "details").exec(
              function(err,user){
                if (err) throw err;
                friend.firstname = user.details.firstname;
                friend.lastname = user.details.lastname;
                friend.image = user.details.image;
                callback();
              }
            );
          }
          else
            callback();
        },
        function(err){
          res.json(records); 
        }
      );
  });          
} 

// Get followers list
exports.getAddFollowingList = function(req, res){
  
  var records = [];

  Connection.find({"user_id":req.params.user_id,"status":1})
    .populate('user_id_friend')
    .exec(function (err, docs) {
      async.each(
        docs,
        function(doc, callback){
          var friend = new Object();
          if(doc.user_id_friend){
            friend.email = doc.user_id_friend.email;
            friend.user_id = doc.user_id_friend._id;
            records.push(friend);
           
            User.findById(doc.user_id_friend).populate(
              "details").exec(
              function(err,user){
                if (err) throw err;
                friend.firstname = user.details.firstname;
                friend.lastname = user.details.lastname;
                friend.image = user.details.image;
                callback();
              }
            );
          }
          else
            callback();
        },
        function(err){
          res.json(records); 
        }
      );
  }); 
}
// Create endpoint /api/users/connections/count/:user_id/:status for GET
exports.getConnectionsCount = function(req, res) {
  // Use the User model to find all user
  var query = "";
  if(req.params.status == 1)
    query = {"user_id":req.params.user_id, "status":req.params.status};
  else
    query = {"user_id_friend":req.params.user_id, "status":req.params.status};

  Connection.count(query, function (err, count) {
 	if (err)
      res.send(err);

  	res.json({"count":count});
    
  });
};

// Create endpoint /api/connections/notifications/count/:user_id for GET
exports.getNotificationsCount = function(req, res) {
  
  // Use the User model to find all user
  Connection.count({$or:[{$and:[{"user_id":req.params.user_id},{"status":1}]},
                                    {$and:[{"user_id_friend":req.params.user_id},{"status":2}]}],"user_views":0},
                                   
                                     function (err, count) {
  if (err)
      res.send(err);
    res.json({"count":count});
    
  });
};

// DElete friend
exports.getDeleteFriend = function(req, res){

  Connection.findById(req.params.connection_id,
    function(err,conn)
    {
      if(err)res.send(err);
      Connection.remove({"user_id":req.params.user_id,"user_id_friend":conn.user_id},
        function(err,conn2){
          if(err)res.send(err);
          Connection.remove({"user_id":conn.user_id,"user_id_friend":req.params.user_id},
            function(err,conn3){
              if(err)res.send(err);
              var data = {
                "user_id":conn.user_id,
                "user_id_friend":conn.user_id_friend
              };
              var connStream = new ConnectionStream(data);
              connStream.save(function(err){
                res.json({ message: 'Friend removed successfully', success:1});  
              });
            });
        })
  });
}

// Create endpoint /api/connections/notifications/added/:user_id for GET
exports.getFriendsNotifications = function(req, res){

  tools.getFriendsNotifications(req.params.user_id,function(records){
      res.json(records);
  });
  
};

// Create endpoint /api/connections/notifications/accepted/:user_id for GET
exports.getFriendsNotificationsAccepted = function(req, res){

  tools.getFriendsNotificationsAccepted(req.params.user_id,function(records){
      res.json(records);
  });
};

// Create a new connection
exports.postInvitation = function(req, res){

  Connection.findOne({"user_id":req.body.user_id,"email":req.body.mail_friend.toLowerCase()},
    function(err,invitation){
      if(err)
        res.send(err);
      if(!invitation)
        User.findOne({"email":req.body.mail_friend.toLowerCase()},
          function(err,user){
            if(err) res.send(err);
            
            if(!user){
              var data = {
                "user_id":req.body.user_id,
                "user_id_friend":null,
                "email":req.body.mail_friend.toLowerCase(),
                "status":2
              }
              var conn = new Connection(data);
              conn.save(function(err,conn){
                  if(err) res.send(err);
                  var connStream = new ConnectionStream(data);
                  connStream.save(function(err,conn){
                    if(err) res.send(err);
                    res.json({"code":2,"message":"Invitation sent"});
                  });
                  
                }
              );
            }
            else{
              Connection.count({$or:[{$and:[{"user_id_friend":user._id},{"user_id":req.body.user_id}]},
                                    {$and:[{"user_id_friend":req.body.user_id},{"user_id":user._id}]}]},
                  function(err,count){
                    if(err)res.send(err);
                    if(count == 0){
                      var data ={
                        "user_id":req.body.user_id,
                        "user_id_friend":user._id,
                        "status":2
                      }
                      var conn = new Connection(data);
                      conn.save(function(err,conn){
                          if(err) res.send(err);
                          var connStream = new ConnectionStream(data);
                          connStream.save(function(err,conn){
                            if(err)res.send(err);
                            res.json({"code":3,"message":"Invitation sent"});
                          });
                        }
                      );
                    }
                  });
            }
          });
        }
    );
}