var Job = require('./model/Job'),
    Seed = require('./model/Seed'),
    log = require('./logger'),
    async = require('async'),
    request = require('request'),
    cheerio = require('cheerio'),
    parsers = require('./parsers'),
    DocumentTypeEnum = parsers.DocumentTypeEnum;

/**
 *
 * @param parallelConnections specifies number of parallel connections
 * @param period in milliseconds, period between executions
 * @constructor
 */
function Crawler(parallelConnections) {
    this.connections = parallelConnections;
}

/**
 * Performs one crawling round
 */
Crawler.prototype.start = function start() {
    var that = this;

    this.isSomeWork(function (err, someWork) {
        if(err) {
            log.error(err);
            return;
        }

        if (someWork) {
            log.debug('There is some work left.');
            that._crawl();
        } else {
            log.debug('No work left, initializing from seeds.');
            // initialize from seeds
            async.waterfall([
                function findAllSeeds(callback) {
                    Seed.find(function (err, seeds) {
                        callback(err, seeds);
                    });
                },
                function goThroughSeeds(seeds, callback) {
                    seeds.forEach(function (seed) {
                        callback(null, seed);
                    });
                },
                function createAndSaveJob(seed, callback) {
                    var job = new Job({
                        url: seed.url,
                        baseUrl: seed.baseUrl,
                        timestamp: new Date(),
                        villageCode: seed.villageCode
                    });
                    job.save(function (err) {
                        callback(err);
                    })
                }
            ], function (err) {
                if (err) {
                    log.error(err);
                }
                that._crawl();
            });
        }
    });
};

Crawler.prototype.isSomeWork = function isSomeWork(callback) {
    Job.count(function (err, count) {
        callback(err, count > 0)
    });
};

Crawler.prototype._crawl = function _crawl() {
    log.debug('Starting to crawl.');

    async.waterfall([
        function findJob(callback) {
            Job.findOne(function(err, job){
                callback(err, job);
            })
        },
        function getTheUrl(job, callback) {
            log.debug('GET: ', job.url);
            request(job.baseUrl + job.url, function(err, response, body){
                if(err) {
                    callback(err);
                } else {
                    var  $ = cheerio.load(body);
                    callback(null, $)
                }
            });
        },
        function parsePage($, callback) {
            var type = parsers.documentType($);

            var obj = parser.parse($);
            throw "todo implement";
        }
    ], function(err, result){
        if(err) {
            log.error(err);
        }
    });

};

module.exports = Crawler;
