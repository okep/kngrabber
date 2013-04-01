
var DocumentTypeEnum = Object.freeze({
    UNKNOWN: 0,
    PLOT: 1,
    BUILDING: 2
});

/**
 * Returns document type
 * @param $ cheerio html representation
 * @return DocumentTypeEnum
 */
var documentType = function documentType($) {
    throw "todo implement";
};

/**
 * Parses plot, returned structure is model/Plot.js
 * @param $ cheerio html representation
 * @return model/Plot.js instance object
 */
var plotParse = function plotParse($) {
    throw "todo implement";
};

/**
 * Parses building, returned structure is model/Building.js
 * @param $ cheerio html representation
 * @return model/Building.js instance object
 */
var buildingParse = function buildingParse($) {
    throw "todo implement";

};


module.exports = {
    "documentType": documentType,
    "plotParse": plotParse,
    "buildingParse": buildingParse,
    "DocumentTypeEnum": DocumentTypeEnum
};