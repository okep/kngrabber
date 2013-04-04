var async = require('async'),
    log = require('./logger');

require('look').start();

var jobCounter = 0;
var giveMeJob = function giveMeJob(callback) {
    callback("Job "+jobCounter++);
};

var q = async.queue(function(job, callback){
    log.debug("executing " + job);
    callback();
});

q.drain = function() {
    giveMeJob(function(job){
        q.push(job, function(){
            log.debug("Finished " + job);
        })
    });
};

giveMeJob(function(job){
    q.push(job, function(){
        log.debug("Finished " + job);
    })
});
