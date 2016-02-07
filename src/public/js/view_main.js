"use strict";

var ST = ST || {};
ST.main = {};
ST.main.view = {};


// Main NavBar
ST.main.view.NavBar = Backbone.View.extend({
    el: "#divContainerMainNavBar",

    events: {
        "click #aLinkNavBarNewTale": "newTale",
        "click #aLinkNavBarHelp": "showHelp"
    },

    initialize: function () {
        //ST.util.setLayoutBackgroundColors(".layoutBG");
    },


    // new tale button
    newTale: function () {

        $("#divDarkenScreen").show();
        new ST.dialog.view.NewTaleDialog(function (result) {
            // hide dialog
            $("#divDarkenScreen").hide();
            $("#divDialogContainer").empty();
            $("#divDialogContainer").unbind();

            // go to new tale
            if (result.success === true) {
                ST.router.navigate("/edit-tale/" + result.idTale, { trigger: true });
            }
        });
    },


    // help button
    showHelp: function () {
        ST.main.view.help = new ST.main.view.Help(ST.router.lastName);
    },


    // show different buttons if logged in or out
    toggleLogout: function (loggedIn) {

        if (loggedIn === true) {
            $("#aLinkNavBarNewTale").show();
            $("#aLinkNavBarLogout").show();
            $("#aLinkNavBarAccount").show();
            $("#aLinkNavBarLogin").hide();
            $("#aLinkNavBarTryItOut").hide();
        } else {
            $("#aLinkNavBarNewTale").hide();
            $("#aLinkNavBarLogout").hide();
            $("#aLinkNavBarAccount").hide();
            $("#aLinkNavBarLogin").show();
            $("#aLinkNavBarTryItOut").show();
        }
    }
});





// Help drawer sidebar thing
ST.main.view.Help = Backbone.View.extend({
    el: "#divHelp",

    events: {
        "click #buttonCloseHelp": "close"
    },

    initialize: function (page) {
        this.render(page);
    },

    render: function (page) {
        this.template = null;
        this.$el.empty();

        switch(page) {
            case "search":
                this.template = _.template($("#templateHelpSearch").html());
                break;
            case "editTale" :
            case "tryItOut" :
                this.template = _.template($("#templateHelpEditTale").html());
                break;
            case "editItem":
                this.template = _.template($("#templateHelpEditItem").html());
                break;
            case "about" :
                this.template = _.template($("#templateHelpAbout").html());
                break;
            case "account" :
                this.template = _.template($("#templateHelpAccount").html());
                break;
        }

        if (this.template !== null) {
            $("#divHelp").show();
            this.$el.html(this.template());
        }

        return this;
    },

    close: function () {
        $("#divHelp").hide();
    }
});
