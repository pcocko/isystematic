var Spark = require('../models/spark');
var SparkTeam = require('../models/spark_team');
var User = require('../models/user');
var UserDetail = require('../models/user_details');
var Notification = require('../models/notification');
var SparkNotificationMessage = require('../models/spark_msg_notification');
var Message = require('../models/message');
var SparkTeamStream = require('../models/spark_team_stream');
var MessageStream = require('../models/message_stream');
var tools = require('../tools/tools');
var async = require('async');
var moment = require('moment');

// Create endpoint /api/sparks/ for POSTS
// Save a spark
exports.postSpark = function(req, res) {
  // Create a new instance of the User model
  var spark = new Spark();

  // Set the notification properties that came from the POST data
  if(req.body.end_date)
    req.body.end_date =  moment(req.body.end_date,"MM/DD/YYYY").format("MM/DD/YYYY");
  else
    req.body.end_date =  moment(new Date()).format("MM/DD/YYYY");
  spark.set(req.body);
  // Save the user and check for errors
  spark.save(function(err) {
    if (err)
      res.send(err);

    res.json({ message: 'Spark added to the system!', data: spark });
  });
}

// Create endpoint /api/sparks for GET
exports.updateSpark = function(req, res) {

  Spark.findOne({"_id":req.params.spark_id},
    function(err, spark){
      if(err) res.send(err);
      if(spark && req.body.email)
        spark.email = req.body.email;
      if(spark && req.body.status)
        spark.status = req.body.status;
      if(spark && req.body.user_id)
        spark.user = req.body.user_id;
      if(spark)
        spark.save(function(err, spark, numerAffected){
          if(err) res.send(err);
          res.send(spark);
        });
    }
  );
}

exports.getAllSparks = function(req, res) {
  // Use the Spark model to find all sparks
  Spark.find({}, function (err, docs) {
  if (err)
      res.send(err);

    res.json(docs);
  });
};

// Create endpoint /api/users/sparks/:user_id for GET
exports.getSparks = function(req, res) {
  // Use the Spark model to find all sparks
  Spark.find({"user":req.params.user_id}, function (err, docs) {
  if (err)
      res.send(err);

    res.json(docs);
  });
};

// Get a Spark. Create endpoint /api/spark/:spark_id for GET
exports.getSpark = function(req, res) {
  // Use the Spark model to find one spark
  Spark.findById(req.params.spark_id, function (err, docs) {
  if (err)
      res.send(err);
    res.json(docs);
  });
};

// Create endpoint /api/sparks/count/:user_id for GET
exports.getSparksCount = function(req, res) {
  // Use the Spark model to count all user
  Spark.count({"user":req.params.user_id}, function (err, count) {
 	if (err)
      res.send(err);
  	
    res.json({"count":count});
  });
};

// Create endpoint /api/sparksteam/ for POSTS
// Save a sparkTeam
exports.postSparkTeam = function(req, res) {
  // Create a new instance of the SparkTeam model
  var sparkteam = new SparkTeam();
  // Set the sparkteam properties that came from the POST data
  var data = {
    "user_id": req.body.user_id,
    "spark_id": req.body.spark_id
  };
  sparkteam.set(data);

  // Save the sparkteam and check for errors
  sparkteam.save(function(err,sparkteam) {
    if (err)
      res.send(err);
    var sparkTeamStream = new SparkTeamStream(data);
    sparkTeamStream.save(function(err,result){
      if(err) res.send(err);
      SparkTeam.findOne({"user_id":sparkteam.user_id,"spark_id":sparkteam.spark_id})
        .populate("user_id spark_id")
        .exec(
          function(err, sparkteam){
            if(err) res.send(err);        
            res.json({"title":sparkteam.spark_id.title, "email":sparkteam.user_id.email});
          });
        } 
    );
  });
}

// Create endpoint /api/sparksteam/:spark_id/:user_id for PUT
exports.putSparkTeam = function(req, res) {
  SparkTeam.update(
          {"user_id":req.params.user_id,"spark_id":req.params.spark_id},
          {"user_views":req.body.user_views,"status":req.body.status},
          {upsert:false},
          function(err, model) {
            if(err)
                res.send(err);

            var data = {
              "user_id":req.params.user_id,
              "spark_id":req.params.spark_id,
              "user_views":req.body.user_views,
              "status":req.body.status
            };
            var sparkTeamStream = new SparkTeamStream(data);
            sparkTeamStream.save(function(err,results){
              if(err) res.send(err);
              SparkTeam.find({"user_id":req.params.user_id,"spark_id":req.params.spark_id},
                  function(err, model) {
                        if(err)
                            res.send(err);
                         res.json(model);
                      });
            });
          }
  );
  


  
};

