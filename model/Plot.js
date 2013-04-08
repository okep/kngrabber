var mng = require('../thirdparty/mng');

var _plotSchema = {
    plotNumber: String,
    villageName: String,
    villageCode: Number,
    plotSize: Number,
    plotType: String,
    landType: String,
    allPlotInformation: mng.Schema.Types.Mixed,     // whole "Informace o parcele" table
    owners:[ {
        name: String,
        address: String,
        share: String
    }],

    protection: [String],
    ownershipRestrictions: [String],
    otherRecords: [String]
};

var plotSchema = new mng.Schema({
    data: _plotSchema,
    timestamp: Date,
    version: {type: Number, default: 0}
});

plotSchema.index({
    "data.plotNumber": 1,
    "data.villageCode": 1,
    "version": -1
});
module.exports = mng.model('plot', plotSchema);
