"use strict";

var ST = ST || {};
ST.index = {};
ST.index.view = {};


ST.index.view.Main = Backbone.View.extend({
    el: "#divContainerMain",

    template: _.template($("#templateIndex").html()),

    events: {
        "click #buttonSearch": "search",
        "click #buttonAbout": "about",
        "click #buttonTryItOut": "tryItOut",
        "click #buttonLogin": "submitLogin",
        "click #buttonCreateAccount": "submitCreateAccount",
        "keyup #inputSearch": "keyEventSearchInput"
    },

    initialize: function () {
        //ST.util.setLayoutBackgroundColors(".layoutBG");
        this.render();
    },

    render: function () {
        this.$el.html(this.template());

        // title hover animation
        $("#imgTitle").hover(
            function () { $(this).attr("src", "res/TitleFrame.gif"); },
            function () { $(this).attr("src", "res/TitleFrame1.png"); }
        );


        // preload gif - http://stackoverflow.com/a/765957
        var image = new Image();
        image.src = "res/TitleFrame.gif";


        // blob graph thing in background
        this.blobGraphThingy("#divBackground");

        return this;
    },


    // search
    search: function () {
        ST.router.navigate("search-tales/" + $("#inputSearch").val(), { trigger: true });
    },


    // Enter key on search bar
    keyEventSearchInput: function (e) {
        if (e.keyCode === 13) {
            this.search();
        }
    },


    // about
    about: function () {
        ST.router.navigate("about", { trigger: true });
    },


    // try It Out (show edit-tale page with example content)
    tryItOut: function () {
        ST.router.navigate("edit-tale/try-it-out", { trigger: true });
    },


    // login
    submitLogin: function () {
        $.ajax({
            method: "POST",  // may have to use type ?
            url: "/login",
            data: {
                username: $("#inputLoginUsername").val(),
                password: $("#inputLoginPassword").val()
            },
            success: function (data, textStatus, jqXHR) {
                if (data.success === false) {
                    $("#labelLoginMessage").text(data.message);
                }
                else {
                    $("#labelLoginMessage").text("");
                    ST.router.navigate("account", { trigger: true });
                }
            },
            error: function (jqXHR, textStatus, error) {
                console.log("Error...");
                console.log(jqXHR);
                console.log(textStatus);
                console.log(error);
            }
        });
    },


    // create account
    submitCreateAccount: function () {
        var username = $("#inputCreateAccountUsername").val();
        var password = $("#inputCreateAccountPassword").val();
        var email = $("#inputCreateAccountEmail").val();
        var self = this;

        $.ajax({
            method: "POST",  // may have to use type ?
            url: "/create-account",
            data: {
                username: username,
                password: password,
                email: email
            },
            success: function (data, textStatus, jqXHR) {
                if (data.success === true) {
                    $("#labelCreateAccountMessage").text("");

                    // login
                    $("#inputLoginUsername").val(username);
                    $("#inputLoginPassword").val(password);
                    self.submitLogin();
                }
                else {
                    $("#labelCreateAccountMessage").text(data.message);
                }
            },
            error: function (jqXHR, textStatus, error) {
                console.log("Error...");
                console.log(jqXHR);
                console.log(textStatus);
                console.log(error);
            }
        });
    },


    // Background wobbly thing
    // currently an exact copy of http://bl.ocks.org/mbostock/4062045.  TODO : make it different
    blobGraphThingy: function (element) {

        var width = $(element).width() * 1.33;
        var height = $(element).height();

        //Set up the colour scale
        var color = d3.scale.category20();

        //Set up the force layout
        var force = d3.layout.force()
            .charge(-120)
            .linkDistance(30)
            .size([width, height]);

        //Append a SVG to the body of the html page. Assign this SVG as an object to svg
        var svg = d3.select(element).append("svg").attr("id", "svgBackground");

        $("#svgBackground").css({
            "width": width,
            "height": height
        });

        //Read the data from the mis element
        var graph = ST.data.graphData;

        //Creates the graph data structure out of the json data
        force.nodes(graph.nodes)
            .links(graph.links)
            .start();

        // Create all the line svgs but without locations yet
        var link = svg.selectAll(".link")
            .data(graph.links)
            .enter().append("line")
            .attr("class", "link")
            .attr("opacity", 0.7)
            .style("stroke", function (d) {
                return "#e2e2e2";
            })
            .style("stroke-width", function (d) {
                return d.value;
            });

        //Do the same with the circles for the nodes - no
        var node = svg.selectAll(".node")
            .data(graph.nodes)
            .enter().append("circle")
            .attr("class", "node")
            .attr("r", 10)
            .attr("opacity", 0.7)
            .style("fill", function (d) {
                return color(d.group);
            })
            .call(force.drag);


        // Now we are giving the SVGs co-ordinates - the force layout is generating
        // the co-ordinates which this code is using to update the attributes of the SVG elements
        force.on("tick", function () {
            link.attr("x1", function (d) {
                return d.source.x;
            })
                .attr("y1", function (d) {
                return d.source.y;
            })
                .attr("x2", function (d) {
                return d.target.x;
            })
                .attr("y2", function (d) {
                return d.target.y;
            });

            node.attr("cx", function (d) {
                return d.x;
            })
                .attr("cy", function (d) {
                return d.y;
            });
        });
    }
});
