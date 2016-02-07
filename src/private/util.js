"use strict";

var moment = require("moment");
var validateEmail = require("micro-email-validator");

// http://stackoverflow.com/a/2846911 - username
var regexUsername = /^(?=.{3,25}$)(?!.*[._-]{2})[a-z0-9][a-z0-9._-]*[a-z0-9]$/i;
var regexPassword = /[a-z0-9_!@#$%^&*\-+?=|.]{8,}/i;


// check username
exports.usernameOk = function (username) {
    if (typeof username === "string" || username instanceof String)
        return regexUsername.test(username);
    else
        return false;
}


// check password
exports.passwordOk = function (password) {
    if (typeof password === "string" || password instanceof String)
        return regexPassword.test(password);
    else
        return false;
}


// check email
exports.emailOk = function (email) {
    if (typeof email === "string" || email instanceof String)
        return validateEmail(email);
    else
        return false;
}


// date format like server
exports.getCurrentDateTimeInServerFormat = function () {
    return moment().format("YYYY-MM-DDTHH:mm:ss.SSSZ");
}


// get string values from array or variable - for database
exports.getFirstValueFromArrayOrVar = function (val) {
    // http://stackoverflow.com/a/26633883
    if (val.constructor === Array) {
        return val[0];
    } else {
        return val;
    }
}



