var mng = require('../mng');

var plotSchema = new mng.Schema({
    plotNumber: String,
    villageName: String,
    villageNumber: Number,
    plotSize: Number,
    plotType: String,
    landType: String,
    allPlotInformation: [mng.Schema.Types.Mixed],     // whole "Informace o parcele" table
    owners:[ {
        name: String,
        address: String,
        share: String
    }],

    protection: [String],
    ownershipRestrictions: [String],
    otherRecords: [String]
});

plotSchema.index({plotNumber:1, villageNumber: 1});

module.exports = mng.model('plot', plotSchema);