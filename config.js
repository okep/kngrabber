/**
 * Created with JetBrains WebStorm.
 * User: Okep
 * Date: 3/27/13
 * Time: 5:42 PM
 * To change this template use File | Settings | File Templates.
 */


var confing = {

    // Connection string to MongoDB where data are/will be stored
    "dbConnectionString": "mongodb://localhost/kngrabber",

    // number of parallel connections
    "connections": 1,

    // time period between mining executions in milliseconds
    "miningPeriod": 24*3600*1000,


    /*
     List of default seeds, seed is plot were the search starts,
     name must be unique
     */
    "defaultSeeds": [
        {
            "name": "Strancice",
            "url": "http://nahlizenidokn.cuzk.cz/MapaIdentifikace.aspx?&x=-726618&y=-1061203&maplayers=8244EA23",
            "villageCode": 538809
        }
    ]
};

module.exports = confing;