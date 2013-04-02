/*
* This Model represents Job of work for spider
* */

var mng = require('../mng');

var jobSchema = new mng.Schema({
    url: String,
    baseUrl: String,
    timestamp: {type: Date, index: { unique:true }},
    villageCode: {type: Number}
});

module.exports = mng.model('job', jobSchema);
