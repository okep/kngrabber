var mng = require('../mng'),
    Schema = mng.Schema,
    model = mng.model;

var buildingSchema = new Schema({
    buildingNumber: {type: String, index: {unique: false}},
    villageName: String,
    villageNumber: Number,
    buildingType: String,
    useKind: String,
    allBuildingInformation: [Schema.Types.Mixed],
    owners:[ {
        name: String,
        address: String,
        share: String
    }],
    protection: [String],
    ownershipRestrictions: [String],
    otherRecords: [String]
});

module.exports = model('building', buildingSchema);