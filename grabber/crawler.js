var Job = require('./../model/Job'),
    Seed = require('./../model/Seed'),
    Plot = require('./../model/Plot'),
    log = require('./../thirdparty/logger'),
    async = require('async'),
    request = require('request'),
    cheerio = require('cheerio'),
    parsers = require('./parsers'),
    _ = require('underscore'),
    utils = require('./../common/utils'),
    config = require('./../common/config');
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
        var jobsCount = 0;
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
                    log.debug('Clearing all jobs');
                    Job.remove(function (err) {
                        log.debug('All jobs cleared');
                        callback(err);
                    });
                },
                function findAllSeeds(callback) {
                    log.debug('Finding all seeds');
                    Seed.find(function (err, seeds) {
                        log.debug('Seeds found');
                        callback(err, seeds);
                    });
                },
                function goThroughSeeds(seeds, callback) {
                    log.debug('Iterating thorough seeds');
                    jobsCount = seeds.length;
                    seeds.forEach(function (seed) {
                        callback(null, seed);
                    });
                },
                function createAndSaveJob(seed, callback) {
                    log.debug('Creating new job');
                    var job = new Job({
                        url: seed.url,
                        baseUrl: seed.baseUrl,
                        timestamp: new Date(),
                        villageCode: seed.villageCode
                    });
                    job.save(function (err, job) {
                        log.debug('Job Saved');
                        callback(err, job);
                    })
                }
            ], function (err, job) {
                if (err) {
                    log.error(err);
                } else {
                    if (--jobsCount == 0) {
                        that._crawl(job);
                    }
                }
            });
        }
    });
};

