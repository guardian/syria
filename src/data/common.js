var path = require('path');
var moment = require('moment');
var d3 = require('d3');

function filepath(file) { return path.join(__dirname, '../..', file); }

function projectGeo(geo, width, height) {
    var projection = d3.geo.mercator().scale(1).translate([0, 0]);
    var path = d3.geo.path().projection(projection);

    var b = path.bounds(geo),
        s = 1 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height),
        t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];

    projection.scale(s).translate(t);
    return projection;
}

module.exports = {
    'filepath': filepath,
    'projectGeo': projectGeo,
    'projectFile': function (geoFile, width, height) {
        var geo = require(filepath(geoFile));
        var projection = projectGeo(geo, width, height);

        return function (lat, lng) {
            return projection([lng, lat].map(function (l) { return parseFloat(l); }));
        };
    },
    'dims': {
        'past': {
            'WIDTH': 300, 'HEIGHT': 260
        }
    }
};
