// Get the packages we need
var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var userController = require('./controllers/user');
var User = require('./models/user');
var Connection = require('./models/connection');
var Message = require('./models/message');
var SparkTeam = require('./models/spark_team');
var ConnectionStream = require('./models/connection_stream');
var MessageStream = require('./models/message_stream');
var SparkTeamStream = require('./models/spark_team_stream');
var passport = require('passport');
var jwtauth = require('./jwtauth.js');
var authController = require('./controllers/auth');
var connectionsController = require('./controllers/connections');
var sparksController = require('./controllers/sparks');
var messageController = require('./controllers/messages');
var utilsController = require('./controllers/utils');
var categoriesController = require('./controllers/categories');
var tools = require('./tools/tools');

var app_users = [];
mongoose.connect('mongodb://localhost/isystematic');
// Create our Express application
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var mubsub = require('mubsub');
/*
var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
}
io.set("origins","*");*/

// Use the body-parser package in our application
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());
//app.use(allowCrossDomain);

// Use the passport package in our application
app.use(passport.initialize());

var requireAuth = function(req, res, next) {
	if (!req.user) {
		res.end('Not authorized', 401)
	}	else {
		next()
	}
}

// Create our Express router
var router = express.Router();

// Create endpoint handlers for /users
router.route('/users').post(userController.postUser)
  .get(jwtauth, requireAuth, userController.getUsers);
router.route('/users/:user_id')
  .get(userController.getUser);
router.route('/users/email/:email').get(userController.getUserByEmail);  
router.route('/users/signup').post(userController.signupUser);
router.route('/users/update_password').post(userController.updatePassword);
router.route('/users/upload').post(userController.postUpload);

router.route('/login').post(authController.login);

// user details routes
router.route('/users/details/basic').post(userController.postUserDetailsBasic);
router.route('/users/details/work').post(userController.postUserDetailsWork);
router.route('/users/details/contact').post(userController.postUserDetailsContact);

// connections routes
router.route('/connections').post(jwtauth, requireAuth,  connectionsController.postConnections);
router.route('/connections/:user_id').get(jwtauth, requireAuth,  connectionsController.getConnections);
router.route('/connections/:user_id/:userfriend').put(jwtauth, requireAuth,  connectionsController.putConnection);
router.route('/connections/pending/:user_id').get(jwtauth, requireAuth,  connectionsController.getPendingConnections);
router.route('/connections/invitations').post(jwtauth, requireAuth,  connectionsController.postInvitation);
router.route('/connections/count/:user_id/:status').get(jwtauth, requireAuth,  connectionsController.getConnectionsCount);
router.route('/connections/notifications/count/:user_id').get(jwtauth, requireAuth,  connectionsController.getNotificationsCount);
router.route('/connections/friends/:connection_id/:user_id').post(jwtauth, requireAuth,  connectionsController.postFriend);
router.route('/connections/friends/delete/:connection_id/:user_id').get(jwtauth, requireAuth,  connectionsController.getDeleteFriend);
router.route('/connections/friends_req/:user_id_friend/:user_id').post(jwtauth, requireAuth,  connectionsController.postFriendReq);
router.route('/connections/friends/followers/:user_id').get(jwtauth, requireAuth,  connectionsController.getAddFollowersList);
router.route('/connections/friends/following/:user_id').get(jwtauth, requireAuth,  connectionsController.getAddFollowingList);
router.route('/connections/friends/notifications/added/:user_id').get(jwtauth, requireAuth,  connectionsController.getFriendsNotifications);
router.route('/connections/friends/notifications/accepted/:user_id').get(jwtauth, requireAuth,  connectionsController.getFriendsNotificationsAccepted);

