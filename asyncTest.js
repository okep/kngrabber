var async = require('async');

async.nextTick = function (fn) {
    setImmediate(fn);
};
/*

 var jobCounter = 0;
 var giveMeJob = function giveMeJob(callback) {
 callback("Job "+jobCounter++);
 };



 var q = async.queue(function(job, callback){
 console.log("executing " + job);
 callback();
 });

 q.drain = function() {
 giveMeJob(function(job){
 q.push(job, function(){
 console.log("Finished " + job);
 })
 });
 };

 giveMeJob(function(job){
 q.push(job, function(){
 console.log("Finished " + job);
 })
 });
 */

var pole = [1, 2, 3];

async.waterfall([
    function (callback) {
        pole.forEach(function (value) {
            callback(null, value);
        });
    }
],
    function (err, value) {
        console.log(value);
    });