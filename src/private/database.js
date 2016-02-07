"use strict";

var sql = require("mssql");
var util = require("./util");
var moment = require("moment");
var bcrypt = require("bcrypt-nodejs");
var connection = null;


// setup
exports.setup = function (config, callback) {

    // Connection Pool
    connection = new sql.Connection(config, function(err) {
        if (err)
            console.log(err);
    });

    connection.on('connect', function() {
        console.log("database connected");
        callback();
    });

    connection.on('error', function(err) {
        console.log(err);
    });
}







// ************************************** Account stuff **************************************


// Create Account
exports.createAccount = function (data, callback) {

    // validation
    if (util.usernameOk(data.username) === false) {
        return(callback({ success: false, message: "Invalid username" }));
    }

    if (util.passwordOk(data.password) === false) {
        return(callback({ success: false, message: "Invalid password" }));
    }

    if (util.emailOk(data.email) === false) {
        return(callback({ success: false, message: "Invalid email" }));
    }

    // encrypt password
    // http://security.stackexchange.com/a/17435
    var salt = bcrypt.genSaltSync(8);
    var passwordToSave = bcrypt.hashSync(data.password, salt);

    // query and parameters
    var query = "INSERT INTO Users (username, password, salt, email) " +
        "VALUES (@username, @password, @salt, @email)";

    var queryValues = [
        { param: "username", type: sql.NVarChar, value: data.username },
        { param: "password", type: sql.NVarChar, value: passwordToSave },
        { param: "salt", type: sql.NVarChar, value: salt },
        { param: "email", type: sql.NVarChar, value: data.email }
    ];

    exports.executeQuery(query, function (QueryResult) {
        if (QueryResult.success === true) {
            return(callback({ success: true }));
        } else {
            if (QueryResult.error.number === 2627) // 2627 = unique constraint violation
                return(callback({ success: false, message: "User already exists" }));
            else
                return(callback({ success: false, message: QueryResult.message }));
        }
    }, queryValues);
}



// Update Account
exports.updateAccount = function (idUser, details, callback) {
    var query = "UPDATE Users " +
        "SET displayName=@displayName, location=@location, url=@url, description=@description " +
        "WHERE idUser = @idUser";

    var queryValues = [
        { param: "displayName", type: sql.NVarChar, value: details.displayName },
        { param: "location", type: sql.NVarChar, value: details.location },
        { param: "url", type: sql.NVarChar, value: details.url },
        { param: "description", type: sql.NVarChar, value: details.description },
        { param: "idUser", type: sql.Int, value: idUser }
    ];

    exports.executeQuery(query, function (QueryResult) {
        if (QueryResult.success === true) {
                callback({ success: true });
            } else {
                callback({ success: false, message: QueryResult.error });
            }
    }, queryValues);
}




// Delete Account
exports.deleteAccount = function (idUser, callback) {

    // check if user exists
    var query = "SELECT idUser FROM Users WHERE idUser=" + idUser;

    exports.executeQuery(query, function (QueryResult) {

        // if user exists, delete account, tales and items
        if (QueryResult.result.length > 0) {
            var query = "DELETE FROM Users WHERE idUser=" + idUser;
            exports.executeQuery(query, callback);

            var query = "DELETE FROM Tales WHERE idUser=" + idUser;
            exports.executeQuery(query, function (QueryResult) {});

            var query = "DELETE FROM Items WHERE idUser=" + idUser;
            exports.executeQuery(query, function (QueryResult) {});

            var query = "DELETE FROM UserPictures WHERE idUser=" + idUser;
            exports.executeQuery(query, function (QueryResult) {});
        } else {
            callback({ success: false, message: "Could not find user" })
        }

    });
}




