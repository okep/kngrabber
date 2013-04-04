var fs = require('fs'),
    async = require('async'),
    cheerio = require('cheerio'),
    parsers = require('../parsers'),
    DocumentTypeEnum = parsers.DocumentTypeEnum;

module.exports = {
    'setUp': function setUp(callback) {
        var that = this;
        async.waterfall([
            function readPlotFile(clb) {
                fs.readFile('./test/resources/plot.html', 'utf8', function (err, data) {
                    that.plotFile = cheerio.load(data);
                    clb(err);
                })
            },
            function readListFile(clb) {
                fs.readFile('./test/resources/list.html', 'utf8', function (err, data) {
                    that.listFile = cheerio.load(data);
                    clb(err);
                })
            },
            function readBuildingFile(clb) {
                fs.readFile('./test/resources/building.html', 'utf8', function (err, data) {
                    that.buildingFile = cheerio.load(data);
                    clb(err);
                })
            },
            function readSomeFile(clb) {
                fs.readFile('./test/resources/some.html', 'utf8', function (err, data) {
                    that.someFile = cheerio.load(data);
                    clb(err);
                })
            }

        ],
            function (err) {
                if (err) {
                    console.log(err);
                }
                callback();
            }
        );
    },


    "DocumentType parsing test": function (test) {
        test.equal(parsers.documentType(this.plotFile), DocumentTypeEnum.PLOT, "Plot html has PLOT Document Type");
        test.equal(parsers.documentType(this.buildingFile), DocumentTypeEnum.BUILDING, "Building html has BUILDING Document Type");
        test.equal(parsers.documentType(this.listFile), DocumentTypeEnum.LIST, "Plot html has LIST Document Type");
        test.equal(parsers.documentType(this.someFile), DocumentTypeEnum.UNKNOWN, "Arbitrary html has UNKNOWN Document Type");
        test.done();
    },
    "Plot HTML parsing test": function (test) {
        var parsedPlot = parsers.plotParse(this.plotFile);
        test.deepEqual(parsedPlot, {
            "allPlotInformation": {
                "Parcelní číslo:": "374/114",
                "Obec:": "Světice [538841]",
                "Katastrální území:": "Světice u Říčan [760391]",
                "Číslo LV:": "550",
                "Výměra [m2]:": "1057",
                "Typ parcely:": "Parcela katastru nemovitostí", "Mapový list:": "KMD",
                "Určení výměry:": "Jiným číselným způsobem",
                "Druh pozemku:": "zahrada"},
            "plotNumber": "374/114",
            "neighbourPlots": "ZobrazObjekt.aspx?encrypted=DeJ-yIXn6pGkbcO8CEWkINh41tTjSNmmt20iUBG8ozDRJVF8RLjQ9ln4a7Bc1RLCx0D7W0Awy3Dw0avqD8mt0JfZGzCUPUUNdBvo3TE2C_jzAEla76joJurBIiDvaJQuHV3c4yPm6-4=",
            "villageName": "Světice",
            "villageCode": 538841,
            "plotSize": 1057,
            "plotType": "Parcela katastru nemovitostí",
            "landType": "zahrada",
            "owners": [
                {"name": "SEPA CREDIT s.r.o.", "address": "Náchodská 762/65, Horní Počernice, 19800 Praha 20", "share": ""}
            ],
            "protection": ["zemědělský půdní fond"], "ownershipRestrictions": [], "otherRecords": []

        }, "Parsed plot is not correct.");
        test.done();
    },
    "Building HTML parsing test": function (test) {
        var parsedBuilding = parsers.buildingParse(this.buildingFile);
        test.deepEqual(parsedBuilding, {
            "allBuildingInformation": {
                "Stavba:": "č.p. 237",
                "Obec:": "Světice [538841]",
                "Část obce:": "Světice [160393]",
                "Katastrální území:": "Světice u Říčan [760391]",
                "Číslo LV:": "550",
                "Na parcele:": "st. 618",
                "Typ stavby:": "budova s číslem popisným",
                "Způsob využití:": "objekt k bydlení"},
            "buildingNumber": "č.p. 237",
            "villageName": "Světice",
            "villageCode": 538841,
            "buildingType": "budova s číslem popisným",
            "useKind": "objekt k bydlení",
            "owners": [
                {"name": "SEPA CREDIT s.r.o.", "address": "Náchodská 762/65, Horní Počernice, 19800 Praha 20", "share": ""}
            ],
            "protection": [],
            "ownershipRestrictions": [],
            "otherRecords": []}, "incorrectly parsed building");
        test.done();
    },
    "List HTML parsing test": function (test) {
        var neighbourObjects = parsers.listParse(this.listFile);
        test.deepEqual(neighbourObjects, [
            {"village": "Světice u Říčan", "type": 2, "url": "ZobrazObjekt.aspx?&typ=parcela&id=3126988209"},
            {"village": "Světice u Říčan", "type": 1, "url": "ZobrazObjekt.aspx?&typ=parcela&id=3127283209"},
            {"village": "Světice u Říčan", "type": 1, "url": "ZobrazObjekt.aspx?&typ=parcela&id=3127290209"},
            {"village": "Světice u Říčan", "type": 1, "url": "ZobrazObjekt.aspx?&typ=parcela&id=3127292209"},
            {"village": "Světice u Říčan", "type": 1, "url": "ZobrazObjekt.aspx?&typ=parcela&id=3127294209"},
            {"village": "Světice u Říčan", "type": 1, "url": "ZobrazObjekt.aspx?&typ=parcela&id=3127717209"}
        ], "list page not correctly parsed");
        test.done();
    }


};