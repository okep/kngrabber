var mng = require('../thirdparty/mng');

var _buildingSchema = {
    buildingNumber: String,
    villageName: String,
    villageCode: Number,
    buildingType: String,
    useKind: String,
    allBuildingInformation: [mng.Schema.Types.Mixed],
    owners:[ {
        name: String,
        address: String,
        share: String
    }],
    protection: [String],
    ownershipRestrictions: [String],
    otherRecords: [String]
};     jobToProcess.url

var buildingSchema = new mng.Schema({
    data: _buildingSchema,
    timestamp: Date,
    version: {type: Number, default: 0}
});


buildingSchema.index({"data.buildingNumber": 1, "data.villageCode": 1});

module.exports = mng.model('building', buildingSchema);