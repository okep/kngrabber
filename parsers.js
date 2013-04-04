var $ = require('cheerio');

var DocumentTypeEnum = Object.freeze({
    UNKNOWN: 0,
    PLOT: 1,
    BUILDING: 2,
    LIST: 3
});

var nameCodeSplitter = /[\[\]]+/;

/**
 * Returns document type
 * @param $page cheerio html representation
 * @return DocumentTypeEnum
 */
var documentType = function documentType($page) {
    try {
        var headerText = $page('#content').children("h1").first().text();
        switch (headerText) {
            case "Informace o parcele":
                return DocumentTypeEnum.PLOT;
            case "Informace o stavbě":
                return DocumentTypeEnum.BUILDING;
            case "Informace o parcele - sousední parcely":
                return DocumentTypeEnum.LIST;
            default:
                return DocumentTypeEnum.UNKNOWN;
        }
    } catch (e) {
        return DocumentTypeEnum.UNKNOWN;
    }
};

/**
 * Parses plot, returned structure is model/Plot.js
 * @param $page cheerio html representation
 * @return model/Plot.js instance object
 */
var plotParse = function plotParse($page) {
    var ret = {};
    var $content = $page('#content');
    var mainTable = parseMainTable($content.children('table.atributyParcela').first());
    ret.allPlotInformation = mainTable;
    ret.plotNumber = mainTable['Parcelní číslo:'];
    var village = mainTable['Obec:'].split(nameCodeSplitter, 2);
    ret.villageName = village[0].trim();
    ret.villageCode = parseInt(village[1]);
    ret.plotSize = parseInt(mainTable['Výměra [m2]:']);
    ret.plotType = mainTable['Typ parcely:'];
    ret.landType = mainTable['Druh pozemku:'];
    ret.owners = parseOwnersTable($content.children('table[summary="Vlastníci, jiní oprávnění"]'));

    ret.protection = singleColumnTable($content.children('table[summary="Způsob ochrany nemovitosti"]'));
    ret.ownershipRestrictions = singleColumnTable($content.children('table[summary="Omezení vlastnického práva"]'));
    ret.otherRecords = singleColumnTable($content.children('table[summary="Jiné zápisy"]'));

    // neighbour plots
    ret.neighbourPlots = $content.find('a[title="Sousední parcely"]').first().attr('href');

    return ret;
};

/**
 * Parses building, returned structure is model/Building.js
 * @param $page cheerio html representation
 * @return model/Building.js instance object
 */
var buildingParse = function buildingParse($page) {
    var ret = {};
    var $content = $page('#content');
    var mainTable = parseMainTable($content.children('table.atributy').first());
    ret.allBuildingInformation = mainTable;
    ret.buildingNumber = mainTable['Stavba:'];
    var village = mainTable['Obec:'].split(nameCodeSplitter, 2);
    ret.villageName = village[0].trim();
    ret.villageCode = parseInt(village[1]);
    ret.buildingType = mainTable['Typ stavby:'];
    ret.useKind = mainTable['Způsob využití:'];

    ret.owners = parseOwnersTable($content.children('table[summary="Vlastníci, jiní oprávnění"]'));
    ret.protection = singleColumnTable($content.children('table[summary="Způsob ochrany nemovitosti"]'));
    ret.ownershipRestrictions = singleColumnTable($content.children('table[summary="Omezení vlastnického práva"]'));
    ret.otherRecords = singleColumnTable($content.children('table[summary="Jiné zápisy"]'));

    return ret;
};

var listParse = function listParse($page) {
    var ret = [];
    var $content = $page('#content');

    var neighPlots = $content.find('table[summary="Sousední parcely"]').first();

    var trs = neighPlots.children("tbody").first().children('tr').filter(function(){
        var cls = $(this).attr('class');
        return !cls || (cls.indexOf("vlastnici-colapse") == -1);
    });

    trs.each(function() {
        var tds = $(this).children('td');
        var firstTd = tds.first();
        var secondA = firstTd.next().children('a').first();
        var type = DocumentTypeEnum.PLOT;
        if(secondA.text().indexOf("st.") == 0) {
            type = DocumentTypeEnum.BUILDING;
        }

        ret.push({
            "village": firstTd.text(),
            "type": type,
            "url": secondA.attr("href")
        });
    });
    return ret;
};

module.exports = {
    "documentType": documentType,
    "plotParse": plotParse,
    "buildingParse": buildingParse,
    "listParse": listParse,
    "DocumentTypeEnum": DocumentTypeEnum
};

var parseMainTable = function parseMainTable($table) {
    var ret = {};
    $table.children('tr').each(function() {
        var tds = $(this).children('td');
        ret[tds.first().text()] = tds.first().next().text();
    });
    return ret;
};

var parseOwnersTable = function parseOwnersTable($table) {
    var ret = [];
    $table.children('tbody').first().children('tr').each(function() {
        var tds = $(this).children('td');
        if(tds.length > 0) {
            ret.push({
                name: tds.first().text(),
                address: tds.first().next().text(),
                share: tds.first().next().next().text()
            });
        }
    });
    return ret;
};

var singleColumnTable = function singleColumnTable($table) {
    var ret = [];
    $table.children('tbody').first().children('tr').each(function() {
        var tds = $(this).children('td');
        if(tds.length > 0) {
            ret.push(tds.first().text());
        }
    });
    return ret;
};
