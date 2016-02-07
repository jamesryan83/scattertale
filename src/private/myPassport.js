"use strict";

var bcrypt = require("bcrypt-nodejs");
var passport = require("passport");
var util = require("./util");

// https://www.youtube.com/watch?v=twav6O53zIQ


// Setup
exports.setup = function (app, database) {

    app.use(passport.initialize());
    app.use(passport.session());

    var LocalStrategy = require("passport-local").Strategy;

    // this is called whenever passport.authenticate() is called
    passport.use(new LocalStrategy(function (username, password, done) {

        database.findAccount(username, function (QueryResult) {
            if (QueryResult.success === true) {

                if (QueryResult.result.length === 0)
                    done(null, false, { message: "Account not found" });
                else {

                    // decrypt password
                    var userPassword = bcrypt.hashSync(password, QueryResult.result[0].salt);
                    if (userPassword === QueryResult.result[0].password)
                        done(null, QueryResult.result); // pasword ok
                    else
                        done(null, false, { message: "Incorrect Password" });
                }
            } else {
                done(null, false, { message: QueryResult.message });
            }
        });
    }));


    // Serialize User
    passport.serializeUser(function(user, done) {
        done(null, user[0].idUser);
    });

    // Deserialize User
    passport.deserializeUser(function(id, done) {
        database.findAccountById(id, function (QueryResult) {
            done(QueryResult.error, id);
        });
    });
}


// Login
exports.authenticate = function (req, res, next) {
    if (req.isAuthenticated()) {
        return res.send({ succes: true });
    }

    passport.authenticate('local', function (err, user, info) {

        if (err) {
            return res.send({ success: false, message: err.message });
        }

        if (!user) {
            return res.send({ success: false, message: info.message });
        }

        req.logIn(user, function(err) {
            if (err) {
                return res.send({ success: false, message: err.message });
            } else {
                return res.send({ success: true });
            }
        });
    })(req, res, next);
}