// Get account data for the account page
exports.getAccountData = function (idUser, callback) {
    var query = "SELECT Users.idUser, Users.displayName, Users.username, Users.email, " +
        "Users.timeCreatedUser, Users.timeUpdatedUser, Users.url, Users.location, Users.description, " +
        "Users.isActive, Users.favouriteTales, UserPictures.picture,Tales.*,TalePictures.talePicture " +
        "FROM Users LEFT JOIN UserPictures ON (Users.idUser = UserPictures.idUser) " +
        "LEFT JOIN Tales ON (Tales.idUser = Users.idUser) " +
        "LEFT JOIN TalePictures ON (Tales.idTale = TalePictures.idTale) " +
        "WHERE Users.idUser=" + idUser;

    exports.executeQuery(query, function (QueryResult) {
        if (QueryResult.success === true && QueryResult.result.length > 0) {
            var tempResult = QueryResult.result[0];

            // flatten data for returning
            var returnObject = {
                loggedIn: true,
                success: true,
                idUser: idUser,
                displayName: tempResult.displayName,
                username: tempResult.username,
                email: tempResult.email,
                timeCreatedUser: tempResult.timeCreatedUser,
                timeUpdatedUser: tempResult.timeUpdatedUser,
                url: tempResult.url,
                location: tempResult.location,
                description: tempResult.description,
                isActive: tempResult.isActive,
                favouriteTales: tempResult.favouriteTales,
                picture: null,
                tales: []
            }


            // convert picture to base64
            if(tempResult.picture !== null) {
                returnObject.picture = tempResult.picture.toString("base64");
            }

            // put tales in array
            if (tempResult.idTale !== null) {

                for (var i = 0; i < QueryResult.result.length; i++) {

                    var currentTale = QueryResult.result[i];

                    returnObject.tales.push({
                        idTale: currentTale.idTale,
                        descriptionTale: currentTale.descriptionTale,
                        isPrivate: currentTale.isPrivate,
                        points: currentTale.points,
                        category: currentTale.category,
                        title: currentTale.title,
                        tags: currentTale.tags,
                        timeCreatedTale: currentTale.timeCreatedTale,
                        picture: null
                    });

                    // convert tale picture to base64
                    if(currentTale.talePicture !== null) {
                        returnObject.tales[i].talePicture =
                            currentTale.talePicture.toString("base64");
                    }
                }


                callback(returnObject);
            } else {
                callback(returnObject); // TODO : is this required ?
            }

        } else {
            callback({ success: false, message: QueryResult.error })
        }
    });
}



// Add image to Account
exports.addImageToAccount = function (idUser, data, callback) {

    var query = "SELECT * FROM UserPictures WHERE idUser=" + idUser;

    exports.executeQuery(query, function (QueryResult) {

        if (QueryResult.success === true) {
            var query2;

            if (QueryResult.result.length === 0) {
                query2 = "INSERT INTO UserPictures (idUser, picture) VALUES (@idUser, @data)";
            } else {
                query2 = "UPDATE UserPictures Set picture=@data WHERE idUser=@idUser";
            }

            var queryValues = [
                { param: "idUser", type: sql.Int, value: idUser},
                { param: "data", type: sql.VarBinary, value: new Buffer(data, "binary") }
            ];

            exports.executeQuery(query2, function (QueryResult) {
                if (QueryResult.success === true) {
                    callback({ success: true });
                } else {
                    callback({ success: false, message: QueryResult.error });
                }
            }, queryValues);
        } else {
            callback({ success: false, message: QueryResult.error });
        }
    });
}


// Get image from Account
exports.getImage = function (imgId, callback) {

    var query = "SELECT picture FROM UserPictures WHERE idUser=" + imgId;

    exports.executeQuery(query, function (QueryResult) {
        if (QueryResult.success === true) {
            callback({
                success: true,
                image: QueryResult.result[0].picture.toString("base64")
            });
        } else {
            callback({ success: false, message: QueryResult.error });
        }
    });
}













// ************************************** For Passport **************************************

