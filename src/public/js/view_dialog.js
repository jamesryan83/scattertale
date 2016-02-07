"use strict";

var ST = ST || {};
ST.dialog = {};
ST.dialog.view = {};


// Dialog New Tale
ST.dialog.view.NewTaleDialog = Backbone.View.extend({
    el: "#divDialogContainer",

    template: _.template($("#templateDialogNewTale").html()),

    events: {
        "click #buttonDialogCreateTale": "createTale",
        "click #buttonDialogCancel": "cancel"
    },

    initialize: function (callback) {
        this.callback = callback;
        this.render();
    },

    render: function () {
        this.$el.html(this.template());


        // add categories to select
        // http://stackoverflow.com/a/11255259
        var selectEl = document.getElementById("selectDialogCategory");
        var optionEl;
        for (var i = 0; i < ST.data.categories.length; i++) {
            optionEl = document.createElement("option");
            optionEl.innerHTML = ST.data.categories[i];
            optionEl.value = ST.data.categories[i];
            selectEl.appendChild(optionEl);
        }

        //ST.util.setLayoutBackgroundColors(".layoutBG");

        return this;
    },

    // createTale clicked
    createTale: function () {
        var title = $("#inputDialogTitle").val();
        var self = this;

        if (title.length > 0) {

            var data = {
                "category": $("#selectDialogCategory :selected").text(),
                "title": title,
                "descriptionTale": $("#textareaDialogDescription").val(),
                "tags": $("#inputDialogTags").val(),
                "private": $("#inputDialogPrivate").is(":checked")
            }

            // create new tale on server
            $.ajax({
                method: "POST",
                url: "/create-tale",
                data: data,
                success: function (data, textStatus, jqXHR) {
                    if (data.success === true) {
                        self.callback(data);
                    } else {
                        console.log(data);
                        alert("Error : " + data.message);
                    }
                },
                error: function (jqXHR, textStatus, error) {
                    console.log("Error..."); console.log(jqXHR);
                    console.log(textStatus); console.log(error);
                }
            });

        } else {
            alert("A Title is required")
        }
    },


    // cancel clicked
    cancel: function () {
        this.callback({ success: false });
    }
});



// Dialog Edit Tale
ST.dialog.view.EditTaleDialog = Backbone.View.extend({
    el: "#divDialogContainer",

    template: _.template($("#templateDialogEditTale").html()),

    events: {
        "click #buttonDialogSave": "save",
        "click #buttonDialogCancel": "cancel"
    },

    initialize: function (modelData, callback) {
        this.modelData = modelData;
        this.callback = callback;
        this.render();
    },

    render: function () {
        this.$el.html(this.template());


        // add categories to select
        // http://stackoverflow.com/a/11255259
        var selectEl = document.getElementById("selectDialogCategory");
        var optionEl;
        for (var i = 0; i < ST.data.categories.length; i++) {
            optionEl = document.createElement("option");
            optionEl.innerHTML = ST.data.categories[i];
            optionEl.value = ST.data.categories[i];
            selectEl.appendChild(optionEl);
        }

        // set existing values
        selectEl.value = this.modelData.category;
        $("#inputDialogTitle").val(this.modelData.title);
        $("#textareaDialogDescription").val(this.modelData.descriptionTale);
        $("#inputDialogTags").val(this.modelData.tags);
        $("#inputDialogPrivate").prop("checked", this.modelData.isPrivate);


        //ST.util.setLayoutBackgroundColors(".layoutBG");

        return this;
    },

    // createTale clicked
    save: function () {
//        console.log(this.modelData)

        var title = $("#inputDialogTitle").val();
        var self = this;

        if (title.length > 0) {

            var data = {
                "idTale": this.modelData.idTale,
                "category": $("#selectDialogCategory :selected").text(),
                "title": title,
                "descriptionTale": $("#textareaDialogDescription").val(),
                "tags": $("#inputDialogTags").val(),
                "isPrivate": $("#inputDialogPrivate").is(":checked")
            }

            // create new tale on server
            $.ajax({
                method: "POST",
                url: "/update-tale-details",
                data: data,
                success: function (data, textStatus, jqXHR) {
                    if (data.success === true) {
                        self.callback(data);
                    } else {
                        console.log(data);
                        alert("Error : " + data.message);
                    }
                },
                error: function (jqXHR, textStatus, error) {
                    console.log("Error..."); console.log(jqXHR);
                    console.log(textStatus); console.log(error);
                }
            });

        } else {
            alert("A Title is required")
        }
    },


    // cancel clicked
    cancel: function () {
        this.callback({ success: false });
    }
});