// Create endpoint /api/sparksteam/:spark_id for GET
exports.getSparkTeam = function(req, res) {
  // Use the SparkTeam model to find all sparkTeam
  SparkTeam.find({"spark_id":req.params.spark_id},function (err, docs) {
  if (err)
      res.send(err);

    res.json(docs);
  });
};

// Get sparks connections
exports.getSparkConnections = function(req, res){
  var records = [];
  SparkTeam.findOne({"spark_id":req.params.spark_id})
  .populate("spark_id user_id").exec(

    function(err, sparkteam){
      if(err)
        res.send(err);
      if(!sparkteam){
        res.send({"message":"SparkTeam not found"});
        return;
      }

      User.populate(sparkteam,
                {path:"sparkteam.user_id.details", model:"UserDetail"},
                function(err, users){
                  if(err)
                    res.send(err);
                  var obj = new Object();
                  obj.user_id = sparkteam.user_id;
                  obj.email = sparkteam.user_id.email;
                  if(sparkteam.user_id.details){
                    obj.image = sparkteam.user_id.details.image;
                    obj.primary_email = sparkteam.spark_id.email;
                    obj.title = sparkteam.spark_id.title;
                    obj.create_date = moment(sparkteam.spark_id.create_date).format("DD-MM-YYYY HH:mm:ss");
                    obj.end_date = moment(sparkteam.spark_id.end_date).format("DD-MM-YYYY HH:mm:ss");
                  }
                  records.push(obj);
                  res.json(records);
                }
      );
    }
  );
  
}

// Create endpoint /api/sparks/notification/message
exports.postSparkNotificationMessage = function(req, res) {
  Spark.findById(req.body.spark_id,
    function(err,spark){
      // Create a new instance of the SparkNotificationMessage model
      var sparkNotificationMessage = new SparkNotificationMessage();
      sparkNotificationMessage.message = req.body.message;
      sparkNotificationMessage.spark = req.body.spark_id;
      sparkNotificationMessage.notice_user = req.body.user_id;
      if(sparkNotificationMessage.notice_user){
        sparkNotificationMessage.user = spark.user;
        if(spark.user.toLowerCase() != req.body.user_id.toLowerCase())
          sparkNotificationMessage.save(function(err,sparkNotificationMessage){
            if(err) res.send(err);
             var data = {
              "msg_id":req.body.message,
              "user_id":spark.user,
              "spark_id":req.body.spark_id,
              "target_user_id":req.body.user_id
            };
            var messageStream = new MessageStream(data);
            messageStream.save(function(err,msgStream){
              if(err)res.send(err);
              res.json(sparkNotificationMessage);  
            }
          );
        });
        else
          res.json({"message":"Not found other users in same spark"});
      }
      else
        res.json({"message":"Not found other user"});  
    
    });
}

// Create endpoint /api/sparksteam/notification/message
exports.postSparkTeamNotificationMessage = function(req, res) {
  var count = 0;
  SparkTeam.find({"spark_id":req.body.spark_id},
    function(err,sparks){
      if(err) res.send(err);
      async.each(
        sparks,
        function(spark, callback){
          // Create a new instance of the SparkNotificationMessage model
          var sparkNotificationMessage = new SparkNotificationMessage();
          sparkNotificationMessage.message = req.body.message;
          sparkNotificationMessage.spark = req.body.spark_id;
          sparkNotificationMessage.notice_user = req.body.user_id;
          sparkNotificationMessage.user = spark.user_id;
          if(spark.user_id.toLowerCase() != req.body.user_id.toLowerCase())
            sparkNotificationMessage.save(function(err,sparkNotificationMessage){
              if(err) res.send(err);
              var data = {
                "msg_id":req.body.message,
                "user_id":spark.user_id,
                "spark_id":req.body.spark_id,
                "target_user_id":req.body.user_id
              };
              var messageStream = new MessageStream(data);
              messageStream.save(function(err,msgStream){
                if(err)res.send(err);
                ++count;
                callback();
              });
            });
          else
            callback();
        },
        function(err){
          if(count>0) 
            res.json({"message": (count + " message notifications created")});
          else
            res.json({"message":"Not found other users in same spark"});
        }
      );
    });
}

