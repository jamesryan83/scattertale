"use strict";

var ST = ST || {};
ST.editTale = {};
ST.editTale.model = {};
ST.editTale.collection = {};
ST.editTale.view = {};

// TODO : look into this collection helper thing - https://gist.github.com/geddski/1610397

// Startup
ST.editTale.start = function (data, initialView) {
    ST.editTale.view.main = new ST.editTale.view.Main(data);
    ST.editTale.view.graph = new ST.editTale.view.Graph();
    ST.editTale.view.rowList = new ST.editTale.view.RowList();
    ST.editTale.view.combined = new ST.editTale.view.Combined();
    ST.editTale.view.main.changeView(initialView);
}



// ************************** Models and Collections **************************

// Main Model (only 1 of these)
ST.editTale.model.Tale = Backbone.Model.extend({
    defaults: {
        "idTale": 1,
        "isPrivate": true,
        "picture": "http://placehold.it/32x32",
        "points": 0,
        "category": "Action",
        "title": "Untitled",
        "descriptionTale": "",
        "tags": "",
        "timeCreatedTale": "",
        "timeUpdatedTale": "",
        "rows": []
    },
    initialize: function (data) {
        this.set("rows",  new ST.editTale.collection.Rows(data.rows));
    }
});


// Row
ST.editTale.model.Row = Backbone.Model.extend({
    defaults: {
        "idRow": 1,
        "activeItem": 0,
        "rowNumber": 0,
        "items": []
    },
    initialize: function (data) {
        if (data && data.items) {
            this.set("items",  new ST.editTale.collection.RowItems(data.items));
        } else {
            this.set("items",  new ST.editTale.collection.RowItems());
        }
    }
});


// Row Item
ST.editTale.model.RowItem = Backbone.Model.extend({
    defauts: {
        "itemNumber": 0,
        "text": "default",
        "timeCreatedItem": "",
        "timeUpdatedItem": ""
    }
});


// Collection of Rows
ST.editTale.collection.Rows = Backbone.Collection.extend({
    model: ST.editTale.model.Row
});


// Collection of Row Items
ST.editTale.collection.RowItems = Backbone.Collection.extend({
    model: ST.editTale.model.RowItem
});














// ********************************** Views **********************************

// Edit Tale Main View
ST.editTale.view.Main = Backbone.View.extend({
    el: "#divContainerMain",

    template: _.template($("#templateEditTale").html()),

    events: {
        "change input[name=radioViewType]": "changeView",
        "click #buttonAddRow": "addRow",
        "click #aLinkCollapsedView": function () { this.changeView("Collapsed") },
        "click #aLinkDetailView": function () { this.changeView("Detail") }
    },

    initialize: function (data) {

        // sort incoming data - rows and items
        // even though it's sorted coming from server, for some reason gets out of order again
        if (data && data.rows && data.rows.length > 1) {
            data.rows.sort(function compare(a,b) {
                if (a.rowNumber < b.rowNumber) return -1;
                else if (a.rowNumber > b.rowNumber) return 1;
                else return 0;
            });

            for (var i = 0; i < data.rows.length; i++) {
                if (data.rows[i].items && data.rows[i].items.length > 1) {
                    data.rows[i].items.sort(function compare(a,b) {
                        if (a.itemNumber < b.itemNumber) return -1;
                        else if (a.itemNumber > b.itemNumber) return 1;
                        else return 0;
                    });
                }
            }
        }

        //console.log(data)

        this.render(data);
    },

    render: function (data) {

        this.model = new ST.editTale.model.Tale(data);

        this.$el.empty();
        this.$el.html(this.template(this.model.toJSON()));

        //ST.util.setLayoutBackgroundColors(".layoutBG");

        return this;
    },


    // change the view type
    changeView: function (view) {

        // when coming from combined view, need to set radio button, otherwise use radiobutton value
        if (typeof(view) !== "string") {
            view = $("input[name='radioViewType']:checked").attr("id").replace("radio", "")
        } else {
            $("#radio" + view).prop("checked", true);
        }

        // change view
        if (view === "Combined") {
            $("#divSidebar").hide();
            $("#divContent").hide();
            $("#divContentCombinedTop").show();
            $("#divContentCombined").show();
            ST.editTale.view.combined.render(this.model.get("rows"));
        } else {
            $("#divContentCombinedTop").hide();
            $("#divContentCombined").hide();
            $("#divSidebar").show();
            $("#divContent").show();
            ST.editTale.view.rowList.changeView(view);
        }

        $("body").scrollTop(0);
    },


    // return to previous view from combined view
    returnToPreviousView: function () {
        this.changeView(this.previousView);
    },



    // add a row to the tale
    addRow: function () {
        ST.editTale.view.rowList.addRow();
    },




    // save current model
    saveModel: function (callback) {

        if (window.location.href.indexOf("try-it-out") === -1) {
//            console.log("saving tale");
//            console.log(JSON.parse(JSON.stringify(this.model)))
            $.ajax({
                method: "POST",
                url: "/update-tale",
                data: JSON.parse(JSON.stringify(this.model)),
                success: function (data, textStatus, jqXHR) {
                    if (data.success === false && data.message === "incorrect idUser") {
                        callback(false)
                    } else {
                        callback(true)
                    }
                },
                error: function (jqXHR, textStatus, error) {
                    alert(error); console.log(jqXHR);
                    console.log(textStatus); console.log(error);
                }
            });
        } else {
            return callback(true);
        }
    }
});







