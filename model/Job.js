/*
* This Model represents Job of work for spider
* */

var mng = require('../thirdparty/mng');

var jobSchema = new mng.Schema({
    url: { type: String, index: {unique: true}},
    baseUrl: String,
    timestamp: {type: Date},
    villageCode: {type: Number},
    visited: {type: Boolean, default: false}
});

module.exports = mng.model('job', jobSchema);
