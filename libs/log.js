/**
 * Created by spolu on 02.06.2016.
 */
let winston = require('winston');
let ENV = process.env.NODE_ENV;

function getLogger(module) {
    "use strict";

    let path = module.filename.split('\\').slice(-2).join('\\');

    return new winston.Logger({
        transports: [
            new winston.transports.Console({
                colorize: true,
                level: ENV === 'development' ? 'debug' : 'error',
                label: path,
                timestamp: function() {
                    let date = new Date();
                    date.hours = date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
                    date.minutes = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
                    date.seconds = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();
                    let str = date.hours + ":" + date.minutes + ":" + date.seconds;
                    return str;
                }
            })
        ]
    });
}

module.exports = getLogger;