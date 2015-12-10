var fs = require('fs');
var path = require('path');
var d3 = require('d3');
var _ = require('lodash');
var moment = require('moment');
require('moment-range');

var filepath = file => path.join(__dirname, '../..', file);

// MUST BE IN SYNC WITH render-dashboard.js
const MAP_WIDTH = 650, MAP_HEIGHT = 500;

const START_DATE = moment().subtract(6, 'months');

var project = (function () {
    var geo = require(filepath('data-out/dashboard-geo.json'));

    var projection = d3.geo.mercator().scale(1).translate([0, 0]);
    var path = d3.geo.path().projection(projection);

    var b = path.bounds(geo),
        s = 1 / Math.max((b[1][0] - b[0][0]) / MAP_WIDTH, (b[1][1] - b[0][1]) / MAP_HEIGHT),
        t = [(MAP_WIDTH - s * (b[1][0] + b[0][0])) / 2, (MAP_HEIGHT - s * (b[1][1] + b[0][1])) / 2];

    projection.scale(s).translate(t);

    return (lat, lng) => projection([lng, lat].map(l => parseFloat(l)));
})();

function parseTSV(s) {
    var rows = s.replace(/\n+$/, '').split('\n');
    var headers = rows[0].split('\t');
    return rows.slice(1).map(row => {
        var ret = {};
        row.split('\t').forEach((cell, i) => ret[headers[i]] = cell.trim());
        return ret;
    });
}

function processLocations(country, fn) {
    var input = fs.readFileSync(filepath(fn)).toString();

    var out = parseTSV(input);
    out.forEach(row => {
        row['country'] = country;
        row['coord'] = project(row['lat'], row['lng']);
        delete row['lat'];
        delete row['lng'];
    });
    return out;
}

function processAirstrikes(locations, fn, outfn) {
    var input = fs.readFileSync(filepath(fn)).toString();
    var rows = _.sortBy(parseTSV(input), 'date').filter(row => START_DATE.isBefore(row.date));

    var start = rows[0].date, end = rows[rows.length - 1].date

    var strikesByDate = _(rows).groupBy('date').mapValues(dateRows => _.sum(dateRows, 'strikes')).value();
    var counts = [];
    moment.range(start, end).by('day', date => counts.push(strikesByDate[date.format('YYYY-MM-DD')] || 0));

    var locations = _(rows)
        .groupBy('place')
        .map((placeRows, placeName) => {
            var geo = locations[placeName];
            if (!geo) {
                console.warn(`Unknown location ${placeName}, ignoring...`);
                return undefined;
            }
            var strikes = placeRows.map(row => {
                return {'count': parseInt(row.strikes), 'date': row.date};
            });
            return {geo, strikes};
        })
        .filter(r => r)
        .value();

    var out = {
        'meta': {start, end, 'days': moment.range(start, end).diff('days') + 1},
        locations, counts
    };
    fs.writeFileSync(filepath(outfn), JSON.stringify(out));
}

function processCities(fn, outfn) {
    var input = fs.readFileSync(filepath(fn)).toString();

    var cities = parseTSV(input).map(row => {
        var coord = project(row['lat'], row['lng']);
        return {'name': row['name'], 'coord': [coord[0] / MAP_WIDTH * 100, coord[1] / MAP_HEIGHT * 100]};
    });

    fs.writeFileSync(filepath(outfn), JSON.stringify(cities));
}

var iraqLocations = processLocations('iraq', 'data-in/iraq-locations.tsv');
var syriaLocations = processLocations('syria', 'data-in/syria-locations.tsv');
var locations = {};
iraqLocations.concat(syriaLocations).forEach(loc => locations[loc['name']] = loc);

processAirstrikes(locations, 'data-in/dashboard-airstrikes.tsv', 'data-out/dashboard-airstrikes.json');

processCities('data-in/dashboard-cities.tsv', 'data-out/dashboard-cities.json');
