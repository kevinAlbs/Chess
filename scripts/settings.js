/**
* Online chess game with websockets, webworkers, and more
* @namespace CHESSAPP
*/
var CHESSAPP = {};
/**
* Directory where resources for chess pieces are
* @property imageDir
*/  
CHESSAPP.globalSettings = {
	imageDir : "images/",
	debug : false,
	live: true,
	port: 5000,
	host: "http://kevinalbs.com:5000"
};

var gameSettings = {
	containerID : "container",
	online: true,
	preferredColor: false
};
