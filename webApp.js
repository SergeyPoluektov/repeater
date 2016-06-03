/**
 * Created by spolu on 02.06.2016.
 */
let express = require('express');
let path = require('path');
let log = require('libs/log')(module);
let http = require('http');
let config = require('config');
let routes = require('./routes/index');
let Terminal = require('models/terminal').Terminal;
let pubsub = require('libs/pubsub');

class WebApp {
    constructor() {
        this._onSocketConnection = this._onSocketConnection.bind(this);

        this._server = null;
        this._socket = null;
        this._app = express();
        this._app.engine("ejs", require('ejs-locals'));
        this._app.set('views', path.join(__dirname, 'views'));
        this._app.set('view engine', 'ejs');

        this._app.use(express.static(path.join(__dirname, 'public')));

        this._app.use('/', routes);

        pubsub.on('rxElemData', this._updateRxCount);
        pubsub.on('txElemData', this._updateTxCount);
    }

    _updateRxCount(data) {
        this._socket.emit('updateRxCount', data);
    }

    _updateTxCount(data) {
        this._socket.emit('updateTxCount', data);
    }

    _addRowToTable(term) {
        let data = {};
        data.termId = term.terminalId[3] << 24 | term.terminalId[2] << 16 |
            term.terminalId[1] << 8 | term.terminalId[0];
        data.rxCount = term.elem.length;
        data.txCount = 0;
        if (this._socket) {
            this._socket.emit('addToTable', data);
        }
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

        this._io = require('socket.io')(this._server);
        this._io.on("connection", this._onSocketConnection);
    }

    _onSocketConnection(socket) {
        log.info('socket.io user connected');
        this._socket = socket;
        Terminal.find({}, function(err, terminals) {
            terminals.forEach(function(term) {
                this._addRowToTable(term);
            }.bind(this));
        }.bind(this));
    }
}

module.exports = WebApp;