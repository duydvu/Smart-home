var express = require('express');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var crypto = require('crypto');
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn('/login');
var flash = require('connect-flash');
var { Pool } = require('pg')

var { sequelize, User, Device, Register } = require('./model');

// Connect Postgresql
var pool = new Pool({
    user: "ycscfgfdxqmeyq",
    password: "979d555388a312ae8b02e153c842e3142f98316b2d3304257ae70ee9a6c40905",
    database: "d1du91a3np5las",
    port: 5432,
    host: "ec2-107-21-95-70.compute-1.amazonaws.com",
    ssl: true
});

var app = express();

app.use(function(req, res, next) { //allow cross origin requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader("Access-Control-Allow-Methods", "POST, PUT, OPTIONS, DELETE, GET");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.setHeader("Access-Control-Allow-Credentials", true);
    next();
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

app.use(express.static("./build"))
app.set("view engine", "ejs")
app.set("views", "./build")

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

app.post('/getDevice', ensureLoggedIn, function (req, res) {
    sequelize.query("SELECT * FROM devices WHERE user_id = ?", { 
        replacements: [ req.user.id ], 
        type: sequelize.QueryTypes.SELECT,
        logging: false
    })
    .then(devices => {
        console.log("Get Device: OK.");
        res.json({ devices });
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
                id: Math.floor(Math.random() * 1000000).toString(),
                username: body.username,
                password: hash
            })
            .then(user => {
                console.log("Registration succeed!");
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
        console.trace(err);
        res.sendStatus(status || 400);
    })
});

app.post('/removeDevice', ensureLoggedIn, function (req, res) {
    const id = req.body.id;
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

app.get('/', ensureLoggedIn, (req, res) => {
    res.render('index')
})

app.get('/login', (req, res) => {
    res.render('index')
})

app.get('/signup', (req, res) => {
    res.render('index')
})

module.exports = app