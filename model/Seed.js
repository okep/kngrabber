var mng = require('../mng');

/**
 * Name must be unique.
 * @type {mng.Schema}
 */
var seedSchema = new mng.Schema({
    name: {type: String, index: {unique: true, dropDups: true}},
    url: String,
    baseUrl: String,
    villageCode: Number
});

module.exports = mng.model('seed', seedSchema);