// Graph View
ST.editTale.view.Graph = Backbone.View.extend({
    el: "#divGraphContainer",

    events: {
        "click .divGraphItemContainer": "itemClicked"
    },

    initialize: function () {
        this.collection = ST.editTale.view.main.model.get("rows");
    },

    render: function () {
        var numberOfItems = 0; // for calculating item width
        this.$el.empty();
        var container = document.createDocumentFragment();


        // find max number of columns on graph, graph is a 2D grid shape
        for (i = 0; i < this.collection.length; i++) {
            var items = this.collection.models[i].get("items");
            if (items.length > numberOfItems) {
                numberOfItems = items.length
            }
        }


        // create graph
        for (var i = 0; i < this.collection.length; i++) {

            var items = this.collection.models[i].get("items");
            var activeItem = this.collection.models[i].get("activeItem");


            // create row
            var rowDiv = document.createElement("div");
            rowDiv.className = "divGraphRow";


            // add items to row
            for (var j = 0; j < items.length; j++) {

                // item container
                var itemDivContainer = document.createElement("div");
                itemDivContainer.className = "divGraphItemContainer";
                itemDivContainer.style.width = 90 / numberOfItems + "%"; // 90% for safety

                itemDivContainer.title = "Row : " + (i + 1) + ", Item : " + (j + 1);

                itemDivContainer.setAttribute("data-row", i);
                itemDivContainer.setAttribute("data-item", j);

                // inner bit
                var itemDiv = document.createElement("div");

                if (j === activeItem) {
                    itemDiv.className = "divGraphItemActive";
                } else {
                    itemDiv.className = "divGraphItemInactive";
                }

                // div has container for padding
                itemDivContainer.appendChild(itemDiv);
                rowDiv.appendChild(itemDivContainer);
            }

            container.appendChild(rowDiv);
        }

        this.$el.append(container);
    },

    // Graph item clicked
    itemClicked: function (e) {
        var clickedRow = e.currentTarget.dataset.row;
        var clickedItem = e.currentTarget.dataset.item;

        this.collection.models[clickedRow].set("activeItem", parseInt(clickedItem));
        ST.editTale.view.rowList.setSelectedRow(clickedRow);
    }
});









