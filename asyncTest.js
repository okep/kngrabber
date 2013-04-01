var async = require('async'),
    log = require('./logger');

var a = 0;

async.forever(function krava(){
    log.debug(a++);
});