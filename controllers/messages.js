var User = require('../models/user');
var UserDetail = require('../models/user_details');
var Notification = require('../models/notification');
var Message = require('../models/message');
var MessageStream = require('../models/message_stream');
var SparkMessageNotification = require('../models/spark_msg_notification');
var async = require('async');

// Create endpoint /api/messages/ for POSTS
// Save a message
exports.postMessage = function(req, res) {
  // Create a new instance of the User model
  var mesg = new Message();
  // Set the message properties that came from the POST data
  mesg.set(req.body);

  // Save the user and check for errors
  mesg.save(function(err) {
    if (err)
      res.send(err);
      res.json({ message: 'Message added to the system!', data: mesg });
  });    
}

// Create endpoint /api/message/:message_id for PUT
exports.putMessage = function(req, res) {

  Message.findByIdAndUpdate(req.params.message_id, 
    { 
      message : req.body.message,
      user_views : req.body.user_views
    }, {upsert: true}, function (err, noti) {
      if (err) 
        res.send(err);
      
      res.json(noti);
  });
};

// Create endpoint /api/messages/:user_id for GET
exports.getMessages = function(req, res) {
  // Use the Message model to find all user
  Message.find({"user_id":req.params.user_id},function (err, docs) {
 	if (err)
      res.send(err);

    res.json(docs);
  });
};

// Create endpoint /api/messages/count/:user_id for GET
exports.getMessagesCount = function(req, res) {
  // Use the Message model to find all messages associated with a user
  SparkMessageNotification.count({"user":req.params.user_id, "user_views":0}, function (err, count) {
 	if (err)
      res.send(err);

  	res.json({"count":count});
    
  });
};

// Notifications when a new message in a spark is created
exports.getNotificationsMessages = function(req, res){

  var records = [];

  SparkMessageNotification.find({"user":req.params.user_id,"user_views":0})
  .populate("spark notice_user message").exec(

    function(err, messages){
      if(err)
        res.send(err);
      async.each(
        messages,
        function(message, callback){
          var noti = new Notification();
          User.populate(message,
              {path:"notice_user.details", model:"UserDetail"},
               function(err, details){
                 if(err)
                      res.send(err);
                  noti.email = message.notice_user.email;
                  noti.user_id = message.notice_user._id;
                  noti.firstname = message.notice_user.details.firstname;
                  noti.lastname = message.notice_user.details.lastname;
                  noti.image = message.notice_user.details.image;
                  noti.message = "posted a new message in " + message.spark.title;
                  
                  records.push(noti);
                  callback();
                }
              );
        },
        function(err){ 
          res.json(records);
        }
      );
    }
  );
}

// Get new messages
exports.getNewMessages = function(req, res){
  var records = [];

  if(!req.params.message_id)
    return;
  Message.findById(req.params.message_id,
    function(err,current_msg){
      if(err) res.send(err);
      if(current_msg){
        Message.find({"date":{"$gt": current_msg.date}, "spark_id":req.params.spark_id})
        .populate("user_id")
        .exec(
        function(err,messages){
          if(err) res.send(err);
            async.each(
              messages,
              function(message, callback){
                var obj = new Object();
                User.populate(message,
                    {path:"user_id.details", model:"UserDetail"},
                     function(err, details){
                       if(err)
                            res.send(err);
                        obj.image = message.user_id.details.image;
                        obj.message = message.message;
                        obj.msg_id = message._id;
                        obj.msg_id = message._id;
                        obj.firstname = message.user_id.details.firstname;
                        obj.msg_date = message.date;
                        obj.attachment = message.attachment;
                        records.push(obj);
                        callback();
                      }
                    );
              },
              function(err){ 
                 res.json(records);
              }
            );          
        });
      }
    });
}