// Get status for a sparkteam
exports.getSparkTeamStatus = function(req, res){
  SparkTeam.findOne({"spark_id":req.params.spark_id,"user_id":req.params.user_id})
            .populate("spark_id")
            .exec(function(err,sparkteam){
               if(err) res.json(err);
               if(sparkteam && sparkteam.spark_id){
                 User.findById(sparkteam.spark_id.user)
                  .populate("details")
                  .exec(function(err,user){
                    res.json({"status":sparkteam.status,
                              "firstname":user.details.firstname,
                              "image":user.details.image,
                              "status_spark":sparkteam.spark_id.status
                            });
                  });
                }
                else
                  res.json({});
            });
}

// Get spark conversation
exports.getSparkConversation = function(req, res){
  var records = [];
  Message.find({"spark_id":req.params.spark_id})
          .sort('-date')
          .populate("user_id spark_id")
          .exec(function(err,messages){
            if(err)
              res.send(err);
            async.eachSeries(
              messages,
              function(msg, callback){
               
                User.populate(msg,
                  {path:"user_id.details",select:"image firstname lastname",model:"UserDetail"},
                  function(err, user){
                    if(err)
                      res.send(err);
                    var obj = new Object();
                    obj.message_id = msg._id;
                    obj.message = msg.message;
                    obj.attachment = msg.attachment;
                    obj.date = moment(msg.date).add(-1,'h').format("DD-MM-YYYY HH:mm:ss");
                    obj.image = msg.user_id.details.image;
                    obj.status = msg.spark_id.status;
                    obj.firstname = msg.user_id.details.firstname;
                    obj.lastname = msg.user_id.details.lastname;
                    records.push(obj);
                    callback();  
                  });
              },
              function(err){ 

                res.json(records);
              }
            );
          });
}

// Create endpoint /api/sparkteam/notifications/count/:user_id for GET
exports.getNotificationsCount = function(req, res) {
  // Use the SparkTeam model to find all sparks associated with a user
  SparkTeam.count({"user_id":req.params.user_id, "user_views":0}, function (err, count) {
  if (err)
      res.send(err);

    res.json({"count":count});
    
  });
};

// Notifications when a new spark is created
exports.getNotificationsSparkTeam = function(req, res){

  tools.getNotificationsSparkTeam(req.params.user_id,function(records){
      res.json(records);
  });
  /*
  var records = [];

  SparkTeam.find({"user_id":req.params.user_id,"user_views":0})
  .select("spark_id")
  .populate("spark_id").exec(

    function(err, sparks){
      if(err)
        res.send(err);

      async.each(
        sparks,
        function(spark, callback){
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
                  noti.message = "Invites you " + spark.spark_id.title;
                  records.push(noti);
                  callback();
                }
              );
              
          });
        },
        function(err){ 
          res.json(records);
        }
      );
    }
  );*/
}

