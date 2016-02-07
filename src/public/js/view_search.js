"use strict";

var ST = ST || {};
ST.search = {};
ST.search.model = {};
ST.search.collection = {};
ST.search.view = {};




// Search Tale Model
ST.search.model.SearchItem = Backbone.Model.extend({
    defaults: {
        "idTale": 0,
        "idUser": 0,
        "isPrivate": "true",
        "picture": "http://placehold.it/32x32",
        "points": "",
        "category": "Action",
        "title": "Untitled",
        "descriptionTale": "",
        "tags": [],
        "timeCreatedTale": "",
        "username": "",
        "displayName": ""
    }
});




// Search Tale Collection
ST.search.collection.SearchItems = Backbone.Collection.extend({
    model: ST.search.model.SearchItem,
    url: "/search-tales",
    parse: function (data) {
        return data.result;
    }
});











// Search View (whole page)
ST.search.view.Main = Backbone.View.extend({
    el: "#divContainerMain",

    template: _.template($("#templateSearch").html()),

    events: {
        "click #buttonSearchBar": "search",
        "click #aLinkPaginationStart": function() { this.pagingNavigate("start") },
        "click #aLinkPaginationPrev": function() { this.pagingNavigate("prev") },
        "click #aLinkPaginationNext": function() { this.pagingNavigate("next") },
        "click #aLinkPaginationEnd": function() { this.pagingNavigate("end") },
        "click #buttonPaginationGo": function() { this.pagingNavigate("page") },
        "change input[name=radioSort]": "sortItems",
        "keyup #inputSearchBar": "keyEventSearchInput"
    },

    initialize: function (searchTerm) {
        this.currentPageNumber = 1;
        this.itemsPerPage = 25;
        this.totalTaleItems = 0;
        this.totalPages = 1;

        this.render();

        if (searchTerm && searchTerm[0] !== null) {
            $("#inputSearchBar").val(searchTerm);
        }
    },

    render: function () {
        this.$el.html(this.template());

        $(".datepicker").pickadate({
            selectYears: true,
            selectMonths: true
        });

        //ST.util.setLayoutBackgroundColors(".layoutBG");

        return this;
    },


    // get tales from server
    search: function () {
        this.currentPageNumber = 1;
        ST.search.view.searchList.updateListView(1);
    },


    // key event on the search bar input
    keyEventSearchInput: function (e) {
        if (e.keyCode === 13) { // enter pressed
            this.search();
        }
    },


    // change page of taleListView
    pagingNavigate: function (command) {

        switch (command) {
            case "start":
                this.currentPageNumber = 1;
                ST.search.view.searchList.updateListView(1);
                break;

            case "prev":
                if (this.currentPageNumber > 1) {
                    this.currentPageNumber--;
                    ST.search.view.searchList.updateListView(this.currentPageNumber);
                }
                break;

            case "next":
                if (this.currentPageNumber < this.totalPages) {
                    this.currentPageNumber++;
                    ST.search.view.searchList.updateListView(this.currentPageNumber);
                }
                break;

            case "end":
                this.currentPageNumber = this.totalPages;
                ST.search.view.searchList.updateListView(this.totalPages);
                break;

            case "page":
                var pageValue = $("#inputPaginationPage").val();
                if (ST.util.isPositiveInteger(pageValue) === true) {
                    if (pageValue > 0 && pageValue <= this.totalPages) {
                        this.currentPageNumber = pageValue;
                        ST.search.view.searchList.updateListView(pageValue);
                    }
                }

                break;
        }
    },

    // update the page number (page x of y)
    updatePaging: function (data) {
        if (data.result.length > 0) {
            this.totalPages = Math.ceil(data.totalItemCount / this.itemsPerPage);

            $("#h3PaginationPage").text("Page " + this.currentPageNumber +
                                           " of " + this.totalPages);

            var resultText = data.totalItemCount === 1 ? " result" : " results";
            $("#labelResults").text(data.totalItemCount + resultText);
        } else {
            $("#h3PaginationPage").text("");
            $("#labelResults").text("0 Results");
        }
    },

    // Sort By radio button clicked
    sortItems: function () {
        this.currentPageNumber = 1;
        ST.search.view.searchList.updateListView(1);
    }
});





// Search Tale Item View
ST.search.view.SearchListItem = Backbone.View.extend({
    className: "divTaleItem",

    events: {
        "click .imgTaleItem": "loadTale",
        "click .divTaleItemTitle": "loadTale"
    },

    template: _.template($("#templateSearchItem").html()),

    render: function () {
        this.$el.html(this.template(this.model.toJSON()));
        return this;
    },

    // open tale
    loadTale: function () {
        ST.router.navigate("/tale/" + this.model.get("idTale"), { trigger: true });
    }
});




// Search Tale List View
ST.search.view.SearchList = Backbone.View.extend({
    el: "#divTales",

    initialize: function () {
        this.collection = new ST.search.collection.SearchItems();
        this.updateListView(1);
    },

    render: function () {
        this.$el.empty();

        // add search items to view
        if (this.collection.length > 0) {

            // use documentfragment, it's faster
            // http://ozkatz.github.io/avoiding-common-backbonejs-pitfalls.html
            var container = document.createDocumentFragment();

            // add tale items to list
            for (var i = 0; i < this.collection.models.length; i++) {
                var searchItem = new ST.search.view.SearchListItem({
                    model: this.collection.models[i]
                });
                container.appendChild(searchItem.render().el);
            }

            this.$el.append(container);
            $("#divSearchResults").scrollTop(0);  // scroll to top of tales list

        } else {
            this.$el.append('<div style="width: 100%; text-align: center">No Results...</div>');
        }

        return this;
    },


    // get search results from server and update list
    updateListView: function (page) {

        var searchTerm = document.getElementById("inputSearchBar").value;
        ST.router.navigate("/search-tales/" + searchTerm);

        // GET from server
        this.collection.fetch({
            data: {
                page: page,
                itemsPerPage: ST.search.view.main.itemsPerPage || 25,
                searchTerm: searchTerm,
                searchByTitle: document.getElementById("checkboxSearchTitle").checked,
                searchByCategory: document.getElementById("checkboxSearchCategory").checked,
                searchByDescription: document.getElementById("checkboxSearchDescription").checked,
                searchByTags: document.getElementById("checkboxSearchTags").checked,
                dateFrom: document.getElementById("inputFromDate").value,
                dateTo: document.getElementById("inputToDate").value,
                sortBy: $("input[name='radioSort']:checked").attr("id").replace("radio", "")
            },
            remove: true,
            reset: true,
            success: function (collection, response, options) {
                ST.search.view.main.updatePaging(response);
                ST.search.view.searchList.render();
//                console.log(collection);
//                console.log(response);
//                console.log(options);
            },
            error: function (collection, response, options) {
                console.log("error...");
                console.log(collection);
                console.log(response);
                console.log(options);
            }
        });
    }
});
