"use strict";

var ST = ST || {};
ST.four04 = {};
ST.four04.view = {};

// 404 View
ST.four04.view.Main = Backbone.View.extend({
    el: "#divContainerMain",
    template: _.template($("#templateFour04").html()),
    initialize: function () {
        this.render();
    },
    render: function () {
        this.$el.html(this.template());

        return this;
    }
});
