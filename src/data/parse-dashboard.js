var _ = require('lodash');
var moment = require('moment');
require('moment-range');
var projectFile = require('./common').projectFile;

var START_DATE = moment().subtract(6, 'months').startOf('day');

var MAP_WIDTH = 650, MAP_HEIGHT = 500;
var project = projectFile('data-out/dashboard-geo.json', MAP_WIDTH, MAP_HEIGHT);

function processLocations(country, locations) {
    return locations.map(function (loc) {
        return {
            'name': loc.name,
            'country': country,
            'coord': project(loc.lat, loc.lng)
        };
    });
}

function processAirstrikes(locations, input) {
    var rows = _.sortBy(input, 'date').filter(function (row) { return START_DATE.isBefore(row.date) });

    var start = rows[0].date, end = _.last(rows).date;

    var strikesByDate = _(rows)
        .groupBy('date')
        .mapValues(function (dateRows) {
            return _(dateRows)
                .groupBy(function (row) {
                    return locations[row.place] && locations[row.place].country;
                })
                .mapValues(function (countryRows) { return _.sum(countryRows, 'strikes')})
                .value();
        }).value();

    var counts = [];
    var labels = [];
    moment.range(start, end).by('day', function (date) {
        if (date.date() === 1) {
            labels.push({'month': date.format('MMM'), 'pos': counts.length});
        }
        counts.push(strikesByDate[date.format('YYYY-MM-DD')] || {'syria': 0, 'iraq': 0})
    });

    var locations = _(rows)
        .groupBy('place')
        .filter(function (_, placeName) {
            var geo = locations[placeName];
            if (!geo) console.warn('Unknown location ' + placeName + ', ignoring...');
            return geo;
        })
        .map(function (placeRows, placeName) {
            var strikes = _(placeRows)
                .groupBy('date')
                .map(function (placeDateRows, date) {
                    var count = _.sum(placeDateRows.map(function (r) { return parseInt(r.strikes) }));
                    return {'count': count, 'date': date};
                })
                .value();
            return {'geo': locations[placeName], 'strikes': strikes};
        })
        .value();

    return {
        'meta': {'start': start, 'end': end, 'days': moment.range(start, end).diff('days') + 1},
        'timeline': {'counts': counts, 'labels': labels},
        'locations': locations
    };
}

function processDashboardLocations(locations) {
    return locations.map(function (row) {
        var coord = project(row['lat'], row['lng']);
        var left = coord[0] / MAP_WIDTH * 100;
        return {
            'name': row['name'],
            'coord': [row['anchor'] === 'right' ? 100 - left : left, coord[1] / MAP_HEIGHT * 100],
            'style': row['style'],
            'anchor': row['anchor'] || 'left'
        };
    });
}

function process(data) {
    console.error('Start date is', START_DATE.format());

    var iraqLocations = processLocations('iraq', data.sheets.iraq);
    var syriaLocations = processLocations('syria', data.sheets.syria);
    var locations = _.indexBy(iraqLocations.concat(syriaLocations), 'name');

    var airstrikes = processAirstrikes(locations, data.sheets.airstrikes);
    var map = processDashboardLocations(data.sheets.map);

    return {
        'updated': moment().format('dddd D MMMM YYYY'),
        'airstrikes': airstrikes,
        'map': map
    };
}
