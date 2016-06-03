/**
 * Created by spolu on 02.06.2016.
 */
let TerminalEmulator = require('./terminalEmulator');
let log = require('libs/log')(module);

class TerminalEmulatorsPool {
    constructor() {
        this._pool = new Map();
    }

    add(dbTerm) {
        let isTermInPool = false;
        let foundedKey = null;
        for (let term of this._pool.keys()) {
            if (term._id.id === dbTerm._id.id) {
                isTermInPool = true;
                foundedKey = term;
                break;
            }
        }
        if (isTermInPool) {
            let termEmu = this._pool.get(foundedKey);
            termEmu._term = dbTerm;
            log.info('Terminal emulator ' + termEmu._termId + ' data is updated...');
        }
        else {
            this._pool.set(dbTerm, new TerminalEmulator(dbTerm));
            this._pool.get(dbTerm).startTimer();
            log.info('Terminal emulator with ID: ' + this._pool.get(dbTerm)._termId + ' is created...');
        }
    }
}

module.exports = TerminalEmulatorsPool;