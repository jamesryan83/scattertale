"use strict";

var ST = ST || {};
ST.about = {};
ST.about.view = {};

// About View
ST.about.view.Main = Backbone.View.extend({
    el: "#divContainerMain",

    template: _.template($("#templateAbout").html()),

    initialize: function () {
        this.render();
    },
    
    render: function () {
        this.$el.html(this.template());

        return this;
    }
});
