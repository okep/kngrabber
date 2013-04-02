var mng = require('../mng');

var buildingSchema = new mng.Schema({
    buildingNumber: String,
    villageName: String,
    villageNumber: Number,
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
});

buildingSchema.index({buildingNumber: 1, villageNumber: 1});

module.exports = mng.model('building', buildingSchema);