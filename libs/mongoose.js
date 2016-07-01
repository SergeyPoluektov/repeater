/**
 * Created by spolu on 02.06.2016.
 */
let mongoose = require('mongoose');
let config = require('config');
let log = require('libs/log')(module);

mongoose.connect(config.get('mongoose:uri'));

mongoose.connection.once("open", function () {
    log.info('db connection etalblished...');
});

module.exports = mongoose;