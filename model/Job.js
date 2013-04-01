/*
* This Model represents Job of work for spider
* */

var mng = require('../mng'),
    Schema = mng.Schema,
    model = mng.model;

var jobSchema = new Schema({
    url: String,
    timestamp: {type: Date, index: { unique:true }},
    villageCode: {type: Number}
});

module.exports = model('job', jobSchema);
