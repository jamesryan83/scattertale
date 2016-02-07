"use strict";

var ST = ST || {};
ST.editItem = {};
ST.editItem.model = {};
ST.editItem.view = {};


// Tale Model
ST.editItem.model.TaleItem = Backbone.Model.extend({
    defaults: {
        "idItem": 0,
        "idTale": 0,
        "text": ""
    }
});




// Edit Item View
ST.editItem.view.Main = Backbone.View.extend({
    el: "#divContainerMain",

    template: _.template($("#templateEditItem").html()),

    initialize: function (data) {
        //console.log(data)
        this.render(data.result);
    },

    events: {
        "click #aLinkBack": "returnToViewTale",
        "keydown": "keyPressed"
    },

    render: function (data) {
        this.editorLoaded = false;
        this.model = new ST.editItem.model.TaleItem(data);

        this.$el.html(this.template());

        // CK Editor
        ST.util.removeCKEditorInstances();
        CKEDITOR.disableAutoInline = true;
        var editor = CKEDITOR.inline("divEditorTextArea", {
            removePlugins: "floatingspace,maximize,resize",
            sharedSpaces: {
                top: "divEditingTop",
                bottom: "divEditingBottom"
            }
        });

        editor.on("instanceReady", function () {
            CKEDITOR.instances.divEditorTextArea.setData(this.model.get("text"));
            $("#divEditorTextArea").focus();
            this.editorLoaded = true;
        }, this);

        //ST.util.setLayoutBackgroundColors(".layoutBG");

        return this;
    },


    // keyboard pressed
    keyPressed: function (e) {
        if (e.keyCode === 27 && this.editorLoaded === true) {
            this.returnToViewTale();
        }
    },


    // save item to server
    saveItem: function (callback) {
        if (this.model.get("idTale") === -1) { // try it out page, don't save
            callback()
        } else {
            console.log("saving item");
            var text = CKEDITOR.instances["divEditorTextArea"].getData();

            var data = {
                idItem: this.model.get("idItem"),
                text: text
            }

            $.ajax({
                method: "POST",
                url: "/update-item-text",
                data: data,
                success: function (data, textStatus, jqXHR) {
                    callback();
                },
                error: function (jqXHR, textStatus, error) {
                    alert(error); console.log(jqXHR);
                    console.log(textStatus); console.log(error);
                }
            });
        }
    },


    // return to tale view
    returnToViewTale: function () {

        var self = this;
        this.saveItem(function () {
            ST.util.removeCKEditorInstances();
            var idTale = self.model.get("idTale")[0] || self.model.get("idTale");
            if (idTale == -1) {
                ST.router.navigate("/edit-tale/try-it-out", { trigger: true });
            } else {
                ST.router.navigate("/edit-tale/" + idTale, { trigger: true });
            }
        });
    }
});


