/**
 * Created by spolu on 02.06.2016.
 */
let Server = require('serverEmulator');
let Terminal = require('models/terminal').Terminal;
let log = require('libs/log')(module);
let pubsub = require('libs/pubsub');
let WebApp = require('./webApp');
let TerminalEmulatorsPool = require('terminalEmulatorsPool');

let pool = new TerminalEmulatorsPool();

new Server();
let webApp = new WebApp();
webApp.createServer();

//use this query for fill terminals pool if they are exists in DB
Terminal.find({}, function(err, terminals) {
    log.info("Found " + terminals.length + " terminals in DB...");
    terminals.forEach(function(term) {
        pool.add(term);
    });
});

pubsub.on('saveTerminal', (term) => {
    pool.add(term);
});