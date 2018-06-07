var app = require('express')(3000);
var server = require('http').createServer(app);
var io = require('socket.io')(3001);
var express = require("express")
var ip = require("ip")
const mqtt = require('mqtt')
var client = mqtt.connect({
    host: "115.79.27.129",
    port: 9015
    ,
    username: "ulwrtaoc",
    password: "SUzhOrzguPJ9"
})

client.on('connect', function () {
    console.log('mqtt connected!');
    client.subscribe('espToServer',function(data){
        console.log("ESP32 to server: ", data);
        io.sockets.emit("serverToWeb",data);
    });
})


app.use(function(req, res, next) { //allow cross origin requests
    var allowedOrigins = ["115.79.27.129:1998", "115.79.27.129"];
    var origin = req.headers.origin;
    console.log(origin);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader("Access-Control-Allow-Methods", "POST, PUT, OPTIONS, DELETE, GET");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.setHeader("Access-Control-Allow-Credentials", true);
    next();
  });


client.on('message', function (topic, message) {
    console.log(message.toString() + 'zzzz');
    timeOut = false;
    io.sockets.emit("serverToWeb", message.toString());
})

app.use(express.static("public"))
app.set("view engine", "ejs")
app.set("views", "./views")

var tf = false;
var timeOn = "";
var tfOn = false;
var timeOff = "";
var tfOff = false;

app.get('/getInitial', function(req, res){
    res.send({tf: tf, timeOn: timeOn, tfOn: tfOn, tfOff: tfOff, timeOff: timeOff});
})


io.on('connection', function (socket) {
    console.log("co nguoi ket noi")
    // socket.on("buttonsenddata", function(data){
    //     console.log(data)
    //     io.sockets.emit("serversendbutton", data)
    //     client.publish('ESP32',data)
    // })
    // client.on("message",function(data){
    //     console.log(data.toString.toString()+"console at web");
    //     io.sockets.emit("serverToWeb",data.toString());
    // })
    
    socket.on("webToServer", function (data) {
        var a, b;
        console.log(data);
        if (data.status == 'ON') {
            client.publish('ESP32', "ON");
            io.sockets.emit("serverToWeb","ON");
            tf = true;
        }
        else if (data.status == 'OFF') {
            client.publish('ESP32', "OFF");
            io.sockets.emit("serverToWeb","OFF");
            tf = false;
        }
        else if (data.status == 'setTurnOn') {
            a = setTimeout(() => {
                client.publish('ESP32', "ON");
                io.sockets.emit("serverToWeb", 'successTurnOn');
                console.log("aaaaa");
            }, data.time)
            timeOn = data.timeOn;
            var x = {status: 'setTurnOn', timeOn: timeOn};
            io.sockets.emit("serverToWeb", x);
            tfOn = true;
        }
        else if (data.status == 'setTurnOff') {
            b = setTimeout(() => {
                client.publish('ESP32', "OFF");
                io.sockets.emit("serverToWeb", 'successTurnOff');
            }, data.time)
            timeOff = data.timeOff;
            var x = {status: 'setTurnOff', timeOff: timeOff};
            io.sockets.emit("serverToWeb", x);
            tfOff = true;
        }
        else if (data.status == 'cancelTurnOn'){
            clearTimeout(a);
            var x = {status: 'cancelTurnOn'};
            io.sockets.emit("serverToWeb", x);
            tfOn = false;
        }
        else if (data.status == 'cancelTurnOff'){
            clearTimeout(b);
            var x = {status: 'cancelTurnOff'};
            io.sockets.emit("serverToWeb", x);
            tfOff = false;
        }
        io.sockets.emit("serverToWeb", data);
    })
});
console.log("Server nodejs started")

app.listen(3000);
