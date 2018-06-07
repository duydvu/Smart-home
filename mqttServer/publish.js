var mqtt = require('mqtt')
client = mqtt.connect({
    host: '192.168.20.127',
    port: 9015
});

client.publish('header', 'Client 1 is alive.. Test Ping! ');
client.publish('abc', 'Client 2 is alive.. Test Ping! ');
