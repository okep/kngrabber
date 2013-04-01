var fs = require('fs'),
    async = require('async');

module.exports = {
    'setUp': function setUp(callback) {
        var that = this;
        async.waterfall([
            function readPlotFile(clb) {
                fs.readFile('./test/resources/plot.html', 'utf8', function(err, data){
                    that.plotFile = data;
                    clb(err);
                })
            },
            function readListFile(clb) {
                fs.readFile('./test/resources/list.html', 'utf8', function(err, data){
                    that.listFile = data;
                    clb(err);
                })
            },
            function readBuildingFile(clb) {
                fs.readFile('./test/resources/building.html', 'utf8', function(err, data){
                    that.buildingFile = data;
                    clb(err);
                })
            }
        ],
            function(err) {
                if(err) {
                    console.log(err);
                }
                callback();
            }
        );
    },


    'Plot DocumentType parsing test': function (test) {
        test.done();
    }
};