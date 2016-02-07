"use strict";

// mssql options
exports.msSql = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    driver: "tedious",
    port: process.env.DB_PORT,
    stream: process.env.DB_STREAM === "true", // dotenv stores vars as strings
    connectionTimeout: 30000,
	idleTimeout: 30000,
    options: {
        encrypt: process.env.DB_ENCRYPT === "true",
        debug: {
            packet: process.env.DB_DEBUG_MODE === "true",
            data: process.env.DB_DEBUG_MODE === "true",
            payload: process.env.DB_DEBUG_MODE === "true",
            token: process.env.DB_DEBUG_MODE === "true",
            log: process.env.DB_DEBUG_MODE === "true"
        }
    },
    debug: process.env.DB_DEBUG_MODE === "true"
}

// connect-mssql options
exports.secret = process.env.DB_SESSION_SECRET;

exports.msSqlStoreOptions = {
    table: "sessions"
}
