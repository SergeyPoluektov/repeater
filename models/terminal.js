/**
 * Created by spolu on 02.06.2016.
 */
let mongoose = require('libs/mongoose'),
    Schema = mongoose.Schema;
let TerminalEmulatorsPool = require('terminalEmulatorsPool');
let pool = new TerminalEmulatorsPool();

let elemSchema = new Schema({
    elemType: Buffer,
    elemId: Buffer,
    elemData: Buffer
});

let terminalSchema = new Schema({
    terminalId: Buffer,
    fwVersion: Buffer,
    elem: [elemSchema]
});

terminalSchema.post('init', function (term) {
    pool.add(term);
});

terminalSchema.post('save', function (term) {
    pool.add(term);
});

exports.Terminal = mongoose.model('Terminal', terminalSchema);