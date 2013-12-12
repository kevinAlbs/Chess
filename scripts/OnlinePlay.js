CHESSAPP.onlinePlay = {
	sk : null,
	/*
	   connects to websocket server, and sets up events for when a matched player is found
	   */
	connect: function(stg, callback){
		var op = CHESSAPP.onlinePlay;
		var hostPort = "http://localhost:" + CHESSAPP.globalSettings.port;
		if(CHESSAPP.globalSettings.live){
			hostPort = "http://livechess.herokuapp.com";
		}
		this.sk = io.connect(hostPort);
		CHESSAPP.ui.statusUpdate({type: 'fb', msg: 'Searching for partner...'});
		this.sk.emit('setup', {color: stg.preferredColor});
		this.sk.on("chat", function(data){
			CHESSAPP.GamePlay.chatMessage(data);
		});
		this.sk.on("partnerDisconnect", function(){
			CHESSAPP.GamePlay.statusUpdate({type: 'e', msg: 'Your partner has disconnected'});
			//CHESSAPP.GamePlay.showSplash();
		});
		this.sk.on("disconnect", function(){
			CHESSAPP.GamePlay.statusUpdate({type: 'e', msg: 'The server seems to be down. Please refresh the page to try again. We are sorry for the inconvenience.'});
		});
		this.sk.on('matchfound', function (data) {

			CHESSAPP.GamePlay.statusUpdate({type: 'fb', msg: 'Partner found, game has begun'});
			CHESSAPP.GamePlay.statusUpdate({type: 'fb', msg : 'Playing as ' + (data.color == 'W' ? "white" : 'black')})
			CHESSAPP.GamePlay.setOnlineColor(data.color); //maybe change this to decouple
		callback();
		});
		this.sk.on('opposing_move', function(data){
			CHESSAPP.GamePlay.onlineMove(data);
			CHESSAPP.GamePlay.statusUpdate({type: 's', msg: "It's your move!"});
		});
	},
	sendMove: function(stg){
		this.sk.emit('movemade', stg);
		CHESSAPP.GamePlay.statusUpdate({type: 's', msg: "Move made, waiting for partner"});
		console.log("Sending messsage");
	},
	sendChat: function(stg){
		stg.local = false;//because the recieved message will not be local
		this.sk.emit('chat', stg);
	},
	handleMsg : function(e){
		var resp = JSON.parse(e.data);
		console.log(resp);
	}
};