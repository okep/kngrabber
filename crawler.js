var Job = require('./model/Job'),
    Seed = require('./model/Seed'),
    Plot = require('./model/Plot'),
    log = require('./logger'),
    async = require('async'),
    request = require('request'),
    cheerio = require('cheerio'),
    parsers = require('./parsers'),
    _ = require('underscore'),
    utils = require('./utils');
DocumentTypeEnum = parsers.DocumentTypeEnum;

/**
 *
 * @param parallelConnections specifies number of parallel connections
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

    this._giveMeJob(function (err, job) {
        if (err) {
            log.error(err);
            return;
        }

        if (!_.isEmpty(job)) {
            log.debug('There is some work left.');
            that._crawl(job);
        } else {
            log.debug('No work left, initializing from seeds.');
            // initialize from seeds
            async.waterfall([
                function clearAllJobs(callback) {
                    Job.remove(function (err) {
                        callback(err);
                    });
                },
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
                    job.save(function (err, job) {
                        callback(err, job);
                    })
                }
            ], function (err, job) {
                if (err) {
                    log.error(err);
                } else {
                    that._crawl(job);
                }
            });
        }
    });
};

Crawler.prototype._giveMeJob = function isSomeWork(callback, count) {
    if(count) {
        var query = Job.find({visited: false}).limit(count);
        query.exec(function(err, jobs) {
            callback(err, jobs);
        });
    }
    Job.findOne({visited: false}, function (err, job) {
        callback(err, job);
    });
};

Crawler.prototype._crawl = function _crawl(firstJob) {
    log.debug('Starting to crawl.');
    var that = this;

    var q = async.queue(function(jobToProcess, queueCallback){
        async.waterfall([
            function visitTheJob(callback) {
                var jobObject = jobToProcess.toObject();

                // mark job as visited
                jobToProcess.update({visited: true}, function (err) {
                    callback(err, jobObject);
                });

            },
            function getTheUrl(job, callback) {
                log.debug('GET: ', job.url);
                request(job.baseUrl + job.url, function (err, response, body) {
                    if (err) {
                        callback(err);
                    } else {
                        var $ = cheerio.load(body);
                        callback(null, $, job)
                    }
                });
            },
            function parsePage($, job, callback) {
                var type = parsers.documentType($);
                if (type == DocumentTypeEnum.PLOT) {
                    that._processPlot($, job, callback);
                } else if (type == DocumentTypeEnum.BUILDING) {
                    that._processBuilding($, callback);
                } else {
                    callback("Unknown document type: " + job.url);
                }
            }
        ], function result(err, result) {
            if (err) {
                log.error(err);
            }
            queueCallback(err);
        });

    }, that.connections);
    q.drain = function() {
        that._giveMeJob(function(err, jobs) {
            if(err) {
                log.error(err);
            } else {
                q.push(jobs);
            }
        }, that.connections*3);
    };
    q.push(firstJob);

};

/**
 * Parses plot page, store the information to DB, and proess links going from this page.
 * @param $
 * @param job
 * @private
 * @param callback
 */
Crawler.prototype._processPlot = function _processPlot($, job, callback) {
    var that = this;

    var plotObject = parsers.plotParse($);
    if (plotObject.villageCode == job.villageCode) {

        var links = plotObject.neighbourPlots;
        delete  plotObject.neighbourPlots;

        // get the plot from db
        Plot.where('data.plotNumber', plotObject.plotNumber)
            .where('data.villageCode', plotObject.villageCode)
            .sort('-version')
            .limit(1)
            .exec(function (err, plot) {
                if (err) {
                    callback(err);
                }
                if (!_.isEmpty(plot)) {
                    if (!utils.isEqual(plot[0].toObject().data, plotObject)) {
                        // create new plot
                        (new Plot({
                            data: plotObject,
                            timestamp: new Date(),
                            version: plot[0].version + 1
                        })).save(function (err) {
                                if (err) {
                                    callback(err)
                                }
                            });
                    }
                } else {
                    (new Plot({
                        data: plotObject,
                        timestamp: new Date(),
                        version: 0
                    })).save(function (err) {
                            if (err) {
                                callback(err)
                            }
                        });
                }
            });

        // download links
        that._downloadLinks(links, job, callback);
    }
};

/**
 * Parses building page.
 * @param $
 * @private
 * @param callback
 */
Crawler.prototype._processBuilding = function _processBuilding($, callback) {
    throw "todo";
};

/**
 * Downloads a links page and creates new jobs.
 *
 * @param linksPageUrl
 * @param job
 * @private
 * @param callback
 */
Crawler.prototype._downloadLinks = function _downloadLinks(linksPageUrl, job, callback) {
    async.waterfall([
        function downloadLinksPage(callback) {
            log.debug("GET links: " + linksPageUrl);
            request(job.baseUrl + linksPageUrl, function (err, response, body) {
                if (err) {
                    callback(err);
                } else {
                    var $ = cheerio.load(body);
                    callback(null, $)
                }
            });
        },
        function parseLinksPage($, callback) {
            var links = parsers.listParse($);
            count = links.length;
            if (!_.isEmpty(links)) {
                links.forEach(function (link) {
                    var newJob = new Job({
                        url: link.url,
                        baseUrl: job.baseUrl,
                        timestamp: new Date(),
                        villageCode: job.villageCode,
                        visited: false
                    }).save(function (err) {
                            // ignore error
                            if(--count == 0) {
                                callback();
                            }
                        })
                });
            }
        }
    ],
        function results(err) {
            callback(err);

        });
};

module.exports = Crawler;
