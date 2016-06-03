/**
 * Created by spolu on 02.06.2016.
 */
let mongoose = require('libs/mongoose'),
    Schema = mongoose.Schema;
let pubsub = require('libs/pubsub');

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

terminalSchema.post('save', function (term) {
    pubsub.emit('saveTerminal', term);
});

exports.Terminal = mongoose.model('Terminal', terminalSchema);