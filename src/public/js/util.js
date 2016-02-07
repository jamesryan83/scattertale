"use strict";

var ST = ST || {};
ST.util = {};


// set background color of elements to a color
ST.util.setLayoutBackgroundColors = function (className) {
    var els = $(className);
    var colors = ["#4DB4AA","#E297CB","#5d98c1","#E2D6CF","#82b2d0","#9E98CA","#69BCDE","#d8c0ca",
                  "#B76F8A","#5da8a7","#5DE2EA","#E0C7E6","#B3DEE2","#CBA5AB","#a56d7d","#9EB0C3",
                  "#a68ebf","#7AE5CF","#62958F","#BCD7C5","#4DB4AA","#E297CB","#89acc4","#E2D6CF",
                  "#82b2d0","#9E98CA","#69BCDE","#d8c0ca","#B76F8A","#5da8a7","#5DE2EA","#E0C7E6",
                  "#B3DEE2","#CBA5AB","#a56d7d","#9EB0C3","#a68ebf","#7AE5CF","#62958F","#BCD7C5"];

    for (var i = 0; i < els.length; i++) {
        $(els[i]).css({ "background-color": colors[i] });
    }
}


// check if positive integer
// http://stackoverflow.com/a/10835227
ST.util.isPositiveInteger = function (n) {
    return n >>> 0 === parseFloat(n);
}


// returns a short date from a date string
ST.util.getShortDate = function (d) {
    var date = new Date(d);
    var day = date.getDate();
    var monthIndex = date.getMonth();
    var year = date.getFullYear();

    return day + " " + ST.data.monthNames[monthIndex] + " " + year;
}


// returns a formatted date like how they are on the server
ST.util.getDateNowServerFormat = function () {
    return moment().format("YYYY-MM-DDTHH:mm:ss.SSSZ");
}


// remove all CKEDITOR instances
// http://stackoverflow.com/a/11689700
ST.util.removeCKEditorInstances = function () {
    for (name in CKEDITOR.instances) {
        CKEDITOR.instances[name].destroy(true);
    }
}


// Move caret to end of contenteditable
// http://stackoverflow.com/a/4238971
ST.util.placeCaretAtEnd = function (el) {
    el.focus();
    if (typeof window.getSelection != "undefined" && typeof document.createRange != "undefined") {
        var range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    } else if (typeof document.body.createTextRange != "undefined") {
        var textRange = document.body.createTextRange();
        textRange.moveToElementText(el);
        textRange.collapse(false);
        textRange.select();
    }
}


// TODO : i think this might be kinda slow
// Convert img with svg src to inline svg
// http://stackoverflow.com/a/24933495
ST.util.replaceImgWithSvg = function () {
    jQuery('img.svg').each(function() {
        var image = jQuery(this);
        var imgID = image.attr('id');
        var imgClass = image.attr('class');
        var imgURL = image.attr('src');

        jQuery.get(imgURL, function(data) {
            var svg = jQuery(data).find('svg');

            if (typeof imgID !== 'undefined') {
                svg = svg.attr('id', imgID);
            }

            if (typeof imgClass !== 'undefined') {
                svg = svg.attr('class', imgClass + ' replaced-svg');
            }

            svg = svg.removeAttr('xmlns:a');
            if(!svg.attr('viewBox') && svg.attr('height') && svg.attr('width')) {
                svg.attr('viewBox', '0 0 ' + svg.attr('height') + ' ' + svg.attr('width'))
            }

            image.replaceWith(svg);
        }, 'xml');
    });
}
