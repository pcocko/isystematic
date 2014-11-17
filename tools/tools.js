var Spark = require('../models/spark');
var Connection = require('../models/connection');
var SparkNotificationMessage = require('../models/spark_msg_notification');
var SparkTeam = require('../models/spark_team');
var User = require('../models/user');
var Message = require('../models/message');
var Notification = require('../models/notification');
var SparkMessageNotification = require('../models/spark_msg_notification');
var async = require('async');

module.exports = {
  countNotifications: function (user_id, callback) {
    var nroNoti = 0;
	Connection.count({"user_views":0,$or:[{$and:[{"user_id_friend":user_id},{"status":1}]},{$and:[{"user_id_friend":user_id},{"status":2}]}]},
		
		function(err,count){

			if(err) return nroNoti;
			nroNoti += count;
			SparkMessageNotification.count({"user_views":0,"user":user_id},
				function(err,count){
					if(err) return  nroNoti;
					nroNoti += count;
					SparkTeam.count({"user_views":0,"user_id":user_id},
						function(err,count){
							if(err) return  nroNoti;
							nroNoti += count;
							callback(nroNoti);
						});
				});
			}
	);
  },
  getFriendsNotifications: function (user_id, callback) {

		var records = [];
		Connection.find({"user_id_friend":user_id,"user_views":0,"status":2})
		.populate('user_id')
		.exec(function (err, docs) {

		async.each(
		  docs,
		  function(doc, callback2){
		    var noti = new Notification();
		    noti.email = doc.user_id.email;
		    noti.user_id = doc.user_id._id;
		    records.push(noti);
		   
		    User.findById(doc.user_id).populate(
		      "details").exec(
		      function(err,user){
		        if (err) throw err;
		        noti.firstname = user.details.firstname;
		        noti.lastname = user.details.lastname;
		        noti.image = user.details.image;
		        noti.message = "added you";
		        callback2();
		      }
		    );
		    
		  }
		  ,
		  function(err){ 
		    callback(records);
		  }
		);
		}); 
	},
	getFriendsNotificationsAccepted: function (user_id, callback) {

		var records = [];

		Connection.find({"user_id_friend":user_id,"status":1,"user_views":0})
	    .populate('user_id')
	    .exec(function (err, docs) {
	    
	    async.each(
	      docs,
	      function(doc, callback2){
	        var noti = new Notification();
	        if(doc.user_id){
	          noti.email = doc.user_id.email;
	          noti.user_id = doc.user_id._id;
	          noti.message = "accepted your request";
	          records.push(noti);
	         
	          User.findById(doc.user_id).populate(
	            "details").exec(
	            function(err,user){
	              if (err) throw err;
	              noti.firstname = user.details.firstname;
	              noti.lastname = user.details.lastname;
	              noti.image = user.details.image;
	              
	              callback2();
	            }
	          );
	        }
	      }
	      ,
	      function(err){ 
	        callback(records);
	      }
	    );
	  }); 
	},
	getNotificationsSparkTeam:function (user_id, callback) {

		var records = [];
		
		SparkTeam.find({"user_id":user_id,"user_views":0})
		.select("spark_id")
		.populate("spark_id").exec(

		function(err, sparks){
		  if(err)
		    res.send(err);

		  async.each(
		    sparks,
		    function(spark, callback2){
		      var noti = new Notification();

		      Spark.populate(spark,
		        {path:"spark_id.user",select:"email details",model:"User"},
		        function(err, users){
		          if(err)
		            res.send(err);
		          User.populate(users,
		            {path:"spark_id.user.details", model:"UserDetail"},
		            function(err, details){
		              if(err)
		                res.send(err);
		              noti.email = spark.spark_id.user.email;
		              noti.user_id = spark.spark_id.user._id;
		              noti.firstname = spark.spark_id.user.details.firstname;
		              noti.lastname = spark.spark_id.user.details.lastname;
		              noti.image = spark.spark_id.user.details.image;
		              noti.message = "invites you " + spark.spark_id.title;
		              records.push(noti);
		              callback2();
		            }
		          );
		          
		      });
		    },
		    function(err){ 
		      callback(records);
		    }
		  );
		}
		);
	},
	getNotificationsMessages:function (user_id, callback) {

		var records = [];
		SparkMessageNotification.find({"user":user_id,"user_views":0})
		.populate("spark notice_user message").exec(

		function(err, messages){
		  if(err)
		    res.send(err);
		  async.each(
		    messages,
		    function(message, callback2){
		      var noti = new Notification();
		      records.push(noti);
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
		              
		              callback2();
		            }
		          );
		    },
		    function(err){ 
		      callback(records);
		    }
		  );
		}
	);
	},
	getNewMessages:function (spark_id, message_id, callback) {
		
		var records = [];
		Message.findById(message_id,
		function(err,current_msg){
		  if(err) res.send(err);
		  if(current_msg){
		    Message.find({"date":{"$gte": current_msg.date}, "spark_id":spark_id})
		    .populate("user_id")
		    .exec(
		    function(err,messages){
		      if(err) res.send(err);
		        async.each(
		          messages,
		          function(message, callback2){
		            var obj = new Object();
		            User.populate(message,
		                {path:"user_id.details", model:"UserDetail"},
		                 function(err, details){
		                   if(err)
		                        res.send(err);
		                    obj.image = message.user_id.details.image;
		                    obj.message = message.message;
		                    obj.msg_id = message._id;
		                    obj.spark_id = message.spark_id;
		                    obj.firstname = message.user_id.details.firstname;
		                    obj.msg_date = message.date;
		                    obj.attachment = message.attachment;
		                    records.push(obj);
		                    callback2();
		                  }
		                );
		          },
		          function(err){ 
		             callback(records);
		          }
		        );          
		    });
		  }
		});
	},
	getConnectionsCount:function (user_id, callback) {
		var total_friends=0, total_pending=0;
		// Use the User model to find all user
		Connection.count({"user_id":user_id, "status":1}, function (err, count) {
		 	if (err) callback();
		 	total_friends = count;
		 	Connection.count({"user_id_friend":user_id, "status":2}, function (err, count) {
		 		if(err) callback();
		 		total_pending = count;
		  		callback({"total_friends":total_friends,
		  				  "total_pending":total_pending});
		    });
		  });
	},
	getSparksCount:function(user_id, callback){
		var total_sparks=0;
		Spark.count({"user":user_id},
			function(err,count){
				if(err) callback();
				callback({"total_sparks":total_sparks});
			});
	}
}