// spark routes
router.route('/sparks').post(jwtauth, requireAuth,  sparksController.postSpark);
router.route('/sparks').get(jwtauth, requireAuth,  sparksController.getAllSparks);
router.route('/sparks/pending/:user_id').get(jwtauth, requireAuth,  sparksController.getPendingSparks);
router.route('/sparks/accept/:user_id/:spark_id').get(jwtauth, requireAuth,  sparksController.getAcceptSparks);
router.route('/sparks/reject/:user_id/:spark_id').get(jwtauth, requireAuth,  sparksController.getRejectSparks);
router.route('/sparks/check/:spark_id').get(jwtauth, requireAuth,  sparksController.getSpark);
router.route('/sparks/close/:user_id/:spark_id').get(jwtauth, requireAuth,  sparksController.getCloseSpark);
router.route('/sparks/:spark_id').post(jwtauth, requireAuth,  sparksController.updateSpark);
router.route('/sparks/:user_id').get(jwtauth, requireAuth,  sparksController.getSparks);
router.route('/sparks/delete/:spark_id/:user_id').get(jwtauth, requireAuth,  sparksController.getDeleteSpark);
router.route('/sparks/notification/message').post(jwtauth, requireAuth,  sparksController.postSparkNotificationMessage);
router.route('/sparks/connections/:spark_id').get(jwtauth, requireAuth,  sparksController.getSparkConnections);
router.route('/sparksteam/notification/message').post(jwtauth, requireAuth,  sparksController.postSparkTeamNotificationMessage);
router.route('/sparks/count/:user_id').get(jwtauth, requireAuth,  sparksController.getSparksCount);
router.route('/sparks/heading/:user_id').get(jwtauth, requireAuth,  sparksController.getSparkHeading);
router.route('/sparks/heading/max/:user_id').get(jwtauth, requireAuth,  sparksController.getSparkHeadingMax);
router.route('/sparks/messages/:spark_id').get(jwtauth, requireAuth,  sparksController.getSparkMessages);
router.route('/sparks/conversation/:spark_id').get(jwtauth, requireAuth,  sparksController.getSparkConversation);
router.route('/sparksteam').post(jwtauth, requireAuth,  sparksController.postSparkTeam);
router.route('/sparksteam/status/:spark_id/:user_id').get(jwtauth, requireAuth,  sparksController.getSparkTeamStatus);
router.route('/sparksteam/:spark_id/:user_id').put(jwtauth, requireAuth,  sparksController.putSparkTeam);
router.route('/sparksteam/:spark_id').get(jwtauth, requireAuth,  sparksController.getSparkTeam);
router.route('/sparksteam/notifications/count/:user_id').get(jwtauth, requireAuth,  sparksController.getNotificationsCount);
router.route('/sparksteam/notifications/:user_id').get(jwtauth, requireAuth,  sparksController.getNotificationsSparkTeam);

// messages routes
router.route('/messages').post(jwtauth, requireAuth,  messageController.postMessage);
router.route('/messages/:message_id').put(jwtauth, requireAuth,  messageController.putMessage);
router.route('/messages/:user_id').get(jwtauth, requireAuth,  messageController.getMessages);
router.route('/messages/new/:spark_id/:message_id').get(jwtauth, requireAuth,  messageController.getNewMessages);
router.route('/messages/count/:user_id').get(jwtauth, requireAuth,  messageController.getMessagesCount);
router.route('/messages/notifications/:user_id').get(jwtauth, requireAuth,  messageController.getNotificationsMessages);

// categories routes
router.route('/categories').post(jwtauth, requireAuth,  categoriesController.postCategory);
router.route('/categories').get(jwtauth, requireAuth,  categoriesController.getCategories);

// utils routs
router.route('/utils/clear/notifications').post(jwtauth, requireAuth,  utilsController.postClearNotifications);

// Register all our routes with /api
app.use('/api', router);

// Start the server
app.listen(3000);
console.log('Listening on port 3001');
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

server.listen(3001);
console.log('Socket.io on port 3001');

// SOCKET CONNECT MOD SUB/PUB
var sockets_users = [];

io.on('connection', function (socket) {
    sockets_users.push(socket);
});
io.on('disconnect', function (socket){
	console.log("Disconnect! " + socket.id);

    sockets_users.pull(socket);
});

var client = mubsub('mongodb://localhost:27017/isystematic');
var channelConnection = client.channel('connectionstreams');
var channelMessages = client.channel('messagestreams');
var channelSparkTeams = client.channel('sparkteamstreams');

