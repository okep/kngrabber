var mng = require('../mng'),
    Schema = mng.Schema,
    model = mng.model;

var plotSchema = new Schema({
    plotNumber: {type: String, index: {unique: true}},
    villageName: String,
    villageNumber: Number,
    plotSize: Number,
    plotType: String,
    landType: String,
    allPlotInformation: [Schema.Types.Mixed],     // whole "Informace o parcele" table
    owners:[ {
        name: String,
        address: String,
        share: String
    }],

    protection: [String],
    ownershipRestrictions: [String],
    otherRecords: [String]
});

module.exports = model('plot', plotSchema);