// Find Account
exports.findAccount = function (username, callback) {

    // validation
    if (util.usernameOk(username) === false) {
        return(callback({ success: false, message: "Invalid username" }));
    }

    // query and parameters
    var query = "SELECT * FROM Users WHERE username=@username";
    var queryValues = [{ param: "username", type: sql.NVarChar, value: username }];

    exports.executeQuery(query, callback, queryValues);
}




// findAccountById
exports.findAccountById = function (idUser, callback) {
    exports.executeQuery("SELECT * FROM Users WHERE idUser=" + idUser, callback);
}





















// ************************************** Tales and stuff **************************************


// create a new tale
exports.createTale = function (idUser, data, callback) {

    // insert empty tale
    var query = "INSERT INTO Tales (idUser, isPrivate, category, title, descriptionTale, tags) " +
        "OUTPUT INSERTED.idTale VALUES " +
        " (@idUser, @isPrivate, @category, @title, @descriptionTale, @tags)";

    var queryValues = [
        { param: "idUser", type: sql.Int, value: idUser },
        { param: "isPrivate", type: sql.Bit, value: JSON.parse(data.private) },
        { param: "category", type: sql.NVarChar, value: data.category },
        { param: "title", type: sql.NVarChar, value: data.title },
        { param: "descriptionTale", type: sql.NVarChar, value: data.descriptionTale },
        { param: "tags", type: sql.NVarChar, value: data.tags }
    ];

    exports.executeQuery(query, function (QueryResult) {
        // insert empty row
        var insertedTaleId = QueryResult.outputValue;
        var query2 = "INSERT INTO Rows (idTale) OUTPUT INSERTED.idRow VALUES (" + insertedTaleId + ")";

        exports.executeQuery(query2, function (QueryResult2) {
            var insertedRowId = QueryResult2.outputValue;

            // insert empty item
            var query3 = "INSERT INTO Items (idTale, idRow, idUser) " +
                "VALUES (" + insertedTaleId + ", " + insertedRowId + ", " + idUser + ")"

            exports.executeQuery(query3, function (QueryResult3) {
                callback({ success: true, idTale: insertedTaleId });
            });

        }, null, { name: "idRow", type: sql.Int });


    }, queryValues, { name: "idTale", type: sql.Int });
}



