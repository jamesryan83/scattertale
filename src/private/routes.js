"use strict";

var path = require("path");
var multiparty = require("multiparty");


exports.setup = function (app, database, myPassport) {


    // ******************************* General Routes *******************************

    // home
    app.get("/", function (req, res) {
        res.sendFile(path.join(__dirname, "../", "public", "app.html"));
    });


    // login
    app.post("/login", function (req, res, next) {
        myPassport.authenticate(req, res, next);
    });


    // logout
    app.get('/logout', function(req, res) {
        req.logout();
        res.send({ success: true });
    });


    // get logged in or not
    app.get("/is-logged-in", function (req, res) {
        res.send({ loggedIn: req.isAuthenticated() });
    });








    // ******************************* Account Stuff *******************************

    // create account
    app.post("/create-account", function (req, res) {
        if (req.isAuthenticated()) {
            res.send({ success: false, message: "Please logout before creating a new account" });
        } else {
            database.createAccount(req.body, function (result) {
                res.send(result);
            })
        }
    });


    // update account
    app.post("/update-account", function (req, res) {
        if (req.isAuthenticated()) {
            database.updateAccount(req.user, req.body.details, function (result) {
                res.send(result);
            });
        } else {
            res.send({ success: false, message: "Not logged in" });
        }
    });


    // delete account
    app.post("/delete-account", function (req, res) {

        if (req.isAuthenticated() === true) {
            database.deleteAccount(req.user, req.body.password, function (QueryResult) {

                if (QueryResult.success === true) {
                    req.logout(); // logout
                    req.session.destroy(function () {
                        res.clearCookie("connect.sid"); // remove cookie
                        res.send(QueryResult);
                    });
                } else {
                    res.send({ success: false, message: QueryResult.error });
                }

            });
        } else {
            res.send({ success: false, message: "Not logged in" });
        }
    });


    // get account data
    app.get("/get-account", function (req, res) {
        if (req.isAuthenticated() === true) {
            database.getAccountData(req.user, function (result) {
                res.send(result);
            });
        } else {
            res.send({ loggedIn: false });
        }
    });


    // upload an image to account TODO: make this generic, put multipart stuff in util or something
    app.post("/upload-image", function (req, res) {
        if (req.isAuthenticated()) {

            var data = "";
            var form = new multiparty.Form();

            // part of multipart
            form.on('part', function(part) {
                part.setEncoding("binary");

                part.on("data", function (d) {
                    data += d;
                });

                part.on('error', function(err) {
                    res.send({ success: false, error: "error in data part" });
                });
            });

            // error
            form.on('error', function(err) {
                res.send({ success: false, error: "error in parsing form" });
            });
-

            // After form parsed
            form.on('close', function() {
                database.addImageToAccount(req.user, data, function (result) {
                    if (result.success === true) {
                        database.getImage(req.user, function (result) {
                            res.send(result);
                        });
                    } else {
                        res.send(result)
                    }
                });
            });

            form.parse(req);

        } else {
            res.send({ success: false, message: "Not logged in" });
        }
    });









    // ******************************* Tale Stuff *******************************

    // new tale
    app.post("/create-tale", function (req, res) {
        if (req.isAuthenticated()) {
            database.createTale(req.user, req.body, function (result) {
                res.send(result);
            });
        } else {
            res.send({ success: false, message: "not logged in" });
        }
    });


    // update tale
    app.post("/update-tale", function (req, res) {
        if (req.isAuthenticated()) {
            database.updateTale(req.user, req.body, function (result) {
                res.send(result);
            });
        } else {
            res.send({ success: false, message: "not logged in" });
        }
    });


    // update tale details (title, description etc)
    app.post("/update-tale-details", function (req, res) {
        if (req.isAuthenticated()) {
            database.updateTaleDetails(req.user, req.body, function (result) {
                res.send(result);
            });
        } else {
            res.send({ success: false, message: "not logged in" });
        }
    });



    // update item text
    app.post("/update-item-text", function (req, res) {
        if (req.isAuthenticated()) {
            database.updateItemText(req.user, req.body, function (result) {
                res.send(result);
            });
        } else {
            res.send({ success: false, message: "not logged in" });
        }
    });


    // delete tale
    app.post("/delete-tale", function (req, res) {
        if (req.isAuthenticated()) {
            database.deleteTale(req.user, req.body, function (result) {
                res.send(result);
            });
        } else {
            res.send({ success: false, message: "not logged in" });
        }
    });


    // get tale data for edit tale screen
    app.get("/tale/:taleId", function (req, res) {
        database.getTale(req.params.taleId, function (result) {
            res.send(result);
        });
    });


    // get tale data for edit tale screen
    app.get("/edit-tale/:taleId", function (req, res) {
        database.getEditTale(req.params.taleId, function (result) {
            res.send(result);
        });
    });


    // get tale item by id row and item number for edit item screen
    app.get("/edit-item/:taleId/:row/:item", function (req, res) {
        database.getEditItem(req.params, function (result) {
            res.send(result);
        });
    });


    // search tales
    app.get("/search-tales", function (req, res) {
        database.searchTales(req.query, function (result) {
            res.send(result);
        });
    });






    // Any other requests
    app.all("*", function (req, res) {
        if (req.originalUrl.indexOf("favicon") === -1) {
            console.log("uncaught url : " + req.originalUrl);
        }

        res.send('unknown route');
    });
}
