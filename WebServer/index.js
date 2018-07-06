var express = require('express');
var https = require('https');
var fs = require('fs');
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
var pem = require('pem');

var { sequelize, User, Device, Register } = require('./model');

var app = express();

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

app.use(function(req, res, next) { //allow cross origin requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader("Access-Control-Allow-Methods", "POST, PUT, OPTIONS, DELETE, GET");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.setHeader("Access-Control-Allow-Credentials", true);
    next();
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
    console.log(`${username} is logging in.`);
    User.findOne({
        where: {
            username
        },
        logging: false
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

app.use(express.static("public"))
app.set("view engine", "ejs")
app.set("views", "./views")

app.post('/signin',
passport.authenticate('local'),
function (req, res) {
    console.log("Sign in: OK.");
    sequelize.query("SELECT * FROM devices WHERE user_id = ?", { 
        replacements: [ req.user.id ], 
        type: sequelize.QueryTypes.SELECT
    })
    .then(devices => {
        console.log("Get Device: OK.");
        res.json({ id: req.user.id, devices });
    })
    .catch(err => {
        console.log(err.original);
        res.sendStatus(500);
    })
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
                console.log(err.original);
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

app.post('/addDevice', ensureLoggedIn, function (req, res) {
    const id = req.body.id, name = req.body.name;
    const user_id = req.user.id;
    Register.find({
        where: {
            id,
            active: true   
        }
    })
    .then(register => {
        if(register) {
            console.log("Device registered, ready to add to Device table.");
            return Device.create({
                id,
                name,
                status: false,
                timerStatusTurnOn: false,
                timerStatusTurnOff: false,
                timeOn: new Date(),
                timeOff: new Date(),
                user_id
            }, {
                logging: false
            })
        }
        new Promise((resolve, reject) => reject({}, 404));
    })
    .then(device => {
        console.log(`Added Device with id: ${device.id}, and name: ${device.name}`);      
        res.sendStatus(200);

        console.log('Removing register after successful registration...');
        return Register.destroy({
            where: {
                id
            },
            logging: false
        })
    })
    .then(rowNum => {
        console.log(`Remove ${rowNum} Register: OK.`);      
    })
    .catch((err, status) => {
        console.trace(err.original);
        res.sendStatus(status || 400);
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
        console.log(`Remove ${rowNum} Device: OK.`);      
        res.sendStatus(200);
    })
    .catch(err => {
        console.log(err.original);
        res.sendStatus(500);
    })
});



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
                        client.publish('ESP8266', 'ACTIVED');
                        return new Promise((resolve) => resolve(true));
                    }
                    return Register.findById(json.id);
                })
                .then((item) => {
                    if(item === true) return;
                    if(item) {
                        console.log('Found an existing register device.');
                        return new Promise((resolve) => resolve(true));
                    }
                    return Register.create({
                        id: json.id,
                        expire: new Date(new Date() + 30000)
                    });
                })
                .then(register => {
                    if(register !== true)
                        console.log("Add Register: OK.");
                })
                .catch(err => {
                    console.log(err.original);
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
        var arr = []
        if (data.content == 'ON') {
            client.publish('ESP32', JSON.stringify(data));
            tf = true;
        }
        else if (data.content == 'OFF') {
            client.publish('ESP32', JSON.stringify(data));
            tf = false;
        }
        else if (data.content == 'setTurnOn') {
            arr.push({
                id: data.id,
                turnOn: setTimeout(() => {
                    data.content = 'ON';
                    client.publish('ESP32', JSON.stringify(data));
                    arr = arr.filter(e => e.id != data.id);
                }, data.time - new Date())
            })
        }
        else if (data.content == 'setTurnOff') {
            arr.push({
                id: data.id,
                turnOn: setTimeout(() => {
                    data.content = 'OFF';
                    client.publish('ESP32', JSON.stringify(data));
                    arr = arr.filter(e => e.id != data.id);
                }, data.time - new Date())
            })
        }
        else if (data.content == 'cancelTurnOn'){
            var index, target = arr.filter((e, i) => {
                if(e.id == data.id) {
                    index = i;
                    return true;
                }
            })[0];
            if(!target) return;
            clearTimeout(target.turnOn);
            arr.splice(index, 1);
        }
        else if (data.content == 'cancelTurnOff'){
            var index, target = arr.filter((e, i) => {
                if(e.id == data.id) {
                    index = i;
                    return true;
                }
            })[0];
            if(!target) return;
            clearTimeout(target.turnOff);
            arr.splice(index, 1);
        }
    })
});

app.get('/', (req, res) => {
    client.publish('ESP8266', 'ON');
    res.sendStatus(200);
})

setInterval(() => {
    Register.update({
        active: false
    }, {
        where: {
            expire: {
                [sequelize.Op.lt]: new Date()
            }
        },
        logging: false
    })
    .then(rowNum => {
        console.log('Removing inactive registers...');
        console.log(`Remove ${rowNum} Registers: OK.`);      
    })
    .catch(err => {
        console.trace(err.original);
    })
}, 30000);