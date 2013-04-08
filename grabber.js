/**
 * Created with JetBrains WebStorm.
 * User: Okep
 * Date: 3/27/13
 * Time: 5:23 PM
 * To change this template use File | Settings | File Templates.
 */


var log = require('./thirdparty/logger');
var Seed = require('./model/Seed');
var config = require('./common/config');
var Crawler = require('./grabber/crawler');

// initialize seeds from default seeds
config.defaultSeeds.forEach(function (seed) {
    log.debug('Initializing defaultSeeds ', seed);
    var dbSeed = new Seed({
        'name': seed.name,
        'url': seed.url,
        'baseUrl': seed.baseUrl,
        'villageCode': seed.villageCode
    });

    var seedObject = dbSeed.toObject();
    delete seedObject._id;

    Seed.update({name: seed.name}, {$set: seedObject}, {upsert: true}, function (err) {
        if (err) {
            log.debug(err);
        }
    });
});

// Start crawling
var crawler = new Crawler(config.connections);

setInterval(function () {
    crawler.start();
}, config.miningPeriod);

crawler.start();