client.on('error', console.error);
channelConnection.on('error', console.error);
channelMessages.on('error', console.error);
channelSparkTeams.on('error', console.error);

// ---------------   New Friends
channelConnection.on('document', function(conn) {
	tools.countNotifications(conn.user_id,function(nroNoti){
		sockets_users.forEach(function(socketUser,i){
			socketUser.emit('notification_friend_' + conn.user_id, {"notifications":nroNoti});
			socketUser.emit('chk_connections_' + conn.user_id_friend, nroNoti);
		});
		
	});
	tools.countNotifications(conn.user_id_friend,function(nroNoti){
		sockets_users.forEach(function(socketUser,i){
			socketUser.emit('notification_friend_' + conn.user_id_friend, {"notifications":nroNoti});
			
		});
	});
	tools.getConnectionsCount(conn.user_id,function(connections){
		sockets_users.forEach(function(socketUser,i){
			socketUser.emit('chk_connections_' + conn.user_id, connections);
		});
	});
	tools.getConnectionsCount(conn.user_id_friend,function(connections){
		sockets_users.forEach(function(socketUser,i){
			socketUser.emit('chk_connections_' + conn.user_id_friend, connections);
		});
	});

	var records = [];
	var user_id = conn.user_id_friend;
	tools.getFriendsNotifications(user_id, function(res){

	records = records.concat(res);
		tools.getFriendsNotificationsAccepted(user_id, function(res){
		
		records = records.concat(res);
		tools.getNotificationsSparkTeam(user_id, function(res){

			records = records.concat(res);
			tools.getNotificationsMessages(user_id, function(res){
				records = records.concat(res);
				sockets_users.forEach(function(socketUser,i){

					socketUser.emit('notification_friend_msg_' + user_id, records);
				});
			});
		});
	});
	});


});

// ------------    New SparkTeam
channelSparkTeams.on('document', function(msg) {
    tools.countNotifications(msg.user_id,function(nroNoti){
    		sockets_users.forEach(function(socketUser,i){
				socketUser.emit('notification_friend_' + msg.user_id, {"notifications":nroNoti});
			});
		});

		var records = [];

		tools.getFriendsNotifications(msg.user_id, function(res){

		records = records.concat(res);
			tools.getFriendsNotificationsAccepted(msg.user_id, function(res){
			
			records = records.concat(res);
			tools.getNotificationsSparkTeam(msg.user_id, function(res){

				records = records.concat(res);
				tools.getNotificationsMessages(msg.user_id, function(res){
					records = records.concat(res);
					sockets_users.forEach(function(socketUser,i){
						socketUser.emit('notification_friend_msg_' + msg.user_id, records);
					});
				});
			});
		});
		});

		tools.getSparksCount(msg.user_id, function(res){
			sockets_users.forEach(function(socketUser,i){
				socketUser.emit('chk_connections_' + msg.user_id, res);
			});
		});
});

// --------- Check new conversation
channelMessages.on('document', function(msg) {

	tools.countNotifications(msg.user_id,function(nroNoti){
		sockets_users.forEach(function(socketUser,i){
			socketUser.emit('notification_friend_' + msg.user_id, {"notifications":nroNoti});
		});
	});

	var records = [];

	tools.getFriendsNotifications(msg.user_id, function(res){

		records = records.concat(res);
			tools.getFriendsNotificationsAccepted(msg.user_id, function(res){
			
			records = records.concat(res);
			tools.getNotificationsSparkTeam(msg.user_id, function(res){

				records = records.concat(res);
				tools.getNotificationsMessages(msg.user_id, function(res){
					records = records.concat(res);
					sockets_users.forEach(function(socketUser,i){
						socketUser.emit('notification_friend_msg_' + msg.user_id, records);
					});
				});
			});
		});
	});

	// new conversation msg
	console.log("adding new message");
    tools.getNewMessages(msg.spark_id,msg.msg_id, function(conversations){
			sockets_users.forEach(function(socketUser,i){
				socketUser.broadcast.emit('new_conversation_' + msg.spark_id, conversations);
			});
		});
});

