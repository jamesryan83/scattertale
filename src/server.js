"use strict";

require("dotenv").config({ path: "../.env" });

var bodyParser = require("body-parser");
var express = require("express");
var session = require("express-session");
var path = require("path");
var config = require("./config");
var myPassport = require("./private/myPassport");
var routes = require("./private/routes");
var database = require("./private/database");

database.setup(config.msSql, function () {

    // https://github.com/patriksimek/connect-mssql/issues/8
    var MSSQLStore = require("connect-mssql")(session);
    var mssqlStore = new MSSQLStore(config.msSql, config.msSqlStoreOptions);

    mssqlStore.connection.on("connect", function () {


        // Setup
        var app = express();
        app.config = config;
        app.use("/", express.static(path.join(__dirname, "public")));
        app.use(bodyParser.urlencoded({ extended: true }));
        app.use(session({
            resave: true,
            saveUninitialized: true,
            store: mssqlStore,
            secret: config.secret,
            cookie: { expires: new Date(2147483647000) } // http://stackoverflow.com/a/28289961/4359306
        }));


        // Passport
        myPassport.setup(app, database);


        // Routes
        routes.setup(app, database, myPassport);


        // Start server
        var port = process.env.PORT || 1337;
        app.listen(port, function() {
            console.log("listening:" + port);
        });
    });

    mssqlStore.connection.on("error", function () {
        process.exit(1);
    });

});