// update tale - TODO : promises or something
exports.updateTale = function (idUser, data, callback) {

    // only allow updates if tale owner is user
    var query = "SELECT * FROM Tales WHERE idTale=@idTale AND idUser=@idUser";
    var queryValues = [
        { param: "idTale", type: sql.Int, value: data.idTale },
        { param: "idUser", type: sql.Int, value: idUser }
    ];

    exports.executeQuery(query, function (QueryResult) {

        // user doesn't own tale
        if (QueryResult.result.length === 0) {
            callback({ success: false, message: "incorrect idUser" });


        // user owns tale
        } else {

            // delete old items
            query = "DELETE FROM Items WHERE idTale=@idTale";

            exports.executeQuery(query, function (QueryResult) {



                // delete old rows
                query = "DELETE FROM Rows WHERE idTale=@idTale";

                exports.executeQuery(query, function (QueryResult) {


                    var timenow = util.getCurrentDateTimeInServerFormat(); // for items



                    // update tale
                    query = "UPDATE Tales " +
                        "SET idUser=@idUser, isPrivate=@isPrivate, category=@category, " +
                        "title=@title, descriptionTale=@descriptionTale, tags=@tags " +
                        "WHERE idTale=@idTale";

                    queryValues = [
                        { param: "idUser", type: sql.Int, value: data.idUser },
                        { param: "isPrivate", type: sql.Bit, value: JSON.parse(data.isPrivate) },
                        { param: "category", type: sql.NVarChar, value: data.category },
                        { param: "title", type: sql.NVarChar, value: data.title },
                        { param: "descriptionTale", type: sql.NVarChar, value: data.descriptionTale },
                        { param: "tags", type: sql.NVarChar, value: data.tags },
                        { param: "idTale", type: sql.Int, value: data.idTale }
                    ];

                    exports.executeQuery(query, function (QueryResult) {
                        if (QueryResult.success === true) {

                            callback({ success: true });  // TODO : what if error after this ?



                            // insert new rows
                            for (var i = 0; i < data.rows.length; i++) {

                                query =
                                    "INSERT INTO Rows " +
                                    "(idTale, rowNumber, activeItem) OUTPUT INSERTED.idRow " +
                                    "VALUES (@idTale, @rowNumber, @activeItem)";

                                queryValues = [
                                    { param: "rowNumber", type: sql.Int, value: data.rows[i].rowNumber },
                                    { param: "activeItem", type: sql.Int, value: data.rows[i].activeItem },
                                    { param: "idRow", type: sql.Int, value: data.rows[i].idRow },
                                    { param: "idTale", type: sql.Int, value: data.idTale }
                                ];

                                exports.executeQuery(query, function (QueryResult) {
                                    var insertedRowId = QueryResult.outputValue;
                                    var index = QueryResult.index;



                                    // insert new items
                                    for (var j = 0; j < data.rows[index].items.length; j++) {
                                        var query2 =
                                            "INSERT INTO Items " +
                                            "(idTale, idRow, idUser, itemNumber, text) " +
                                            "VALUES (@idTale, @idRow, @idUser, @itemNumber, @text)";

                                        var queryValues2 = [
                                            { param: "idItem", type: sql.Int,
                                             value: data.rows[index].items[j].idItem },
                                            { param: "idRow", type: sql.Int, value: insertedRowId },
                                            { param: "idUser", type: sql.Int, value: idUser },
                                            { param: "itemNumber", type: sql.Int,
                                             value: data.rows[index].items[j].itemNumber },
                                            { param: "text", type: sql.NVarChar,
                                             value: data.rows[index].items[j].text },
                                            { param: "timeUpdatedItem", type: sql.DateTime2, value: timenow },
                                            { param: "idTale", type: sql.Int, value: data.idTale }
                                        ];

                                        exports.executeQuery(query2, function (QueryResult2) {
                                            // TODO : no message when error ?
                                        }, queryValues2);
                                    }
                                }, queryValues, { name: "idRow", type: sql.Int }, i);
                            }
                        } else {
                            callback({ success: false, message: QueryResult2.error });
                        }
                    }, queryValues);
                }, queryValues);

            }, queryValues);
        }
    }, queryValues);
}



// Update the text for a single item
exports.updateTaleDetails = function (idUser, data, callback) {

    var query = "UPDATE Tales SET category=@category, title=@title, descriptionTale=@descriptionTale, tags=@tags, isPrivate=@isPrivate WHERE idTale=@idTale AND idUser=@idUser";

    var queryValues = [
        { param: "category", type: sql.NVarChar, value: data.category },
        { param: "title", type: sql.NVarChar, value: data.title },
        { param: "descriptionTale", type: sql.NVarChar, value: data.descriptionTale },
        { param: "tags", type: sql.NVarChar, value: data.tags },
        { param: "isPrivate", type: sql.Bit, value: JSON.parse(data.isPrivate) },
        { param: "idTale", type: sql.Int, value: data.idTale },
        { param: "idUser", type: sql.Int, value: idUser }
    ];

    exports.executeQuery(query, function (QueryResult) {
        if (QueryResult.success === true) {
            callback ({ success: true });
        } else {
            callback({ success: false, message: "Error updating item" });
        }
    }, queryValues);
}




