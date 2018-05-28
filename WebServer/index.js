const express = require("express")
const app = express()
const bodyParser = require("body-parser")
const passport = require("passport")
const LocalStrategy = require("passport-local").Strategy
const fs = require("fs")
const session = require("express-session")
const pg = require("pg")
const Users = require("./db.js")
const bcrypt = require("bcrypt-nodejs")
const router = express.Router()
const mqtt = require("mqtt")
var client = mqtt.connect({
    host: "m13.cloudmqtt.com",
    port: 10091,
    username: "vhnyvxsu",
    password: "vVA4tmFkLz-k"
})

client.on('connect', function () {
    console.log('hello');
    client.publish('ESP32', '2');
    client.subscribe('mqttlens', function (topic, message) {
        console.log(message);
    });
})

// client.on('message', function (topic, message) {
//     // message is Buffer
//     console.log(message.toString())
//     client.end()
//   })

var urlencodedParser = bodyParser.urlencoded({ extended: true })

app.use(bodyParser.json());
app.use(express.static("public"))
app.use(session({
    secret: "secret",
    saveUninitialized: true,
    resave: true
}))

app.use(urlencodedParser)
app.use(passport.initialize())
app.use(passport.session())


app.listen(3000, function () {
    console.log("server started")
})

app.set("views", "./views")
app.set("view engine", "ejs")

app.get("/", function (req, res) {
    res.render("home.ejs")
})

app.get("/login", function (req, res) {
    res.render("login.ejs")
})
app.post("/login", passport.authenticate("local", { failureRedirect: "/login", successRedirect: "/loginSuccess" }))

app.get("/loginSuccess", function (req, res) {
    res.render("loginSuccess.ejs")
})

passport.use(new LocalStrategy({
    usernameField: "username",
    passwordField: "password"
},
    function (username, password, done) {
        Users.find({
            where: {
                username: username
            }
        })
            .then(user => {
                if (user && user.password == password) {
                    return done(null, user);

                }
                else { console.log("end ned"); return done(null, false); }
            })
            .catch(function (err) {
                console.log(err.stack);
                return done(err);
            })
    }
))

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    Users.findById(id)
        .then(user => {
            done(null, user);
        }).catch(function (err) {
            console.log(err);
        })
});

app.get("/signUp", function (req, res) {
    res.render("signUp.ejs")
})

app.post("/signUp", urlencodedParser, function (req, res) {
    const username = req.body.usernameSign
    const password = req.body.passwordSign
    Users.create({
        username: username,
        password: password
    }).then(() => { res.render("signUpSuccess.ejs") })
        .catch(err => res.render("signUp.ejs"))

})
