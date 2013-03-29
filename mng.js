/**
 * Db connection singleton
 */

var mongoose = require('mongoose');
var config = require('./config');
var log = require('./logger');

log.info('Connecting to MongoDB: ' + config.dbConnectionString);
mongoose.connect(config.dbConnectionString);

var db = mongose.connection;
db.on('error', function(err) {
    log.error('Connection error: ', err);
});

module.exports = mongoose;



