/**
 * Created by spolu on 02.06.2016.
 */
let net = require('net');
let config = require('config');
let log = require('libs/log')(module);
let crc = require('crc');
let magicNums = require('libs/magicNums');
let Codec = require('libs/codecOmnicomm');
let TerminalCache = require('./terminalCache');
let Terminal = require('models/terminal').Terminal;
let pubsub = require('libs/pubsub'); //emit event to webApp

class ServerEmulator {
    constructor() {
        this._term = null;
        this._socket = null;
        this._lastCmd = null;
        this._lastPacketLen = null;
        this._lastElemId = null;
        this._packCount = 0;
        this._elemsCount = 0;
        this._codec = new Codec();

        let tcpServer = net.createServer(this._createServer.bind(this));
        tcpServer.listen(config.get("localPort"), function () {
            log.info('server listening on %s port...', config.get("localPort"));
        });
    }

    _createServer(socket) {
        log.info('connection established...');
        this._socket = socket;
        this._socket.on('end', function () {
            log.info('client disconnected');
        });

        this._socket.on('data', this._handleConnection.bind(this));
    }

    _handleConnection(buf) {
        let decodeBuf = buf.slice();
        let shrinkBuf;

        while (decodeBuf.length) {
            let len = decodeBuf[magicNums.LEN_OFFSET + 1] + 4;
            decodeBuf = this._codec.decode(decodeBuf);
            shrinkBuf = decodeBuf.splice(0, len);
            shrinkBuf = Buffer.from(shrinkBuf);
            log.info('ShrinkBuf:');
            log.info(shrinkBuf);
            this._parsePacket(shrinkBuf);
        }
    }

    _parsePacket(buf) {
        if (this._checkCrc(buf)) {
            log.info('CRC16 is ok...');

            this._lastCmd = buf[magicNums.CMD_OFFSET];
            this._lastPacketLen = buf[magicNums.LEN_OFFSET];

            //handle command
            if (this._lastCmd === magicNums.INIT_CMD.CODE) {
                let termId = buf.slice(magicNums.INIT_CMD.ID_OFFSET,
                    magicNums.INIT_CMD.ID_OFFSET + magicNums.INIT_CMD.ID_LEN);
                let fwVers = buf.slice(magicNums.INIT_CMD.FW_OFFSET,
                    magicNums.INIT_CMD.FW_OFFSET + magicNums.INIT_CMD.FW_LEN);

                //create terminal cache instance
                this._term = new TerminalCache(termId, fwVers);
                this._elemsCount = 0;
                this._packCount = 0;
            }
            else if (this._lastCmd === magicNums.CONFIRM_DEL_ELEM_CMD.CODE) {
                log.info('Received: ' + this._packCount + ' packets...');
                let id = this._getNumFromSeq(buf.slice(magicNums.DATA_OFFSET, magicNums.DATA_OFFSET + 4));
                log.info('Confirmation deleting element with id: ' + id + ' by terminal: ' +
                    this._getNumFromSeq(this._term.termId));
                this._saveToDb();
            }
            else {
                log.info('Receive elements data...');
                this._parseElemData(buf.slice(2, -2)); //without CMD, LEN and CRC bytes
                this._packCount++;
            }
            this._sendAnswer();
        }
        else {
            log.info('CRC16 is not valid...');
        }
    }

    _saveToDb() {
        let context = this;
        Terminal.findOne({terminalId: context._term.termId}, function (err, term) {
            if (!term) {
                term = new Terminal({terminalId: context._term.termId, fwVersion: context._term.fwVers});
            }

            let count = 0;
            for(let i = 0; i < context._term.elems.length; i++) {
                term.elem.push(context._term.elems[i]);
                count++;
            }

            log.info('Received elems: ' + context._elemsCount + ', Saved elems: ' + count);

            term.save(function (err) {
                log.info('Save data from terminal: ' + context._getNumFromSeq(term.terminalId) + ' to db...');
            });
            context._socket.end();
        });
    }

    _parseElemData(buf) {
        for (let i = 0; i < buf.length; ) {
            let elemType = buf[magicNums.ELEM_TYPE_OFFSET + i];
            let elemLen = magicNums.ELEM_LEN.get(elemType);
            this._lastElemId = this._getNumFromSeq(buf.slice(magicNums.ELEM_ID_OFFSET, magicNums.ELEM_PAYLOAD_OFFSET));

            this._term.elems.push({
                elemType: Buffer.from([elemType]),
                elemId: buf.slice(magicNums.ELEM_ID_OFFSET + i, magicNums.ELEM_PAYLOAD_OFFSET + i),
                elemData: buf.slice(magicNums.ELEM_PAYLOAD_OFFSET + i, magicNums.ELEM_PAYLOAD_OFFSET + i + elemLen)
            });

            i += (elemLen + 5); //5 is 1 byte of element type and 4 bytes of element ID

            this._elemsCount++;

            pubsub.emit('rxElemData', {
                termId: this._getNumFromSeq(term.terminalId),
                rxElemCount: this._elemsCount
            });

        }
    }

    _sendAnswer() {
        let sendBuf = null;
        if (this._lastCmd === magicNums.INIT_CMD.CODE) {
            sendBuf = this._getSendBuf(magicNums.RES_CMD.CODE, magicNums.RES_CMD.ALL_DATA_ID, magicNums.RES_CMD.LEN);
            sendBuf = this._codec.encode(sendBuf);
        }
        else if (this._lastCmd === magicNums.DATA_SEQ_CMD.CODE_FOR_TERM && this._lastPacketLen) {
            sendBuf = this._getSendBuf(magicNums.CONFIRM_CMD.CODE, null, magicNums.CONFIRM_CMD.LEN);
            sendBuf = this._codec.encode(sendBuf);
        }
        else if (this._lastCmd === magicNums.DATA_SEQ_CMD.CODE_FOR_TERM && !this._lastPacketLen) {
            log.info('End sequence...');
            sendBuf = this._getSendBuf(magicNums.DELETE_ELEM_CMD.CODE, this._lastElemId, magicNums.DELETE_ELEM_CMD.LEN);
            sendBuf = this._codec.encode(sendBuf);
        }

        if (sendBuf !== null) {
            this._socket.write(sendBuf);
        }
    }

    _getSendBuf(cmd, dataElemId, len) {
        let sendBuf = Buffer.alloc(len);
        sendBuf[magicNums.CMD_OFFSET] = cmd;
        sendBuf[magicNums.LEN_OFFSET] = len - 4;
        if (dataElemId !== null) {
            sendBuf[magicNums.DATA_OFFSET] = dataElemId >> 24;
            sendBuf[magicNums.DATA_OFFSET + 1] = dataElemId >> 16;
            sendBuf[magicNums.DATA_OFFSET + 2] = dataElemId >> 8;
            sendBuf[magicNums.DATA_OFFSET + 3] = dataElemId;
        }
        let crc16 = crc.crc16ccitt(sendBuf.slice(0, -2));
        sendBuf[len - 2] = crc16 >> 8;
        sendBuf[len - 1] = crc16;

        return sendBuf;
    }

    _getNumFromSeq(buf) {
        return buf[3] << 24 | buf[2] << 16 | buf[1] << 8 | buf[0];
    }

    _checkCrc(buf) {
        let crcFromBuf = (buf[buf.length-2] << 8 | buf[buf.length-1]).toString(16);
        let crcCalc = crc.crc16ccitt(buf.slice(0, -2)).toString(16);

        log.info('Received crc: ' + crcFromBuf);
        log.info('Calculate crc: ' + crcCalc);

        return crcFromBuf === crcCalc;
    }
}

module.exports = ServerEmulator;