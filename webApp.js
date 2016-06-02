/**
 * Created by spolu on 02.06.2016.
 */
let express = require('express');
let path = require('path');
let log = require('libs/log')(module);
let http = require('http');
let config = require('config');
let routes = require('./routes/index');

var app = express();
app.engine("ejs", require('ejs-locals'));

class WebApp {
    constructor() {
        this._server = null;
        this._app = app;
        // this._app = express();
        // this._app.engine("ejs", require('ejs-locals'));
        this._app.set('views', path.join(__dirname, 'views'));
        this._app.set('view engine', 'ejs');

        this._app.use(express.static(path.join(__dirname, 'public')));

        this._app.use('/', routes);
    }

    createServer() {
        this._server = http.createServer(this._app);
        this._server.listen(config.get('webPort'));
        this._server.on('error', this._onError.bind(this));
        this._server.on('listening', this._onListening.bind(this));
    }

    _onError(error) {
        if (error.syscall !== 'listen') {
            throw error;
        }

        let bind = 'Port ' + port;

        // handle specific listen errors with friendly messages
        switch (error.code) {
            case 'EACCES':
                log.error(bind + ' requires elevated privileges');
                process.exit(1);
                break;
            case 'EADDRINUSE':
                log.error(bind + ' is already in use');
                process.exit(1);
                break;
            default:
                throw error;
        }
    }

    _onListening() {
        let addr = this._server.address();
        let bind = 'port ' + addr.port;
        log.info('Listening on ' + bind);
    }
}

module.exports = WebApp;