// Edit Tale Row
ST.editTale.view.Row = Backbone.View.extend({
    className: "divEditTaleRow",

    template: _.template($("#templateEditTaleRow").html()),

    events: {
        "click .divRowContentLeft > .divRowArrowButton": "leftArrow",
        "click .divRowContentRight > .divRowArrowButton": "rightArrow",
        "click .divRowContentContainer": "contentClicked",
        "click .imgRowNotes": "notes",
        "click .imgRowEdit": "editItem",
        "click .imgRowAdd": "addItem",
        "click .imgRowDelete": "deleteItem",
    },

    initialize: function () {
        this.listenTo(this.model, "change", this.render);  // for activeItem change
        this.mouseIsDragging = false;
    },

    render: function () {
        var activeItem = this.model.get("activeItem");
        var currentModel = this.model.get("items").models[activeItem];

        ST.util.removeCKEditorInstances();

        this.$el.empty();
        this.$el.html(this.template({
            "rowNumber": this.model.get("rowNumber"),
            "itemNumber": activeItem,
            "totalItems": this.model.get("items").length,
            "author": "ST" // todo fix
        }));

        // text is appended separately so it renders properly
        this.$el.find(".divRowContentArea").append(currentModel.get("text"));

        // update graph
        ST.editTale.view.graph.render();

        // row icons
        ST.util.replaceImgWithSvg();
        var tempEl;
        var numItems = this.model.get("items").length;
        for (var i = 0; i < numItems; i++) {
            tempEl = document.createElement("div");
            tempEl.setAttribute("class", "divRowItemIcon");
            if (i === activeItem) {
                tempEl.setAttribute("style", "background-color: #FF753E");
            }
            this.$el.find(".divRowItemIcons").append(tempEl);
        }

        return this;
    },


    // leave notes on this item
    notes: function (e) {
        alert("notes not working yet")
    },


    // edit current item in edit page
    editItem: function () {
        var id = ST.editTale.view.main.model.get("idTale");
        var row = this.model.get("rowNumber");
        var item = this.model.get("activeItem");
        var url = "/edit-item/" + id + "/" + row + "/" + item;

        ST.editTale.view.main.saveModel(function (result) {
            if (result === true) {
                ST.router.navigate(url, { trigger: true });
            }
        });
    },


    // add new item to row
    addItem: function () {

        var date = ST.util.getDateNowServerFormat();
        var items = this.model.get("items");
        var newItemNumber = this.model.get("items").models.length;

        items.add({
            "itemNumber": newItemNumber,
            "text": "",
            "timeCreated": date,
            "timeUpdated": date
        });

        this.model.set("activeItem", newItemNumber);
        this.render();

        ST.editTale.view.rowList.setSelectedRow(this.model.get("rowNumber"));
    },


    // delete current Item
    deleteItem: function () {
        if (this.model.collection.length === 1 && this.model.get("items").length === 1) {
            alert("You can't delete the last item");
        } else {
            var activeItem = this.model.get("activeItem");
            var items = this.model.get("items");

            // remove row if last item on this row
            if (items.length === 1 && this.model.collection.length > 1) {
                this.model.collection.remove(this.model);
                ST.editTale.view.rowList.render();

            // remove item
            } else if (items.length > 1) {
                items.remove(items.models[activeItem]);

                for (var i = 0; i < items.length; i++) {
                    items.models[i].set("itemNumber", i);  // renumber items
                }

                if (activeItem < items.length) {
                    this.render();
                    return;
                } else {
                    this.model.set("activeItem", activeItem - 1);
                }

                ST.editTale.view.rowList.setSelectedRow(this.model.get("rowNumber"));
            }
        }
    },




    // left arrow div clicked
    leftArrow: function (e) {
        var activeItem = this.model.get("activeItem");
        if (activeItem > 0) {
            this.model.set("activeItem", activeItem - 1);
        }

        ST.editTale.view.rowList.setSelectedRow(this.model.get("rowNumber"));
    },


    // right arrow div clicked
    rightArrow: function (e) {
        var activeItem = this.model.get("activeItem");
        var numItems = this.model.get("items").length;
        if (activeItem < numItems - 1) {
            this.model.set("activeItem", activeItem + 1);
        }

        ST.editTale.view.rowList.setSelectedRow(this.model.get("rowNumber"));
    },


    // highlight an arrow div for a short time when an arrow key is pressed
    highlightArrow: function (side) {
        this.$el.find(".divRowContent" + side + " > .divRowArrowButton")
            .addClass("highlight");

        var thisObject = this;

        setTimeout(function () {
            thisObject.$el.find(".divRowContent" + side + " > .divRowArrowButton")
                .removeClass("highlight");
        }, 200);
    },





    // content area click
    contentClicked: function (e) {
        ST.editTale.view.rowList.setSelectedRow(this.model.get("rowNumber"));
    },


    // highlight selected item
    setSelected: function () {
        this.$el.find(".divRowContentContainer").addClass("selectedItem");
    },


    // unhighlight selected item
    setUnselected: function () {
        this.$el.find(".divRowContentContainer").removeClass("selectedItem");
    },


    // set the active item of the row
    setActiveItem: function (itemNumber) {
        this.model.set("activeItem", itemNumber);
    },





    // start edit mode
    startEditMode: function () {
        $("#divDarkenScreen").show();

        var element = "divRowContentArea" + this.model.get("rowNumber");

        // hide some stuff
        this.$el.find(".buttonCustom2").hide();
        $("#" + element).attr("contenteditable", true);
        $("#" + element).attr("spellcheck", false);
        this.$el.css("z-index", 3000);
        this.$el.find(".divRowArrowButton").hide();
        this.$el.find(".divImgContainer").hide();
        this.$el.focus();

        ST.editTale.view.rowList.editModeEnabled = true;

        $("#" + element).parent().find(".divRowDetails").css({ "background-color": "#e9e9e9" });

        // add CKEditor
        ST.util.removeCKEditorInstances();
        CKEDITOR.disableAutoInline = true;
        var editor = CKEDITOR.inline(element, {
            removePlugins: "floatingspace,maximize,resize",
            sharedSpaces: {
                top: "divRowEditingTop" + this.model.get("rowNumber"),
                bottom: "divRowEditingBottom" + this.model.get("rowNumber")
            }
        });


        // editor loaded event
        editor.on("instanceReady", function () {

            var activeItem = this.model.get("activeItem");
            var idTale = this.model.get("items").models[activeItem].get("idTale");
            var text = this.model.get("items").models[activeItem].get("text");

            // have to add text again, something in ckeditor startup removes the formatting
            CKEDITOR.instances["divRowContentArea" + this.model.get("rowNumber")].setData(text);
            ST.util.placeCaretAtEnd(this.$el.find(".divRowContentArea")[0]);

        }, this);
    },


    // end edit mode and save text
    endEditMode: function () {
        ST.editTale.view.rowList.editModeEnabled = false;

        var self = this;

        // set text in model
        var activeItem = this.model.get("activeItem");
        var text = CKEDITOR.instances["divRowContentArea" + this.model.get("rowNumber")].getData();
        self.model.get("items").models[activeItem].set("text", text);

        // return row to normal
        var element = "divRowContentArea" + this.model.get("rowNumber");
        $("#" + element).removeAttr("contenteditable");
        $("#" + element).removeAttr("spellcheck");
        $("#" + element).removeClass("cke_focus");
        $("#divContentRowList").focus();

        this.$el.find(".divRowArrowButton").show();
        this.$el.find(".buttonCustom2").show();
        this.$el.find(".divImgContainer").show();
        this.$el.css("z-index", 0);
        $("#divDarkenScreen").hide();

        ST.util.removeCKEditorInstances();

        $("#" + element).parent().find(".divRowDetails").css({ "background-color": "#f5f5f5" });





        ST.editTale.view.main.saveModel(function (result) {
            if (result === true)   {
                console.log("saved tale");
            } else {
                //CKEDITOR.instances["divRowContentArea" + this.model.get("rowNumber")].setData(this.tempText);
                alert("You can't edit other users Tales");
            }
        });

        this.setSelected();
    }
});