// Return last sparks created ordered by spark_id
// /api/sparks/heading/:user_id
exports.getSparkHeadingMax = function(req, res){
  
  var records = [];
  Message.aggregate([
      {
        $group:
          {
            _id : "$spark_id",
            maxMsgSparkId : { $max : "$_id"}
          }
      },
      {
        $sort: {
            _id:-1
        }
      }
    ], function(err, results){
      if(err) res.send(err);
      async.eachSeries(
              results,
              function(maxSpark, callbackFinal){
                  async.parallel(
                  {
                      team: function(callback){
                        SparkTeam.find({"user_id":req.params.user_id,"_id":maxSpark._id})
                        .populate("spark_id",'title _id create_date user', {"user" : {'$ne':req.params.user_id }} )
                        .exec(function(err,sparks){
                          if(err)
                            res.send(err);
                          sparks = sparks.filter(function(doc){
                           return (doc.spark_id != null);
                          });
                          callback(err, sparks);
                        });
                      },
                      sparks: function(callback){
                          Spark.find({"user": req.params.user_id,"_id":maxSpark._id})
                            .select("title _id create_date")
                            .exec(function (err, docs) {
                              callback(err, docs);
                          });
                      },
                    }, 
                    function(e, r){
                        var allModels = r.team.concat(r.sparks);
                        async.each(
                          allModels,
                          function(spark, callback){
                            var obj = new Object();
                            if(spark.spark_id){
                              obj._id = spark.spark_id._id;
                              obj.title = spark.spark_id.title;
                              obj.create_date = moment(spark.spark_id.create_date).add(-1,'h').format("DD-MM-YYYY HH:mm:ss");
                            }
                            else{
                              obj._id = spark._id;
                              obj.title = spark.title;
                              obj.create_date = moment(spark.create_date).add(-1,'h').format("DD-MM-YYYY HH:mm:ss");
                            }
                            Message.find({"spark_id":obj._id})
                            .sort({"_id":-1})
                            .limit(1)
                            .exec(
                              function(err,messages){
                                if(err) res.send(err);
                                async.each(
                                  messages,
                                  function(msg,callback_in){
                                    obj.message = msg.message;
                                    obj.date = moment(msg.date).add(-1,'h').format("DD-MM-YYYY HH:mm:ss");
                                    User.findById(msg.user_id)
                                      .populate("details")
                                      .exec(function(err,user){
                                          if(user.details)
                                            obj.firstname = user.details.firstname; 
                                          obj.user_id = user._id;
                                          records.push(obj);
                                          callback_in();
                                      });
                                  },
                                  function(req){
                                    callback();
                                  }
                                );    
                              }
                            );                          
                          },
                          function(req){
                            callbackFinal();
                          }
                        );
                    }
                  );
                },
                function(err){ 
                  records.sort(datesDescendingById);
                  res.json(records);
                }
              );
            }
    );
}

// Get message from 
exports.getSparkHeading = function(req, res){
  var records = [];
  async.parallel(
    {
      sparks: function(callback){

        Spark.find({"user":req.params.user_id},
            "title _id create_date",
            function(err,results){
              callback(err, results);
            });
      },
      sp_team: function(callback){
        SparkTeam.find({"user_id":req.params.user_id})
            .populate({ path: 'spark_id', select: 'title _id create_date' })
            .exec(
              function(err,results){
                callback(err, results);
              });
      }
    },
    function(e, r){
      if(e)
        res.send(e);
      var allModels = r.sparks.concat(r.sp_team);

      async.each(
        allModels,
        function(spark, callback){
         
          var obj = new Object();
          if(spark.spark_id){
            obj._id = spark.spark_id._id;
            obj.title = spark.spark_id.title;
            obj.create_date = moment(spark.spark_id.create_date).add(-1,'h').format("DD-MM-YYYY HH:mm:ss");
          }
          else{
            obj._id = spark._id;
            obj.title = spark.title;
            obj.create_date = moment(spark.create_date).add(-1,'h').format("DD-MM-YYYY HH:mm:ss");
          }

          Message.findOne({"spark_id":spark._id},
            function(err,msg){
              if(err)res.send(err);

              if(msg){
                User.findById(msg.user_id)
                  .populate("details")
                  .exec(function(err,user){
                    if(err)res.send(err);
                    obj.firstname = user.details.firstname;
                    obj.user_id = user._id;
                    obj.message_id = msg._id;
                    obj.message = msg.message;
                    records.push(obj);
                    callback();
                  });
              }
              else{
                records.push(obj);
                callback();
              }
            });
        },
        function(err){ 
          records = deleteDuplicates(records);
          records.sort(datesDescendingById);
          res.json(records);
        }
      );
    });
}

//Return the spark message
exports.getSparkMessages = function(req, res){
  var obj = new Object();
  Message.find({"spark_id":req.params.spark_id})
    .populate("user_id")
    .sort({"_id":-1})
    .limit(1)
    .exec(function(err,messages){
      if(err)
        res.send(err);
      async.each(
      messages,
      function(msg, callback){
        obj.msg_date = moment(msg.date).format("DD-MM-YYYY HH:mm:ss");
        obj.message = msg.message;
        User.findById(msg.user_id).populate(
          "details").exec(
          function(err,user){
            if (err) throw err;
            if(user.details.firstname)
              obj.firstname = user.details.firstname;
            else
              obj.firstname = "";
            obj.user_id = user._id;
            callback();
          }
        );
        
      }
      ,
      function(err){ 
        res.json(obj);
      }
    );
    });
}

