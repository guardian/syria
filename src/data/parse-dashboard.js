import fs from 'fs';
import _ from 'lodash'
import moment from 'moment';
import 'moment-range';
import {filepath, projectFn, parseTSV, cfg} from './config';

const START_DATE = moment().subtract(cfg.dashboard.WINDOW);

var project = projectFn('data-out/dashboard-geo.json', cfg.dashboard.WIDTH, cfg.dashboard.HEIGHT);

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