// Edit Tale List View
ST.editTale.view.RowList = Backbone.View.extend({
    el: "#divContentRowList",

    initialize: function () {
        this.rowItemsList = [];
        this.currentlySelectedView = "Detail";
        this.currentlySelectedRow = 0;
        this.editModeEnabled = false;
        this.render();
    },

    events: {
        "keydown": "keyPressed",
        "mousedown .divRowDetailsLeft": "mousePressed",
        "mouseup": "mouseReleased"
    },

    render: function () {
        this.collection = ST.editTale.view.main.model.get("rows");
        this.rowItemsList = [];

        this.$el.empty();
        var container = document.createDocumentFragment();

        // create Row views and add to rowItemsList
        for (var i = 0; i < this.collection.length; i++) {
            this.collection.models[i].set("rowNumber", i); // set row index incase collection has changed

            var row = new ST.editTale.view.Row({
                model: this.collection.models[i]
            });

            container.appendChild(row.render().el);
            this.rowItemsList.push(row);
        }

        this.$el.append(container);
        this.setSelectedRow(0);
        this.$el.focus();
        document.getElementById("divContentRowList").scrollTop = 0; // counteract scrollIntoView

        this.changeView(this.currentlySelectedView);

        ST.util.replaceImgWithSvg(); // for row icons

        return this;
    },



    // keyboard key pressed
    keyPressed: function (e) {

        // esc
        if (this.editModeEnabled === true && e.keyCode === 27) {
            this.rowItemsList[this.currentlySelectedRow].endEditMode();
        }

        if (this.editModeEnabled === true) return;

        switch (e.keyCode) {

            case 38 : // up
                if (this.currentlySelectedRow > 0) {
                    this.setSelectedRow(this.currentlySelectedRow - 1);
                }
                break;

            case 40 : // down
                if (this.currentlySelectedRow < this.collection.models.length - 1) {
                    this.setSelectedRow(this.currentlySelectedRow + 1);
                }
                break;

            case 37 : // left
                this.rowItemsList[this.currentlySelectedRow].leftArrow("keydown");
                this.rowItemsList[this.currentlySelectedRow].highlightArrow("Left");
                break;

            case 39 : // right
                this.rowItemsList[this.currentlySelectedRow].rightArrow("keydown");
                this.rowItemsList[this.currentlySelectedRow].highlightArrow("Right");
                break;

            case 13 : // enter
                this.rowItemsList[this.currentlySelectedRow].startEditMode();
                break;
        }

        if (e.keyCode === 37 || e.keyCode === 38 || e.keyCode === 39 || e.keyCode === 40) {
            e.preventDefault(); // stop scrollbar moving
        }
    },



    // set the selected row in the row list
    setSelectedRow: function (rowNumber) {

        if (!this.rowItemsList[rowNumber]) return;

        this.currentlySelectedRow = rowNumber;

        for (var i = 0; i < this.rowItemsList.length; i++) {
            this.rowItemsList[i].setUnselected();
        }

        this.rowItemsList[rowNumber].setSelected();

        if (this.rowItemsList[rowNumber].$el.visible() === false) {  // use visible.js library
            if (rowNumber === 0) {
                var tempEl = document.getElementById("divContentRowList");
                if (tempEl) tempEl.scrollTop = 0;
            } else {
                this.rowItemsList[rowNumber].$el[0].scrollIntoView();
            }
        }

        this.changeView();
    },


    // change list layout
    changeView: function (view) {
        if (view) {
            this.currentlySelectedView = view;
        }

        this.$el.focus();

        switch (this.currentlySelectedView) {
            case "Detail":
                this.$el.find(".divRowDetails").show();
                this.$el.find(".divRowContentLeft").show();
                this.$el.find(".divRowContentRight").show();
                break;

            case "Collapsed":
                this.$el.find(".divRowDetails").hide();
                this.$el.find(".divRowContentLeft").hide();
                this.$el.find(".divRowContentRight").hide();
                break;
        }
    },


    // Add a new row to the list with an empty item
    addRow: function () {
        var newRowNum = this.collection.length;

        // new row model
        this.collection.add({
            "activeItem": 0,
            "rowNumber": newRowNum,
            "items": []
        });

        // new row item model
        this.collection.models[newRowNum].get("items").add({
            "itemNumber": 0,
            "text": "<p></p>",
        });

        this.render();
        this.setSelectedRow(newRowNum);
    },


    // set draggedRowNumber on mouse down
    mousePressed: function (e) {
        e.preventDefault(); // mouseup only fires once if this isn't here

        this.draggedRowNumber = e.target.parentElement.dataset.rownumber;
        document.body.style.cursor = "copy";
    },


    // swap row on mouse up if different row
    mouseReleased: function (e) {
        document.body.style.cursor = "default";

        if (e.target.parentElement.dataset !== undefined) {
            var selectedModel = this.collection.models[e.target.parentElement.dataset.rownumber];

            if (selectedModel !== undefined) {
                var droppedRowNumber = selectedModel.get("rowNumber");
                if (droppedRowNumber !== undefined && this.draggedRowNumber !== droppedRowNumber) {
                    this.swapItems(this.draggedRowNumber, droppedRowNumber);
                    this.render();

                    ST.editTale.view.main.saveModel(function (result) {
                        if (result === true)   {
                            console.log("saved tale");
                        } else {
                            alert("Error saving tale");
                        }
                    });
                }
            }
        }
    },


    // for swapping two models in collection
    // http://stackoverflow.com/a/10987580/4359306
    swapItems: function(index1, index2) {
        this.collection.models[index1] =
            this.collection.models.splice(index2, 1, this.collection.models[index1])[0];
    }

});







// Combined Content View
ST.editTale.view.Combined = Backbone.View.extend({
    el: "#divContentCombinedContent",
    render: function (data) {

        this.$el.empty();

        // combine all html from all active items into a single string
        var text = "";
        for (var i = 0; i < data.models.length; i++) {
            var activeItem = data.models[i].get("activeItem");
            text += data.models[i].get("items").models[activeItem].get("text");
            text += "<br>";
        }


        if (text === "" || text === "<br>" || text === "null<br>") {
            this.$el.append("Nothing Here !<br><br>Return to Collapsed or Detail view to edit");
        } else {
            this.$el.append(text);
        }
    }
});

