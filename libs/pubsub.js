/**
 * Created by spolu on 03.06.2016.
 */
const EventEmitter = require('events');

class MyEmitter extends EventEmitter {}

const pubSub = new MyEmitter();

module.exports = pubSub;