import fs from 'fs';
import path from 'path';
import d3 from 'd3';
import _ from 'lodash'
import moment from 'moment';
import 'moment-range';
import cfg from './config';

var filepath = file => path.join(__dirname, '../..', file);

const START_DATE = moment().subtract(cfg.common.WINDOW, 'months');

var project = (function () {
    var geo = require(filepath('data-out/dashboard-geo.json'));

    var projection = d3.geo.mercator().scale(1).translate([0, 0]);
    var path = d3.geo.path().projection(projection);

    var b = path.bounds(geo),
        s = 1 / Math.max((b[1][0] - b[0][0]) / cfg.dashboard.width, (b[1][1] - b[0][1]) / cfg.dashboard.height),
        t = [(cfg.dashboard.width - s * (b[1][0] + b[0][0])) / 2, (cfg.dashboard.height - s * (b[1][1] + b[0][1])) / 2];

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

    var strikesByDate = _(rows)
        .groupBy('date')
        .mapValues(dateRows => {
            return _(dateRows)
                .groupBy(row => {
                    return locations[row.place] && locations[row.place].country;
                })
                .mapValues(countryRows => _.sum(countryRows, 'strikes')).value();
        }).value();

    var counts = [];
    var labels = [];
    moment.range(start, end).by('day', date => {
        if (date.date() === 1) {
            labels.push({'month': date.format('MMM'), 'pos': counts.length});
        }
        counts.push(strikesByDate[date.format('YYYY-MM-DD')] || {'syria': 0, 'iraq': 0})
    });

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
        'timeline': {counts, labels},
        locations
    };
    fs.writeFileSync(filepath(outfn), JSON.stringify(out));
}

function processDashboardLocations(fn, outfn) {
    var input = fs.readFileSync(filepath(fn)).toString();

    var locations = parseTSV(input).map(row => {
        var coord = project(row['lat'], row['lng']);
        var left = coord[0] / cfg.dashboard.width * 100;
        return {
            'name': row['name'],
            'coord': [row['anchor'] === 'right' ? 100 - left : left, coord[1] / cfg.dashboard.height * 100],
            'style': row['style'],
            'anchor': row['anchor'] || 'left'
        };
    });

    fs.writeFileSync(filepath(outfn), JSON.stringify(locations));
}

var iraqLocations = processLocations('iraq', 'data-in/iraq-locations.tsv');
var syriaLocations = processLocations('syria', 'data-in/syria-locations.tsv');
var locations = {};
iraqLocations.concat(syriaLocations).forEach(loc => locations[loc['name']] = loc);

processAirstrikes(locations, 'data-in/dashboard-airstrikes.tsv', 'data-out/dashboard-airstrikes.json');
processDashboardLocations('data-in/dashboard-locations.tsv', 'data-out/dashboard-locations.json');