Crawler.prototype._giveMeJob = function isSomeWork(callback, count) {
    log.debug('_giveMeJob ' + JSON.stringify(arguments));
    if (count) {
        var query = Job.find({visited: false}).limit(count);
        query.exec(function (err, jobs) {
            log.debug('Jobs found: ' + jobs.length);
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

    var q = async.queue(function (jobToProcess, queueCallback) {
        log.debug('Processing job ' + jobToProcess._id);
        async.waterfall([
            function visitTheJob(callback) {
                log.debug('Mark job visited: ' + jobToProcess._id);
                var jobObject = jobToProcess.toObject();

                // mark job as visited
                jobToProcess.update({visited: true}, function (err) {
                    log.debug('Job marked visited ' + jobToProcess._id);
                    callback(err, jobObject);
                });

            },
            function getTheUrl(job, callback) {
                log.debug('GET: ' + job.url + ", jobId: " + jobToProcess._id);
                request({
                    uri: job.baseUrl + job.url,
                    timeout: config.httpTimeout}, function (err, response, body) {
                    log.debug('GET finished: ' + job.url + ", jobId: " + jobToProcess._id);
                    if (err) {
                        callback(err);
                    } else {
                        var $ = cheerio.load(body);
                        callback(null, $, job)
                    }
                });
            },
            function parsePage($, job, callback) {
                log.debug('Parsing page: ' + jobToProcess._id);
                var type = parsers.documentType($);
                if (type == DocumentTypeEnum.PLOT) {
                    that._processPlot($, job, callback);
                } else if (type == DocumentTypeEnum.BUILDING) {
                    that._processBuilding($, job, callback);
                } else {
                    callback("Unknown document type: " + job.url);
                }
            }
        ], function result(err, result) {
            if (err) {
                log.error(err);
            }
            log.debug("Job finished " + jobToProcess._id);
            queueCallback(err);
        });

    }, that.connections);
    q.drain = function () {
        that._giveMeJob(function (err, jobs) {
            if (err) {
                log.error(err);
            } else {
                if(jobs) {
                    q.push(jobs);
                } else {
                    log.debug('no more available jobs');
                }
            }
        }, that.connections);
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
    log.debug('Processing plot ', job.url);
    var that = this;

    try {
        var plotObject = parsers.plotParse($);
        if (plotObject.villageCode == job.villageCode) {
            log.debug('Is in the same village: ' + job.url);
            var links = plotObject.neighbourPlots;
            var buildingLink = plotObject._buildinkLink;
            delete  plotObject.neighbourPlots;
            delete plotObject._buildinkLink;

            async.waterfall([
                    function findPlotInDb(callback) {
                        log.debug('Find the plot in DB: ' + job.url);
                        // get the plot from db
                        Plot.where('data.plotNumber', plotObject.plotNumber)
                            .where('data.villageCode', plotObject.villageCode)
                            .sort('-version')
                            .limit(1)
                            .exec(function (err, plot) {
                                if (err) {
                                    callback(err);
                                } else {
                                    if (!_.isEmpty(plot)) {
                                        log.debug('Plot found in db: ' + job.url);
                                        if (!utils.isEqual(plot[0].toObject().data, plotObject)) {
                                            // create new plot
                                            log.debug('The new version is different, creating new: ' + job.url);
                                            (new Plot({
                                                data: plotObject,
                                                timestamp: new Date(),
                                                version: plot[0].version + 1
                                            })).save(function (err) {
                                                    log.debug('New version created: ' + job.url);
                                                    callback(err)
                                                });
                                        } else {
                                            callback();
                                        }
                                    } else {
                                        log.debug('Plot doesnt exist, creating new: ' + job.url);
                                        (new Plot({
                                            data: plotObject,
                                            timestamp: new Date(),
                                            version: 0
                                        })).save(function (err) {
                                                log.debug('New plot created: ' + job.url);
                                                callback(err)
                                            });
                                    }
                                }
                            });
                    },
                    function processBuildingLink(callback) {
                        if (buildingLink) {
                            log.debug('Create job with building: ' + job.url);
                            var newJob = new Job({
                                url: buildingLink,
                                baseUrl: job.baseUrl,
                                timestamp: new Date(),
                                villageCode: job.villageCode,
                                visited: false
                            }).save(function (err) {
                                    log.debug("Job for builiding: " + job.url);
                                    // ignore error
                                    callback();
                                })
                        } else {
                            callback();
                        }

                    },
                    function downloadLinks(callback) {
                        // download links
                        that._downloadLinks(links, job, callback);
                    }
                ], function (err, result) {
                    log.debug('End of plot processing: ' + job.url);
                    callback(err);
                }
            );
        }
        else {
            log.debug('Plot in another village ', job.url);
            callback();
        }
    } catch (e) {
        callback(e);
    }
};

/**
 * Parses building page.
 * @param $
 * @private
 * @param callback
 */
Crawler.prototype._processBuilding = function _processBuilding($, job, callback) {
    log.debug('Processing building ', job.url);
    var that = this;

    try {
        var buildingObject = parsers.plotParse($);
        if (buildingObject.villageCode == job.villageCode) {
            log.debug('Is in the same village: ' + job.url);

            log.debug('Find the building in DB: ' + job.url);
            // get the plot from db
            Plot.where('data.buildingNumber', buildingObject.buildingNumber)
                .where('data.villageCode', buildingObject.villageCode)
                .sort('-version')
                .limit(1)
                .exec(function (err, building) {
                    if (err) {
                        callback(err);
                    } else {
                        if (!_.isEmpty(building)) {
                            log.debug('Building found in db: ' + job.url);
                            if (!utils.isEqual(building[0].toObject().data, buildingObject)) {
                                // create new building
                                log.debug('The new version is different, creating new building: ' + job.url);
                                (new Building({
                                    data: buildingObject,
                                    timestamp: new Date(),
                                    version: building[0].version + 1
                                })).save(function (err) {
                                        log.debug('New version created: ' + job.url);
                                        if (err) {
                                            callback(err)
                                        }
                                    });
                            }
                        } else {
                            log.debug('Building doesnt exist, creating new: ' + job.url);
                            (new Building({
                                data: buildingObject,
                                timestamp: new Date(),
                                version: 0
                            })).save(function (err) {
                                    log.debug('New building created: ' + job.url);
                                    if (err) {
                                        callback(err)
                                    }
                                });
                        }
                    }
                });
        }
        else {
            log.debug('Building in another village ', job.url);
            callback();
        }
    } catch (e) {
        callback(e);
    }
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
    log.debug('Download links: ' + linksPageUrl);
    async.waterfall([
        function downloadLinksPage(callback) {
            log.debug("GET links: " + linksPageUrl);
            request({
                uri: job.baseUrl + linksPageUrl,
                timeout: config.httpTimeout}, function (err, response, body) {
                log.debug("GET links finished: " + linksPageUrl);
                if (err) {
                    callback(err);
                } else {
                    var $ = cheerio.load(body);
                    callback(null, $)
                }
            });
        },
        function parseLinksPage($, callback) {
            log.debug("Parsing links: " + linksPageUrl);
            var links = parsers.listParse($);
            count = links.length;
            if (!_.isEmpty(links)) {
                links.forEach(function (link) {
                    log.debug("Creating job for link: " + link.url);
                    var newJob = new Job({
                        url: link.url,
                        baseUrl: job.baseUrl,
                        timestamp: new Date(),
                        villageCode: job.villageCode,
                        visited: false
                    }).save(function (err) {
                            log.debug("Job for link created: " + link.url);
                            // ignore error
                            if (--count == 0) {
                                callback();
                            }
                        })
                });
            }
        }
    ],
        function results(err) {
            log.debug('Download links finished: ' + linksPageUrl);
            callback(err);
        });
};

module.exports = Crawler;
