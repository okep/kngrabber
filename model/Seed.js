var mng = require('../mng'),
    Schema = mng.Schema,
    model = mng.model;

/**
 * Name must be unique.
 * @type {mng.Schema}
 */
var seedSchema = new Schema({
    name: {type: String, index: {unique: true, dropDups: true}},
    url: String,
    villageCode: Number
});

module.exports = model('seed', seedSchema);


