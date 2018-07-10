var https = require('https');
var fs = require('fs');
var socketio = require('socket.io');
var mqtt = require('mqtt');
var { sequelize, User, Device, Register } = require('./model');
var app = require('./routes');

// Connect MQTT
var client = mqtt.connect({
    host: "iot.eclipse.org",
    port: 1883,
});

const io = socketio(
    https.createServer({ 
        key: fs.readFileSync('./key.pem', 'utf8'), 
        cert: fs.readFileSync('./cert.pem', 'utf8'),
    }, app).listen(process.env.PORT || 3000, () => {
        console.log('Start on port 3000!')
    })
);

console.log("Server nodejs started");

client.on('connect', function () {
    console.log('MQTT connected!');
    client.subscribe('espToServer');
});

client.on('message', function (topic, message) {
    var json = JSON.parse(message.toString());
    console.log(`Received a publish packet on topic ${topic}`, json);
    switch (topic) {
        case 'espToServer':
            if(json.content === 'ACTIVE') {
                Device.findById(json.id)
                .then(item => {
                    if(item) {
                        console.log('Device was activated.');
                        client.publish('ESP8266', JSON.stringify({ id: json.id, content: 'ACTIVED'}));
                        return new Promise((resolve) => resolve(true));
                    }
                    return Register.findById(json.id);
                })
                .then((item) => {
                    if(item === true) return;
                    if(item) {
                        console.log('Found an existing register device.');
                        return Register.update({
                            active: true
                        }, {
                            where: {
                                id: json.id
                            },
                            logging: false
                        })
                    }
                    return Register.create({
                        id: json.id,
                        expire: new Date(new Date() + 30000)
                    });
                })
                .then(register => {
                    if(!register) return;
                    if(!register.length)
                        console.log("Add Register: OK.");
                })
                .catch(err => {
                    console.log(err);
                    client.publish('error', 'Database error when registering device!');
                });
            }
            else if(json.content === 'ON' || json.content === 'OFF') {
                Device.update({
                    status: json.content === 'ON' ? true : false
                }, {
                    where: {
                        id: json.id
                    }
                })
                .then(device => {
                    console.log(`Update device ${json.id} to ${json.content}: OK.`);
                    io.sockets.emit("serverToWeb", json);
                })
                .catch(err => {
                    console.log(err.original);
                    client.publish('error', 'Database error when update device status!');
                });
            }
        default:
            break;
    }
});

io.on('connection', function (socket) {
    console.log("A user connected.")
    
    socket.on("webToServer", function (data) {
        console.log('Web to server: ', data)
        var arr = []; // Array for storing timer objects
        io.sockets.emit("serverToWeb", data);
        if (data.content == 'ON') {
            client.publish('ESP8266', JSON.stringify(data));
            Device.update({
                status: true
            }, {
                where: {
                    id: data.id
                }
            })
        }
        
        else if (data.content == 'OFF') {
            client.publish('ESP8266', JSON.stringify(data));
            Device.update({
                status: false
            }, {
                where: {
                    id: data.id
                }
            })
        }
        
        else if (data.content == 'setTurnOn') {
            console.log("Turn on in: ", (new Date(data.time) - new Date()) / 1000, "s")
            Device.update({
                timerStatusTurnOn: true,
                timeOn: data.time
            }, {
                where: {
                    id: data.id
                }
            })
            arr.push({
                id: data.id,
                turnOn: setTimeout(() => {
                    console.log("Turning on...");
                    data.content = 'TurnedOn';
                    client.publish('ESP8266', JSON.stringify(data));
                    io.sockets.emit("serverToWeb", data);
                    Device.update({
                        status: true,
                        timerStatusTurnOn: false,
                    }, {
                        where: {
                            id: data.id
                        }
                    });
                    arr = arr.filter(e => e.id != data.id);
                }, new Date(data.time) - new Date())
            });
        }

        else if (data.content == 'setTurnOff') {
            console.log("Turn off in: ", (new Date(data.time) - new Date()) / 1000, "s")
            Device.update({
                timerStatusTurnOff: true,
                timeOff: data.time
            }, {
                where: {
                    id: data.id
                }
            })
            arr.push({
                id: data.id,
                turnOff: setTimeout(() => {
                    console.log("Turning off...");
                    data.content = 'TurnedOff';
                    client.publish('ESP8266', JSON.stringify(data));
                    io.sockets.emit("serverToWeb", data);
                    Device.update({
                        status: false,
                        timerStatusTurnOff: false,
                    }, {
                        where: {
                            id: data.id
                        }
                    });
                    arr = arr.filter(e => e.id != data.id);
                }, new Date(data.time) - new Date())
            })
        }

        else if (data.content == 'cancelTurnOn'){
            var index, target = arr.filter((e, i) => {
                if(e.id == data.id) {
                    index = i;
                    return true;
                }
            });
            if(target.length) {
                Device.update({
                    timerStatusTurnOn: false,
                }, {
                    where: {
                        id: data.id
                    }
                });
                clearTimeout(target[0].turnOn);
                arr.splice(index, 1);
            }
        }

        else if (data.content == 'cancelTurnOff'){
            var index, target = arr.filter((e, i) => {
                if(e.id == data.id) {
                    index = i;
                    return true;
                }
            });
            if(target.length)  {
                Device.update({
                    timerStatusTurnOff: false,
                }, {
                    where: {
                        id: data.id
                    }
                });
                clearTimeout(target[0].turnOff);
                arr.splice(index, 1);
            }
        }
        
    })
});


// After every 30s, deactivate all expired registers
// setInterval(() => {
//     Register.update({
//         active: false
//     }, {
//         where: {
//             expire: {
//                 [sequelize.Op.lt]: new Date()
//             }
//         },
//         logging: false
//     })
//     .then(rowNum => {
//         console.log('Removing inactive registers...');
//         console.log(`Remove ${rowNum} Registers: OK.`);      
//     })
//     .catch(err => {
//         console.trace(err.original);
//     })
// }, 30000);