"use strict";

var ST = ST || {};
ST.tale = {};
ST.tale.model = {};
ST.tale.view = {};


// Tale Model
ST.tale.model.Tale = Backbone.Model.extend({
    defaults: {
        "idTale": 1,
        "category": "Action",
        "title": "Untitled",
        "descriptionTale": "",
        "text": ""
    }
});


// Tale view
ST.tale.view.Main = Backbone.View.extend({
    el: "#divContainerMain",

    template: _.template($("#templateTale").html()),

    initialize: function (data) {
        this.model = new ST.tale.model.Tale(data);
        this.render();
    },

    render: function () {

        this.$el.empty();
        this.$el.html(this.template());

        this.$el.find("#divContent").append(this.model.get("text"));

        return this;
    }
});
