// based on http://codular.com/node-web-sockets

var http = require('http');

// port to listen
var port = 1234;

// creating server object
var server = http.createServer(function(request, response) {});

// define port to listen
server.listen(port, function() {
    console.log((new Date()) + ' server is listening on port ' + port);
});

// turn into ws://
var WebSocketServer = require('websocket').server;

wsServer = new WebSocketServer({
    httpServer: server
});


// variables
var clients = [];
var people  = [];
var count   = 0;


// listener on request connection
wsServer.on('request', function(r){

    // Code here to run on connection
    var connection = r.accept('echo-protocol', r.origin);

    var id = count++;

    // setting the client ( Connected without people ID )
    clients[id] = connection;


    // Create event listener
    connection.on('message', function(m) {

        // plain message
        var plain  = m.utf8Data;

        // try to convert message to json
        try {


            // convert the request into json
            var obj    = JSON.parse(plain);

            // if undefined command
            if (typeof obj.command == "undefined" ) {
                console.log('UNDEFINED COMMAND');
            }



            switch ( obj.command ) {


                // init the negotiation
                case "ini" :

                    var pid = obj.pid;

                    // Attach people id - Human readable
                    people[id] = [id, pid];


                    // return json object
                    var obj = { "command" : "ini", "response" : "ok", "pid" : pid };
                        obj = JSON.stringify(obj);

                    // send command to client
                    clients[id].sendUTF(obj);

                break;




                // Request initial notifications
                case "requestIni":

                    // loops through the people array
                    // can be a from mysql database, mongodb, etc
                    for ( var x in people ) {

                        // if people id (human readable) is connected, send pusth notification
                        if (people[x][1] == obj.pid) {

                            var cid = people[x][0];

                            var res = { "command" : "push",
                                          "notes" : [
                                               { "id": 1, "title" : 'note 1'},
                                               { "id": 2, "title" : 'note 2'}]
                            };

                            res = JSON.stringify(res);
                            clients[cid].sendUTF(res);
                        }

                    }

                break;






                // send push to other people
                // example of resend command
                /*

                 {
                    "command" : "resend",
                    "pid" : 10,
                    "object" : {
                        "command" : "push",
                        "notes" : [
                            { "id" : 100,  "title" : "resend 1"},
                            { "id" : 1001, "title" : "resend 2"}
                        ]
                    }
                 }
                 */

                case "resend" :

                    // lopp through the people array
                    for (var x=0; x < people.length; x++) {

                        // if receiver is online (in array)
                        try {

                            if ( people[x][1] == obj.pid ) {

                                var cid = people[x][0];
                                var o   = JSON.stringify(obj.object);

                                clients[cid].sendUTF(o);

                            }

                        }catch(e) {
                            // console.log(e.message);
                        }

                    }

                break;

                default:
                    console.log('default message');

            }


        // if message can' be converted into json
        }catch (e) {
            console.log('This isn\'t a JSON ' + e.message);
            return;
        }

    });




    connection.on('close', function(reasonCode, description) {

        delete clients[id];
        delete people[id];

        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');

    });


});