// Update the text for a single item
exports.updateItemText = function (idUser, data, callback) {

    var query = "UPDATE Items SET text=@text WHERE idItem=@idItem AND idUser=@idUser";

    var queryValues = [
        { param: "text", type: sql.NVarChar, value: data.text },
        { param: "idItem", type: sql.Int, value: parseInt(data.idItem) },
        { param: "idUser", type: sql.Int, value: idUser }
    ];

    exports.executeQuery(query, function (QueryResult) {
        if (QueryResult.success === true) {
            callback ({ success: true });
        } else {
            callback({ success: false, message: "Error updating item" });
        }
    }, queryValues);
}







// delete tale
exports.deleteTale = function (user, data, callback) {

    var query = "DELETE FROM Tales WHERE idTale=@idTale";
    var queryValues = [{ param: "idTale", type: sql.Int, value: data.idTale }];

    exports.executeQuery(query, function (QueryResult) {
        if (QueryResult.success === true) {

            // delete rows and items
            var query2 = "DELETE FROM Rows WHERE idTale=@idTale";
            var query3 = "DELETE FROM Items WHERE idTale=@idTale";
            exports.executeQuery(query2, function (QueryResult2) {}, queryValues);
            exports.executeQuery(query3, function (QueryResult3) {}, queryValues);

            callback({ success: true });
        } else {
            callback({ success: false, message: QueryResult.error });
        }
    }, queryValues);
}


// Get tale with active items combined
exports.getTale = function (idTale, callback) {
    var query = "SELECT * FROM Tales " +
        "LEFT JOIN Rows ON (Rows.idTale=Tales.idTale) " +
        "LEFT JOIN Items ON (Items.idTale=Tales.idTale AND " +
            "Items.idRow=Rows.idRow AND   Items.itemNumber=Rows.activeItem) " +
        "WHERE Tales.idTale=@idTale " +
        "ORDER BY Rows.rowNumber";

    var queryValues = [{ param: "idTale", type: sql.Int, value: idTale }];

    exports.executeQuery(query, function (QueryResult) {
        if (QueryResult.success === true && QueryResult.result.length > 0) {

            // flatten to return object
            var result = {
                category: QueryResult.result[0].category,
                descriptionTale: QueryResult.result[0].descriptionTale,
                idTale: QueryResult.result[0].idTale[0],
                title: QueryResult.result[0].title,
                text: ""
            }

            // concatenate text from each row
            for (var i = 0; i < QueryResult.result.length; i++) {
                result.text += QueryResult.result[i].text;
            }

            callback({ success: true, data: result });

        } else {
            callback({ success: false, message: "Tale not found" });
        }
    }, queryValues);
}


// Get a Tale for the edit tale page
exports.getEditTale = function (idTale, callback) {

    // get Tale
    var query = "SELECT * FROM Tales WHERE idTale=@idTale ORDER BY idTale";
    var queryValues = [{ param: "idTale", type: sql.Int, value: idTale }];
    exports.executeQuery(query, function (QueryResult) {

        if (QueryResult.success === true && QueryResult.result.length > 0) {

            var returnData = QueryResult.result[0];

            // get Rows
            query = "SELECT * FROM Rows WHERE idTale=@idTale";
            exports.executeQuery(query, function (QueryResult2) {

                returnData.rows = QueryResult2.result;

                // get Items
                query = "SELECT * FROM Items WHERE idTale=@idTale";
                exports.executeQuery(query, function (QueryResult3) {

                    var items = QueryResult3.result;

                    // put items into rows
                    for (var i = 0; i < items.length; i++) {
                        for (var j = 0; j < returnData.rows.length; j++) {
                            if (returnData.rows[j].idRow === items[i].idRow) {

                                if (returnData.rows[j].items === undefined) {
                                    returnData.rows[j].items = [];
                                }

                                returnData.rows[j].items.push(items[i])
                            }
                        }
                    }


                    returnData.rows.sort(function compare(a,b) {
                        if (a.rowNumber < b.rowNumber) return -1;
                        else if (a.rowNumber > b.rowNumber) return 1;
                        else return 0;
                    });


                    // get lastest update date
                    exports.getLatestTaleUpdate(idTale, function (QueryResult3) {
                        returnData.timeUpdatedTale = QueryResult3.result.timeUpdatedItem;
                        callback(returnData);
                    });

                }, queryValues);
            }, queryValues);
        } else {
            callback({ success: false, message: "Tale not found" });
        }
    }, queryValues);
}






