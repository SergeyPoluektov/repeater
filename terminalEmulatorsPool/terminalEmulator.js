/**
 * Created by spolu on 02.06.2016.
 */
let net = require('net');
let config = require('config');
let log = require('libs/log')(module);
let crc = require('crc');
let Codec = require('libs/codecOmnicomm');
let magicNums = require('libs/magicNums');
let timeConst = require('libs/timeConstants');
let pubsub = require('libs/pubsub');  //emit event to webApp

class TerminalEmulator {
    constructor(dbTerm) {
        this._term = dbTerm;
        this._termId = dbTerm.terminalId[3] << 24 | dbTerm.terminalId[2] << 16 |
            dbTerm.terminalId[1] << 8 | dbTerm.terminalId[0];
        this._socket = null;
        this._timer = null;
        this._elemIndex = 0;
        this._packCount = 0;
        this._TRANSMIT_DELAY_TIME_MS = 1 * timeConst.MIN;

        this._codec = new Codec();
    }

    startTimer() {
        if (this._timer === null) {
            this._timer = 1;
            setTimeout(this._startTransmit.bind(this), this._TRANSMIT_DELAY_TIME_MS);
            log.info('Terminal ' + this._termId + ' has started transmit timer...');
        }
        else {
            log.info('Terminal ' + this._termId + ' timer already started...');
        }
    }

    _startTransmit() {
        if (this._term.elem.length) {
            log.info('Terminal ' + this._termId + ' trying to connect to server...');
            this._socket = net.createConnection({port: config.get("remotePort"), host: config.get("remoteHost")},
                this._sendInitCmd.bind(this));

            this._socket.on('data', this._parseData.bind(this));
            this._socket.on('end', this._handleEndTransmit.bind(this));
            this._socket.on('error', this._handleError.bind(this));
        }
        else {
            log.info('Terminal ' + this._termId + ' have no elements data...');
            this._timer = null;
            this.startTimer();
        }
    }

    _handleError() {
        log.error('Socket error...');
        this._timer = null;
        this.startTimer();
    }

    _handleEndTransmit() {
        log.info('Terminal ' + this._termId + ' is disconnected from server...');
        this._term.save(function (err) {
            log.info('Saved to DB...');
        });
        this._timer = null;
        this.startTimer();
    }

    _sendInitCmd() {
        log.info('Terminal ' + this._termId + ' send init command to server...');
        let buf = Buffer.concat([this._term.terminalId, this._term.fwVersion]);
        this._sendData(magicNums.INIT_CMD.CODE, buf);
    }

    _parseData(buf) {
        buf = this._codec.decode(buf);
        if (this._checkCrc(buf)) {
            log.info('CRC16 is ok...');

            let cmd = buf[magicNums.CMD_OFFSET];
            if (cmd === magicNums.RES_CMD.CODE) {
                log.info('Server response data...');
                this._packCount = 0;

                if (this._term.elem.length) {
                    let dataContainer = Buffer.alloc(0);
                    for (let i = 0; i < this._term.elem.length; i++) {
                        let elemDataContainer = Buffer.concat([this._term.elem[i].elemType, this._term.elem[i].elemId,
                            this._term.elem[i].elemData]);

                        if ((dataContainer.length + elemDataContainer.length) > 254) {
                            this._sendData(magicNums.DATA_SEQ_CMD.CODE_FOR_SERVER, dataContainer);
                            dataContainer = Buffer.alloc(0);
                            this._packCount++;
                        }
                        dataContainer = Buffer.concat([dataContainer, elemDataContainer]);
                        this._elemIndex = i + 1;

                        pubsub.emit('txElemData', {
                            termId: this._termId,
                            txElemCount: this._elemIndex
                        });
                    }
                    //send last packet with elements
                    this._sendData(magicNums.DATA_SEQ_CMD.CODE_FOR_SERVER, dataContainer);
                    this._packCount++;

                    log.info('Send ' + this._packCount + ' packets to server...');
                    log.info('Send ' + this._elemIndex + ' elements to server...');
                }

                log.info('Send end sequence packet...');
                this._sendData(magicNums.DATA_SEQ_CMD.CODE_FOR_SERVER, []);
            }
            else if (cmd === magicNums.DELETE_ELEM_CMD.CODE) {
                log.info('Start deleting elements...');

                let elemId = this._getNumFromSeq(Buffer.from(buf.slice(magicNums.DATA_OFFSET, magicNums.DATA_OFFSET + 4)));

                log.info('Delete to element with ID: ' + elemId);
                //delete elements to elemId
                let elemFromDbId = this._getNumFromSeq(this._term.elem[0].elemId);
                let deletedCount = 0;
                while (elemFromDbId <= elemId) {
                    this._term.elem[0].remove();
                    if (this._term.elem.length) {
                        elemFromDbId = this._getNumFromSeq(this._term.elem[0].elemId);
                    }
                    else {
                        elemFromDbId = elemId + 1;
                    }

                    deletedCount++;
                }
                log.info('Delete ' + deletedCount + ' elements from DB...');

                log.info('After delete elements length: ' + this._term.elem.length);
                this._sendData(magicNums.CONFIRM_DEL_ELEM_CMD.CODE,
                    buf.slice(magicNums.DATA_OFFSET, magicNums.DATA_OFFSET + 4));
                if (!this._term.elem.length) {
                    this._socket.end();
                }
            }
        }
        else {
            log.info('CRC16 not valid...');
        }
    }

    _sendData(cmd, dataBuf) {
        let bufLen = dataBuf.length + 4;
        let sendBuf = Buffer.alloc(bufLen);

        sendBuf[magicNums.CMD_OFFSET] = cmd;
        sendBuf[magicNums.LEN_OFFSET] = bufLen - 4;
        for (let i = 0; i < dataBuf.length; i++) {
            sendBuf[i + magicNums.DATA_OFFSET] = dataBuf[i];
        }
        if (!dataBuf.length) {
            sendBuf[magicNums.DATA_OFFSET] = 0;
        }
        let crc16 = crc.crc16ccitt(sendBuf.slice(0, -2));
        sendBuf[bufLen - 2] = crc16 >> 8;
        sendBuf[bufLen - 1] = crc16;
        sendBuf = this._codec.encode(sendBuf);
        this._socket.write(sendBuf);
    }

    _checkCrc(buf) {
        let crcFromBuf = (buf[buf.length-2] << 8 | buf[buf.length-1]).toString(16);
        let crcCalc = crc.crc16ccitt(buf.slice(0, -2)).toString(16);

        log.info('Received crc: ' + crcFromBuf);
        log.info('Calculate crc: ' + crcCalc);

        return crcFromBuf === crcCalc;
    }

    _getNumFromSeq(buf) {
        return buf[3] << 24 | buf[2] << 16 | buf[1] << 8 | buf[0];
    }
}

module.exports = TerminalEmulator;