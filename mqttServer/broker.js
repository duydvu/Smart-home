var mosca = require('mosca')
var settings = {
port: 9015
};
//here we start mosca
var server = new mosca.Server(settings);
server.on('ready', setup);
function setup() {
    console.log('Mosca server is up and running')
}
server.on('clientConnected', function(client) {
    console.log('client connected');
});
// fired when a message is received
server.on('published', function(packet, client) {
    console.log('Published : ', packet.payload.toString('utf-8'));
});
// fired when a client subscribes to a topic
server.on('subscribed', function(topic, client) {
    console.log('subscribed : ', topic);
});
// fired when a client subscribes to a topic
server.on('unsubscribed', function(topic, client) {
    console.log('unsubscribed : ', topic);
});
// fired when a client is disconnecting
server.on('clientDisconnecting', function(client) {
    console.log('clientDisconnecting : ', client.id);
});
// fired when a client is disconnected
server.on('clientDisconnected', function(client) {
    console.log('clientDisconnected : ', client.id);
});