// Get a single Item from a Tale for the edit item page
exports.getEditItem = function (data, callback) {
    var query = "SELECT Tales.*, Rows.*, Items.*, Users.displayName, Users.username FROM Tales " +
        "LEFT JOIN Users ON (Users.idUser = Tales.idUser) " +
        "LEFT JOIN Rows ON (Tales.idTale = Rows.idTale) " +
        "LEFT JOIN Items ON (Rows.idRow = Items.idRow) " +
        "WHERE Items.idTale = @idTale AND Rows.rowNumber = @row AND Items.itemNumber = @item";

    var queryValues = [];
    queryValues.push(
        { param: "idTale", type: sql.Int, value: data.taleId },
        { param: "row", type: sql.Int, value: data.row },
        { param: "item", type: sql.Int, value: data.item }
    );

    exports.executeQuery(query, function (QueryResult) {
        if (QueryResult.success === true) {
            callback({ success: true, result: QueryResult.result[0] })
        } else {
            callback({ success: false, message: QueryResult.error });
        }

    }, queryValues);
}




// search tales
exports.searchTales = function (searchOptions, callback) {
    // object for returning
    var searchResult = {
        totalItemCount: 0,
        result: null
    };

    var query1 = "SELECT Tales.*, Users.username, Users.displayName, Items.timeUpdatedItem FROM Tales " +
        "LEFT JOIN Users ON (Tales.idUser = Users.idUser) " +
        "OUTER APPLY (" +
            " SELECT TOP(1) timeUpdatedItem FROM Items WHERE idTale=Tales.idTale " +
            " ORDER BY timeUpdatedItem DESC) Items ";


    var queryValues = []; // SQL parameterized parameters
    var extra = [];  // stuff appended to SQL query is added to this


    // search by
    if (searchOptions.searchTerm.length > 0) {

        queryValues.push(
            { param: "searchTerm", type: sql.NVarChar, value: searchOptions.searchTerm });

        if (searchOptions.searchByTitle === "true")  {
            // [piece of SQL statement, preceding conditional SQL operator]
            extra.push([" title LIKE '%' + @searchTerm + '%'", " OR"]);
        }

        if (searchOptions.searchByCategory === "true")  {
            extra.push([" category LIKE '%' + @searchTerm + '%'", " OR"]);
        }

        if (searchOptions.searchByAuthor === "true")  {
            extra.push([" username LIKE '%' + @searchTerm + '%'", " OR"]);
        }

        if (searchOptions.searchByAuthor === "true")  {
            extra.push([" displayName LIKE '%' + @searchTerm + '%'", " OR"]);
        }

        if (searchOptions.searchByDescription === "true")  {
            extra.push([" Tales.descriptionTale LIKE '%' + @searchTerm + '%'", " OR"]);
        }

        if (searchOptions.searchByTags === "true")  {
            extra.push([" tags LIKE '%' + @searchTerm + '%'", " OR"]);
        }
    }


    // time created
    if (moment(searchOptions.dateFrom, "D MMMM, YYYY").isValid()) {
        queryValues.push(
            { param: "dateFrom", type: sql.DateTime2, value: searchOptions.dateFrom });

         extra.push([" timeCreatedTale >= @dateFrom", " AND"]);
    }

    if (moment(searchOptions.dateTo, "D MMMM, YYYY").isValid()) {
        queryValues.push(
            { param: "dateTo", type: sql.DateTime2, value: searchOptions.dateTo });

         extra.push([" timeCreatedTale <= @dateTo", " AND"]);
    }

    // TODO : add time updated

    query1 += " WHERE isPrivate=0 "

    // join required extra bits onto query
    for (var i = 0; i < extra.length; i++) {
        if (i === 0) {
            query1 += " AND " + extra[i][0];
        } else {
            query1 += extra[i][1] + extra[i][0];
        }
    }




    // sort by
    switch (searchOptions.sortBy) {
        case "Points" : query1 += " ORDER BY Tales.points DESC"; break;
        case "DateStarted" : query1 += " ORDER BY Tales.timeCreatedTale DESC"; break;
        case "Categories" : query1 += " ORDER BY Tales.category"; break;
        case "Title" : query1 += " ORDER BY Tales.title"; break;
    }



    // execute query1 - get totalItemCount
    exports.executeQuery(query1, function (QueryResult) {
        searchResult.totalItemCount = QueryResult.result.length;

        // Pagination
        // https://technet.microsoft.com/en-us/library/gg699618(v=sql.110).aspx
        var query2 = query1 + " OFFSET " + (searchOptions.itemsPerPage * (searchOptions.page - 1)) +
            " ROWS FETCH NEXT " + searchOptions.itemsPerPage + " ROWS ONLY";


        if (process.env.ENVIRONMENT === "development") {
            console.log(query2 + " [searchTerm : " + searchOptions.searchTerm + "]");
        }

        // execute query2 - get rows of data
        exports.executeQuery(query2, function (QueryResult2) {
            searchResult.result = QueryResult2.result;
            callback(searchResult);
        }, queryValues);

    }, queryValues);
}



