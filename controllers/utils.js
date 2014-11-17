var Spark = require('../models/spark');
var Connection = require('../models/connection');
var SparkNotificationMessage = require('../models/spark_msg_notification');
var SparkTeam = require('../models/spark_team');
var User = require('../models/user');
var Message = require('../models/message');
var async = require('async');

exports.postClearNotifications = function(req,res){
	
	async.parallel(
    {
        conn: function(callback){
			Connection.update(
				{$or:[ {"user_id":req.body.user_id}, {"user_id_friend":req.body.user_id}]},
				{"user_views":1},
				{ multi: true },
				function(err,conn){
					if(err)
						res.send(err);
					callback(err, conn);
				}
			);
		},
		sp_team: function(callback){
			SparkTeam.update(
				{"user_id":req.body.user_id},
				{"user_views":1},
				{ multi: true },
				function(err,conn){
					if(err)
						res.send(err);
					callback(err, conn);
				}
			);
		},
		sp_msg: function(callback){
			SparkNotificationMessage.update(
				{"user":req.body.user_id},
				{"user_views":1},
				{ multi: true },
				function(err,conn){
					if(err)
						res.send(err);
					callback(err, conn);
				}
			);
		},
	},
	function(e, r){
    	if(e)
    		res.send(e);
    	res.json({"update":1});
    });
}