//Delete spark
exports.getDeleteSpark = function(req,res){
  Spark.remove({"_id":req.params.spark_id,"user":req.params.user_id},
    function(err,spark){
    if (err)
      res.send(err);

    res.json({ message: 'Spark removed from user ' + req.params.user_id, success:1});
  });
}

//Get pending sparks
exports.getPendingSparks = function(req,res){
  var records = [];

  SparkTeam.find({"user_id":req.params.user_id,"status":2})
    .populate("user_id spark_id")
    .exec(function(err,spTeams){
      if(err)res.send(error);
      async.each(
        spTeams,
        function(spTeam, callback){
          if(spTeam.user_id && spTeam.user_id.details){
            User.findById(spTeam.user_id)
                .populate("details")
                .exec(function(err,user){
                  var obj = new Object();
                  obj.spark_id = spTeam.spark_id._id;
                  obj.title = spTeam.spark_id.title;
                  obj.email = user.email;
                  obj.image = user.details.image;
                  records.push(obj);
                  callback();
                });
              }
          },
          function(err){
            res.json(records);
          }
        );
    });
}

exports.getAcceptSparks = function(req,res){
  SparkTeam.update({"user_id":req.params.user_id,"spark_id":req.params.spark_id},
                    {"status":1}, function(err,spTeam){
        if(err) res.send(err);
        
        var data = {
          "user_id":req.params.user_id,
          "spark_id":req.params.spark_id,
          "status":1
        };

        var sparkTeamStream = new SparkTeamStream(data);
        sparkTeamStream.save(function(err,results){
          Spark.findById(req.params.spark_id)
                .exec(function(err,spark){
                  User.findById(req.params.user_id)
                    .populate("details")
                    .exec(function(err,user){
                      if(err)res.send(err);
                      res.json({
                            "firstname":user.details.firstname,
                            "lastname":user.details.lastname,
                            "title":spark.title,
                            "email":user.email
                          });
                    });
                  }
                );
          });
        }
        
  );
}

exports.getCloseSpark = function(req,res){
  var records = [];
 
  Spark.findOne({"_id":req.params.spark_id,"user":req.params.user_id})
    .exec(function(err,spark){
      if(err) res.send(err);
      if(spark){
        Spark.update({"user_id":req.params.user_id,"_id":req.params.spark_id},
                      {"status":2}, function(err,sparkUpdated){
          SparkTeam.find({"spark_id":req.params.spark_id})
            .populate("spark_id user_id")
            .exec(function(err,sparkteams){
                 async.each(
                  sparkteams,
                  function(spTeam, callback){
                    if(spTeam.user_id && spTeam.user_id.details){
                      User.findById(spTeam.user_id)
                          .populate("details")
                          .exec(function(err,user){
                            var obj = new Object();
                            obj.spark_id = spTeam.spark_id._id;
                            obj.title = spTeam.spark_id.title;
                            obj.email = user.email;
                            obj.name = user.details.firstname + " " + user.details.lastname;
                            records.push(obj);
                            callback();
                          });
                        }
                  },
                  function(err){
                    res.json(records);
                  }
                );
            });  
        });
      }
      else
        res.json({"message":"Spark not found"});
    });
}

exports.getRejectSparks = function(req,res){
  SparkTeam.remove({"user_id":req.params.user_id,"spark_id":req.params.spark_id},
                    function(err,spTeam){
                      if(err) res.send(err);
                      res.json({ message: 'SparkTeam removed', success:1});
                    });
}

function datesDescendingById(a, b) {
  if(a._id < b._id) return 1;
  if(a._id > b._id) return -1;
  return 0;
}

function deleteDuplicates(arr){
  var arrResult = {};
  var nonDuplicatedArray= [];
  for (i = 0, n = arr.length; i < n; i++) {
      var item = arr[i];
      arrResult[ item._id ] = item;
  }  
  i = 0;    
  for(var item in arrResult) {
      nonDuplicatedArray[i++] = arrResult[item];
  }
  return nonDuplicatedArray;
}