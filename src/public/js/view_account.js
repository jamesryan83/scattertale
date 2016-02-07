"use strict";

var ST = ST || {};
ST.account = {};
ST.account.model = {};
ST.account.collection = {};
ST.account.view = {};



// User
ST.account.model.User = Backbone.Model.extend({
    defaults: {
        "loggedIn": false,
        "description": "",
        "displayName": "",
        "email": "",
        "favoutiteTales": "",
        "idUser": -1,
        "isActive": true,
        "location": "",
        "password": "",
        "picture": null,
        "timeCreatedUser": "",
        "timeUpdatedUser": "",
        "url": "",
        "username": "",
        "tales": []
    }
});


// Tale
ST.account.model.Tale = Backbone.Model.extend({
    defaults: {
        "category": "",
        "descriptionTale": "",
        "idTale": 1,
        "isPrivate": false,
        "picture": null,
        "points": 0,
        "tags": "",
        "title": ""
    }
});



// Collection of Tales
ST.account.collection.Tales = Backbone.Collection.extend({
    model: ST.account.model.Tale
});




// Account View
ST.account.view.Main = Backbone.View.extend({
    el: "#divContainerMain",

    template: _.template($("#templateAccount").html()),

    events: {
        "click #h2MyTales": function () { this.changePage("myTales"); },
        "click #h2FavouriteTales": function () { this.changePage("favouriteTales"); },
        "click #h2AccountDetails": function () { this.changePage("accountDetails"); },
        "click #buttonAccountSave": "saveAccountDetails",
        "click #buttonAccountDelete": "deleteAccount"
    },

    initialize: function (data) {
        this.render(data);
    },

    render: function (data) {
        this.model = new ST.account.model.User(data);
        this.model.set("tales", new ST.account.collection.Tales(data.tales));

        this.$el.html(this.template(this.model.toJSON()));
        this.changePage("myTales");



        // add tales to my tales page
        var tempTales = this.model.get("tales");
        if (tempTales.length > 0) {

            var container = document.createDocumentFragment();

            for (var i = 0; i < tempTales.length; i++) {

                var tempView = new ST.account.view.MyTalesItem({
                    model: tempTales.models[i]
                });

                container.appendChild(tempView.render().el);
            }

            $("#divMyTales").append(container);
            $("#divMyTales").scrollTop(0);

            ST.util.replaceImgWithSvg();
        } else {
            $("#divMyTales").append("<p style='margin: 60px;'>You haven't created anything yet !<br><br>" +
                                    "Click <a class='aLink2' onclick='ST.main.view.navBar.newTale()'>" +
                                    "New Tale</a> on the Navigation Bar to make a new Tale</p>");
        }

        // setup open browse file dialog
        $("#aLinkPicture").on("click", function (e) {
            $("#inputUploadPicture").get(0).click();
        });
        $("#inputUploadPicture").on("change", this.uploadImage);


        // set account picture
        if (data.picture !== null) {
            $("#imgAccountPicture").attr("src", "data:image/png;base64," + data.picture);
        }

        //ST.util.setLayoutBackgroundColors(".layoutBG");

        return this;
    },


    // upload image
    uploadImage: function () {

        if (document.getElementById("inputUploadPicture").value === "") return;

        var files = document.getElementById("inputUploadPicture").files;
        if (files.length === 0) return;

        var formData = new FormData();
        formData.append("image", files[0]);

        $.ajax({
            method: "POST",
            url: "/upload-image",
            processData: false,
            contentType: false,
            cache: false,
            data: formData,
            success: function (data, textStatus, jqXHR) {
                if (data.success === true) {
                    $("#imgAccountPicture").attr("src", "data:image/png;base64," + data.image);
                } else {
                    alert("Error : " + data.message);
                }
            },
            error: function (jqXHR, textStatus, error) {
                console.log("Error..."); console.log(jqXHR);
                console.log(textStatus); console.log(error);
            }
        });

    },


    // save any changed details to the server
    saveAccountDetails: function () {
        var details = {
            "displayName": $("#inputAccountDisplayName").val(),
            "location": $("#inputAccountLocation").val(),
            "url": $("#inputAccountUrl").val(),
            "description": $("#inputAccountDescription").val()
        };

        $.ajax({
            method: "POST",
            url: "/update-account",
            data: {
                details: details
            },
            success: function (data, textStatus, jqXHR) {
                if (data.success === true) {
                    alert("Changes saved !")
                } else {
                    alert("Error : " + data.message);
                }
            },
            error: function (jqXHR, textStatus, error) {
                console.log("Error..."); console.log(jqXHR);
                console.log(textStatus); console.log(error);
            }
        });
    },


    // delete account from server
    deleteAccount: function (data) {

        var dialogResult = prompt("This will permanently delete your account.  This can't be undone.  Enter the word DELETE and click OK to continue");

        if (dialogResult === "DELETE") {
            $.ajax({
                type: "POST",
                url: "/delete-account",
                data: {
                    password: dialogResult
                },
                success: function (data, textStatus, jqXHR) {
                    if (data.success === true) {
                        ST.router.navigate("/", { trigger: true });
                    } else {
                        alert("Error : " + data.message);
                    }
                },
                error: function (jqXHR, textStatus, error) {
                    console.log("Error..."); console.log(jqXHR);
                    console.log(textStatus); console.log(error);
                }
            });
        }
    },


    // change content of account page
    changePage: function (page) {
        switch(page) {
            case "myTales" :
                $("#divMyTales").show();
                $("#divAccountDetails").hide();
                break;
            case "favouriteTales" :
                $("#divMyTales").hide();
                $("#divAccountDetails").hide();
                break;
            case "accountDetails" :
                $("#divMyTales").hide();
                $("#divAccountDetails").show();
                break;
        }
    },


    // delete Tale
    deleteTale: function (idTale) {
        $.ajax({
            method: "POST",
            url: "/delete-tale",
            data: {
                idTale: idTale
            },
            success: function (data, textStatus, jqXHR) {
                Backbone.history.loadUrl();  // refresh page
            },
            error: function (jqXHR, textStatus, error) {
                alert(error); console.log(jqXHR);
                console.log(textStatus); console.log(error);
            }
        });
    }
});




// single row in the my tales table
ST.account.view.MyTalesItem = Backbone.View.extend({
    className: "divMyTaleItem",

    template: _.template($("#templateAccountTaleItem").html()),

    events: {
        "click .divMyTaleItemInner": "taleItemClicked",
        "click .imgEditButton": "editTale",
        "click .imgDeleteButton": "deleteTale"
    },

    render: function () {
        this.$el.html(this.template(this.model.toJSON()));
        return this;
    },

    taleItemClicked: function () {
        ST.router.navigate("/edit-tale/" + this.model.get("idTale"), { trigger: true });
    },

    editTale: function (e) {
        e.stopPropagation();

        $("#divDarkenScreen").show();
        new ST.dialog.view.EditTaleDialog(this.model.toJSON(), function (result) {
            // hide dialog
            $("#divDarkenScreen").hide();
            $("#divDialogContainer").empty();
            $("#divDialogContainer").unbind();

            // go to new tale
            if (result.success === true) {
                Backbone.history.loadUrl();  // refresh page
            }
        });
    },

    deleteTale: function (e) {
        e.stopPropagation();
        ST.account.view.main.deleteTale(this.model.get("idTale"))
    }
});
