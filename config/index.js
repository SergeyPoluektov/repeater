/**
 * Created by spolu on 02.06.2016.
 */
let nconf = require('nconf');
let path = require('path');

nconf.argv()
    .env()
    .file({file: path.join(__dirname, 'config.json')});

module.exports = nconf;