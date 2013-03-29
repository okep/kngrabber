var mng = require('../mng');

/**
 * Name must be unique.
 * @type {mng.Schema}
 */
var seedSchema = new mng.Schema({
    name: String,
    url: String
});

var SeedModel = mng.model('seed', seedSchema);

module.exports = SeedModel;

