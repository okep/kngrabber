var mng = require('../mng');

var plotSchema = new mng.Schema({
    plotNumber: String
});

plotSchema.index('plotNumber', 1);

var PlotModel = mng.model('plot', plotSchema);

module.exports = PlotModel;