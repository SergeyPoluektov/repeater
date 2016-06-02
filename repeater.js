/**
 * Created by spolu on 02.06.2016.
 */
let Server = require('serverEmulator');
let Terminal = require('models/terminal').Terminal;
let log = require('libs/log')(module);

//use this query for fill terminals pool if they are exists in DB
Terminal.find({}, function(err) {
    log.info("Found terminals in DB...");
});

new Server();

let WebApp = require('./webApp');
new WebApp().createServer();