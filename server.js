var app = require('http').createServer(handler),
    io = require('socket.io').listen(app),
	ws = require("websocket-server"),
	fs = require("fs"),
	url = require("url"),
	port = process.env.PORT || 5000;
app.listen(port);
console.log("HTTP server listening on port " + port);

function handler(req, resp){
		var r_url = url.parse(req.url);
		if(r_url.pathname === "/")
		{
			resp.writeHead(200, {"Content-Type" : "text/html"});
			var clientui = fs.readFileSync("chess.html");
			resp.write(clientui);
			resp.end();
		}
		else{
			var filename = r_url.pathname.substring(1),
				type;

			switch(filename.substring(filename.lastIndexOf(".") + 1)){
				case "html":
				case "htm":
					type = "text/html; charset=UTF-8";
				break;
				case "js":
					type = "application/javascript; charset=UTF-8";
				break;
				case "css":
					type = "text/css; charset=UTF-8";
				break;
				case "svg":
					type = "image/svg+xml";
				break;
				case "png":
					type= "image/png";
				break;
				default:
					type = "application/octet-stream";
				break;
			}

			fs.readFile(filename, function(err, content){
				if(err){
					resp.writeHead(404, {
						"Content-Type" : "text/plain; charset=UTF-8"
					});
					resp.write(err.message);
					resp.end();
				}
				else{
					resp.writeHead(200, {
						"Content-Type" : type
					});
					resp.write(content);
					resp.end();
				}
			});
		}
}


/* websocket server 
   all sent with JSON encoding
*/
var Game = function(w, b){

	var that = this;//reference in event functions

	this.wPlayer = w;
	this.bPlayer = b;
	this.waitingForPromotion = false;

	console.log("Game started");

	//remove the listener which removes it from the queue (since it no longer is on the queue)
	this.wPlayer.removeAllListeners('disconnect');
	this.bPlayer.removeAllListeners('disconnect');

	this.wPlayer.on('disconnect', function(){
		//alert other player
		that.bPlayer.emit('partnerDisconnect');
	});

	this.bPlayer.on('disconnect', function(){
		that.wPlayer.emit('partnerDisconnect');
	});

  this.wPlayer.on('chat', function(data){
    that.bPlayer.emit('chat', data);
  });

  this.bPlayer.on('chat', function(data){
    that.wPlayer.emit('chat', data);
  });

	this.wPlayer.on('movemade', function(data){
		console.log("White player made a move");
		that.bPlayer.emit('opposing_move', data);
	});
	this.bPlayer.on('movemade', function(data){
		console.log("Black player made a move");
		that.wPlayer.emit('opposing_move', data);
	});
	//all event listeners to w and b sockets for communication
	this.init();
};
Game.prototype = {
	wPlayer : null,
	bPlayer : null,
	init: function(){
		//send messages to wPlayer and bPlayer that game has started, and give them the color assigned (since they may not know the color)
		this.wPlayer.emit("matchfound", {
			color: 'W'
		});
		this.bPlayer.emit("matchfound", {
			color: 'B'
		});
	}
}

var queue = {
	'W' : [],
	'B' : [],
	'U' : [] //undefined (player does not care which color)
	};
	games = [];

//may need to add some securing to prevent thread accidents in the following method later
io.sockets.on('connection', function (sk) {
 var w = null,
 	 b = null,
 	 skColor = false;
  console.log("web socket connection recieved");


  sk.on('setup', function (data) {
  	 //remove this event once match is found and setup is complete  
	  sk.on('disconnect', function(){
		  	if(!!queue[skColor]){
				var index = queue[skColor].indexOf(sk);
				console.log("Removing from queue");
				queue[skColor].splice(index,1);
			}
	  });
	  console.log(data);
  	skColor = data.color;
  	if(!skColor){skColor = 'U';}
  	
  	if(skColor == 'W'){
  		if(queue['B'].length > 0){
  			b = queue['B'].shift();
  			//start new game
  			games.push(new Game(sk, b));
  		}
  		else if(queue['U'].length > 0){
  			b = queue['U'].shift();
  			//start new game
  			games.push(new Game(sk, b));
  		}
  		else{
  			queue['W'].push(sk);
  		}
  	}
    else if(skColor == 'B'){
  		if(queue['W'].length > 0){
  			w = queue['W'].shift();
  			//start new game
  			games.push(new Game(w, sk));
  		}
  		else if(queue['U'].length > 0){
  			w = queue['U'].shift();
  			//start new game
  			games.push(new Game(w, sk));
  		}
  		else{
  			queue['B'].push(sk);
  		}
  	}
  	else{ 
  		//either white or no color specified, add player to whichever queue is waiting for oponent
  		if(queue['W'].length > 0){
  			w = queue['W'].shift();
  			//start new game
  			games.push(new Game(w, sk));
  		}
  		else if(queue['B'].length > 0){
  			b = queue['B'].shift();
  			//start new game
  			games.push(new Game(sk, b));
  		}
  		else if(queue['U'].length > 0){
  			w = queue['U'].shift();//just give it to white
  			//start new game
  			games.push(new Game(w, sk));
  		}
  		else{
  			queue['U'].push(sk);
  		}
  	}

  	console.log("length of queue['U']");
    console.log(queue['U'].length);
  });
});
