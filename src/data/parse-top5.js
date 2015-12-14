import fs from 'fs';
import _ from 'lodash';
import moment from 'moment';
import 'moment-range';
import {filepath, parseTSV, projectFn, cfg} from './config';

const START_DATE = moment().subtract(cfg.dashboard.WINDOW);

var project = projectFn('data-out/historical-geo.json', cfg.past.WIDTH, cfg.past.HEIGHT);

console.log(cfg.dashboard.WINDOW.asDays());

function processLocations(country, fn) {
    var input = fs.readFileSync(filepath(fn)).toString();
    var locations = {};
    parseTSV(input).forEach(row => {
        var coord = project(row['lat'], row['lng']);
        var left = coord[0] / cfg.past.WIDTH * 100;
        locations[row['name']] = {
            'name': row['name'],
            'coord': [row['anchor'] === 'right' ? 100 - left : left, coord[1] / cfg.past.HEIGHT * 100],
            'style': row['style'],
            'anchor': row['anchor'] || 'left'
        };
    });
    return locations;
}

function processAirstrikes(locations, fn, outfn) {
    var input = fs.readFileSync(filepath(fn)).toString();

    var out = _(parseTSV(input))
        .filter(row => START_DATE.isBefore(row.date))
        .filter(row => locations[row.place]) // Syria only
        .groupBy('place')
        .map((placeRows, place) => {
            var ordered = _.sortBy(placeRows, 'date')
            var first = ordered[0].date, last = ordered[ordered.length - 1].date
            var range = moment.range(first, last);
            var total = _.sum(placeRows, 'strikes');
            var span = range.diff('day') + 1;
            var countsByDate = _(placeRows).groupBy('date').mapValues(dateRows => _.sum(dateRows, 'strikes')).value();
            var counts = [];
            range.by('day', date => counts.push(countsByDate[date.format('YYYY-MM-DD')] || 0));
            return {
                'meta': locations[place],
                first, last, span, total,
                'freq': total / span,
                counts
            };
        })
        .sortByAll(['span', 'freq'])
        .reverse()
        .slice(0, 5)
        .value();

    fs.writeFileSync(filepath(outfn), JSON.stringify(out));
}

var syriaLocations = processLocations('syria', 'data-in/syria-locations.tsv');

processAirstrikes(syriaLocations, 'data-in/dashboard-airstrikes.tsv', 'data-out/top5-locations.json');

