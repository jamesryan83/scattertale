"use strict";

var ST = ST || {};


// Start
window.onload = function () {
    ST.main.view.navBar = new ST.main.view.NavBar();

    ST.router = new ST.Router();
    Backbone.history.start();
}






// Router
ST.Router = Backbone.Router.extend({
    routes: {
        "": "home",
        "about": "about",
        "account": "account",
        "search-tales(/)(/:searchTerm)": "search", // http://stackoverflow.com/a/14329976
        "tale/:idTale": "tale",
        "edit-tale/try-it-out": "tryItOut",
        "edit-tale/:idTale": "editTale",
        "edit-item/:idTale/:row/:col": "editItem",
        "logout": "logout",
        "*actions": "four04Page"
    },






    // called before every route change
    execute: function (next, args, name) {

        $("#divContainerMain").empty(); // remove previous view
        $("#divContainerMain").unbind(); // remove events (docs say empty does this but it doesn't always)

        ST.util.removeCKEditorInstances();

        // get whether logged in or not and call next route
        var self = this;
        $.ajax({
            method: "GET",
            url: "/is-logged-in",
            success: function (data, textStatus, jqXHR) {
                self.lastName = name;

                // full screen or navbar
                if (name === "home") {
                    $("#divContainerMainNavBar").hide();
                    $("#divContainerMain").css({ "height": "100%" });
                } else {
                    $("#divContainerMainNavBar").show();
                    var navBarHeight = $("#divContainerMainNavBar").height();
                    $("#divContainerMain").css({ "height": "calc(100% - " + navBarHeight + "px)" });
                }

                ST.main.view.navBar.toggleLogout(data.loggedIn);
                next({ arg: args, loggedIn: data.loggedIn });
            },
            error: function (jqXHR, textStatus, error) {
                console.log("Error..."); console.log(jqXHR); console.log(textStatus); console.log(error);
            }
        });
    },






    // home
    home: function (data) {
        // redirect to Account page if logged in
        if (data.loggedIn === false) {
            ST.index.view.main = new ST.index.view.Main();
            document.title = "Scattertale - Login";
        } else {
            ST.router.navigate("account", { trigger: true });
        }
    },


    // about
    about: function () {
        ST.about.view.main = new ST.about.view.Main();
        document.title = "Scattertale - About";
    },


    // account
    account: function () {
        $.ajax({
            method: "GET",
            url: "/get-account",
            success: function (data, textStatus, jqXHR) {
                if (data.success === true) {
                    ST.account.view.main = new ST.account.view.Main(data);
                    document.title = "Scattertale - Account";
                } else {
                    console.log(data);
                    ST.router.navigate("/404", { trigger: true });
                }
            },
            error: function (jqXHR, textStatus, error) {
                console.log("Error..."); console.log(jqXHR); console.log(textStatus); console.log(error);
            }
        });
    },


    // search
    search: function (args) {
        ST.search.view.main = new ST.search.view.Main(args.arg[0]);
        ST.search.view.searchList = new ST.search.view.SearchList();
        document.title = "Scattertale - Search";
    },


    // try it out
    tryItOut: function () {
        ST.editTale.start(ST.data.exampleTale, "Detail");
        document.title = "Scattertale - Try It Out";
    },


    // tale (just for reading, no editing)
    tale: function (args)  {
        var idTale = args.arg[0];

        $.ajax({
            method: "GET",
            url: "/tale/" + idTale,
            success: function (data, textStatus, jqXHR) {
                console.log(data)
                document.title = "Scattertale - Tale";
                ST.tale.view.main = new ST.tale.view.Main(data.data);
            },
            error: function (jqXHR, textStatus, error) {
                console.log("Error..."); console.log(jqXHR); console.log(textStatus); console.log(error);
            }
        });
    },


    // edit tale
    editTale: function (args) {
        var idTale = args.arg[0];

        $.ajax({
            method: "GET",
            url: "/edit-tale/" + idTale,
            success: function (data, textStatus, jqXHR) {
                ST.editTale.start(data, "Detail");
                document.title = "Scattertale - Edit Tale";
            },
            error: function (jqXHR, textStatus, error) {
                console.log("Error..."); console.log(jqXHR); console.log(textStatus); console.log(error);
            }
        });
    },


    // edit item
    editItem: function (args) {

        var idTale = args.arg[0];
        var row = args.arg[1];
        var item = args.arg[2];

        // edit temporary tale
        if (idTale == -1) {
            var fakeItem = { result : ST.data.exampleTale.rows[row].items[item] };
            ST.editItem.view.main = new ST.editItem.view.Main(fakeItem);
            document.title = "Scattertale - Edit Item";

        // edit actual tale from server
        } else {
            $.ajax({
                method: "GET",
                url: "/edit-item/" + idTale + "/" + row + "/"+ item,
                success: function (data, textStatus, jqXHR) {
                    //console.log(data)
                    if (data.success === true) {
                        ST.editItem.view.main = new ST.editItem.view.Main(data);
                        document.title = "Scattertale - Edit Item";
                    } else {
                        console.log(data);
                        //ST.router.navigate("/404", { trigger: true });
                    }
                },
                error: function (jqXHR, textStatus, error) {
                    console.log("Error..."); console.log(jqXHR); console.log(textStatus); console.log(error);
                }
            });
        }
    },


    // logout
    logout: function (args) {
        if (args.loggedIn === true) {
            $.ajax({
                method: "GET",
                url: "/logout",
                success: function (data, textStatus, jqXHR) {
                    if (data.success === true) {
                        ST.router.navigate("/", { trigger: true });
                    }
                },
                error: function (jqXHR, textStatus, error) {
                    console.log("Error..."); console.log(jqXHR); console.log(textStatus); console.log(error);
                }
            });
        } else {
            ST.router.navigate("/", { trigger: true });
        }
    },


    // 404 page
    four04Page: function () {
        ST.four04.view.main = new ST.four04.view.Main();
        document.title = "Scattertale - 404";
    }
});