// returns date of latest tale item - internal use
exports.getLatestTaleUpdate = function (idTale, callback) {
    var query = "SELECT TOP(1) timeUpdatedItem FROM Items WHERE idTale=@idTale " +
        "ORDER BY timeUpdatedItem DESC ";

    var queryValues = [{ param: "idTale", type: sql.Int, value: idTale}];

    exports.executeQuery(query, function (QueryResult) {
        if (QueryResult.success === true) {
            callback({ success: true, result: QueryResult.result[0] });
        } else {
            callback({ success: false, message: "Error trying to find latest Item" });
        }
    }, queryValues);
}





// ************************************** Generic T-SQL **************************************


// Execute a T-SQL query with parameters (query & callback required)
exports.executeQuery = function (query, callback, queryValues, output, index) {

    // a query object for returning
    var QueryResult = {
        query: query,
        queryValues: queryValues,
        success: false,
        message: null,
        result: null,
        outputValue: null,
        error: null,
        index: index
    };

    // Begin transaction
    var transaction = new sql.Transaction(connection);
    transaction.begin(function (err) {
        if (err) {
            QueryResult.message = "error beginning transaction";
            QueryResult.error = err;
            callback(QueryResult);
            return;
        }

        // Rollback event
        var rolledBack = false;
        transaction.on("rollback", function (aborted) {
            rolledBack = true;
        });


        // Request
        var request = transaction.request();
        if (output) request.output(output.name, output.type);



        // Add parameterized values
        if (queryValues) {
            for (var i = 0; i < queryValues.length; i++) {
                request.input(queryValues[i].param, queryValues[i].type, queryValues[i].value);
            }
        }

        // Execute query
        request.query(query, function (err, recordset) {

            if (err) {
                QueryResult.error = err;
                if (!rolledBack) {
                    transaction.rollback(function (err) {
                        QueryResult.message = "error in query";
                        return(callback(QueryResult));
                    });
                }
            } else {

                transaction.commit(function (err) {
                    if (err) {
                        QueryResult.message = "error during commit";
                        QueryResult.error = err;
                        return(callback(QueryResult));
                    } else {
                        if (output) QueryResult.outputValue = recordset[0][output.name];
                        QueryResult.success = true;
                        QueryResult.result = recordset;
                        callback(QueryResult);
                    }
                });
            }
        });
    });
}
