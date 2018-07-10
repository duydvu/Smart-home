var express = require('express');
var session = require('express-session');
var socketio = require('socket.io');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt');
var { Pool, Client } = require('pg');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mqtt = require('mqtt');
var flash = require('connect-flash');
var crypto = require('crypto');
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn('/');

var { sequelize, User, Device } = require('./model');

var app = express();

// Connect MQTT
var client = mqtt.connect({
    host: "115.79.27.129",
    port: 9015,
    username: "ulwrtaoc",
    password: "SUzhOrzguPJ9"
});

// Connect Postgresql
var pool = new Pool({
    user: "ycscfgfdxqmeyq",
    password: "979d555388a312ae8b02e153c842e3142f98316b2d3304257ae70ee9a6c40905",
    database: "d1du91a3np5las",
    port: 5432,
    host: "ec2-107-21-95-70.compute-1.amazonaws.com",
    ssl: true
});

passport.use(new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password'
},    
function (username, password, cb) {
    User.findOne({
        where: {
            username
        }
    })
    .then(user => {
        if (!user) return cb(null, false);
        bcrypt.compare(password, user.password, function(err, res) {
            if(res)
                return cb(null, user);
            else
                return cb(null, false);
        });
    })
    .catch(err => {
        console.log(err);
        return cb(err);
    })
}));

passport.serializeUser(function (user, cb) {
    cb(null, user.id);
});

passport.deserializeUser(function (id, cb) {
    User.findById(id)
    .then(user => {
        cb(null, user);
    })
    .catch(err => {
        console.log(err);
        return cb(err);
    })
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({
    store: new (require('connect-pg-simple')(session))({ pool }),
    secret: '1 good secret, but not a short secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

client.on('connect', function () {
    console.log('mqtt connected!');
    client.subscribe('espToServer',function(data){
        console.log("ESP32 to server: ", data);
        io.sockets.emit("serverToWeb",data);
    });
})


app.use(function(req, res, next) { //allow cross origin requests
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

app.post('/signin',
passport.authenticate('local'),
function (req, res) {
    console.log("Sign in: OK.");
    res.sendStatus(200);
});

app.post('/signup', function (req, res) {
    const saltRounds = 10;
    const body = req.body;
    
    bcrypt.genSalt(saltRounds, function(err, salt) {
        bcrypt.hash(body.password, salt, function(err, hash) {
            
            User.create({
                id: body.id,
                username: body.username,
                password: hash
            })
            .then(user => {
                console.log("Registration succeed!")      
                res.json({
                    id: user.id
                });
            })
            .catch(err => {
                console.log(err.original.error);
                console.log("Registration failed!")
                res.sendStatus(400);
            })

        });
    });
});

app.get('/signout', function (req, res) {
    req.logout();
    console.log("Sign out: OK.");
    res.sendStatus(200);
});

app.get('/getDevice', ensureLoggedIn, function (req, res) {
    const id = req.user.id;
    sequelize.query("SELECT * FROM devices WHERE user_id = ?", { 
        replacements: [ id ], 
        type: sequelize.QueryTypes.SELECT
    })
    .then(devices => {
        console.log("Get Device: OK.");
        res.json({ devices });
    })
    .catch(err => {
        console.log(err.original)
        res.sendStatus(500)
    })
});

app.get('/addDevice/:id/:name', ensureLoggedIn, function (req, res) {
    const id = req.params.id, name = req.params.name;
    const user_id = req.user.id;
    Device.create({
        id,
        name,
        status: false,
        timerStatus: false,
        time: 0,
        user_id
    })
    .then(user => {
        console.log("Add Device: OK.");      
        res.sendStatus(200);
    })
    .catch(err => {
        console.log(err.original);
        res.sendStatus(400);
    })
});

app.get('/removeDevice/:id', ensureLoggedIn, function (req, res) {
    const id = req.params.id;
    const user_id = req.user.id;
    Device.destroy({
        where: {
            id,
            user_id
        }
    })
    .then(rowNum => {
        if(rowNum === 0) {
            console.log("No device was deleted.");
            res.sendStatus(400);
            return;
        }
        console.log("Remove Device: OK.");      
        res.sendStatus(200);
    })
    .catch(err => {
        console.log(err.original);
        res.sendStatus(500);
    })
});

const io = socketio(
    app.listen(process.env.PORT || 3000, function () {
        console.log('Node app is running on port', process.env.PORT || 3000);
    })
);

console.log("Server nodejs started");

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