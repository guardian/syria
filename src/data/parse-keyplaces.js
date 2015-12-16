import fs from 'fs';
import _ from 'lodash';
import moment from 'moment';
import 'moment-range';
import {filepath, parseTSV, projectFn, cfg} from './config';

const START_DATE = moment.utc().subtract(cfg.dashboard.WINDOW);
const R = 6371000; // metres
const MAX_D = 40000 // metres

var project = projectFn('data-out/historical-geo.json', cfg.past.WIDTH, cfg.past.HEIGHT);

function radians(deg) {
    return deg * Math.PI / 180;
}

function distance(latlng1, latlng2) {
    var φ1 = radians(latlng1.lat);
    var φ2 = radians(latlng2.lat);
    var Δφ = radians(latlng2.lat - latlng1.lat);
    var Δλ = radians(latlng2.lng - latlng1.lng);

    var a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
}

function processAreas(fn) {
    var areas = require(filepath(fn));

    return _(areas)
        .forEach(area => {
            var [lat, lng] = area.geo.split(' ').map(n => parseFloat(n));
            area.moment = moment.utc(area.date, 'MMMM D, YYYY')
            area.lat = lat;
            area.lng = lng;
            area.controller = area.controller.toLowerCase().replace(/ /g, '-');
        })
        .value();
}

function processLocations(country, fn) {
    var input = fs.readFileSync(filepath(fn)).toString();
    var locationLookup = {};
    parseTSV(input).forEach(row => {
        var coord = project(row['lat'], row['lng']);
        var left = coord[0] / cfg.past.WIDTH * 100;
        locationLookup[row['name']] = {
            'name': row['name'],
            'coord': [row['anchor'] === 'right' ? 100 - left : left, coord[1] / cfg.past.HEIGHT * 100],
            'lat': parseFloat(row['lat']),
            'lng': parseFloat(row['lng'])
        };
    });
    return locationLookup;
}

function processAirstrikes(areas, locationLookup, fn, outfn) {
    var input = fs.readFileSync(filepath(fn)).toString();

    var keyPlaces = _(parseTSV(input))
        .filter(row => START_DATE.isBefore(row.date))
        .filter(row => !!locationLookup[row.place]) // Syria only
        .groupBy('place')
        .map((placeRows, place) => {
            var ordered = _.sortBy(placeRows, 'date')
            var start = ordered[0].date, end = ordered[ordered.length - 1].date;
            var count = _.sum(placeRows, 'strikes');
            var span = moment.range(start, end).diff('days') + 1;
            return {place, placeRows, start, end, span, count, 'freq': count / span};
        })
        .sortByAll(['span', 'freq'])
        .reverse()
        .slice(0, 5)
        .value();

    var minStart = _.sortBy(keyPlaces, 'start')[0].start;
    var maxEnd = _.sortBy(keyPlaces, 'end').reverse()[0].end;
    var labels = [], daysI = 0;
    var period = moment.range(minStart, maxEnd);
    period.by('days', date => {
        if (date.date() === 1) {
            labels.push({'month': date.format('MMM'), 'pos': daysI});
        }
        daysI++;
    });

    var locations = keyPlaces.map(row => {
        var loc = locationLookup[row.place];

        var nearbyAreas = _(areas)
            .filter(area => distance(loc, area) < MAX_D)
            .sortBy('moment')
            .groupBy('geo')
            .value();

        var countsByDate = _(row.placeRows)
            .groupBy('date')
            .mapValues(dateRows => _.sum(dateRows, 'strikes'))
            .value();

        var counts = [];
        var controls = [];
        var lastControllers = {};
        period.by('day', date => {
            var count = countsByDate[date.format('YYYY-MM-DD')] || 0;

            var controllers = _(nearbyAreas)
                .mapValues(geoEvents => _.findLast(geoEvents, evt => date >= evt.moment))
                .groupBy('controller')
                .mapValues(controllerAreas => controllerAreas.length)
                .map((count, controller) => { return {'name': controller, count}; })
                .value();

            if (!_.isEqual(lastControllers, controllers)) {
                controls.push({'pos': counts.length, 'controllers': controllers});
                lastControllers = controllers;
            }

            counts.push(count);
        });

        var meta = _.pick(loc, ['name', 'coord']);
        meta.areaCount = _.keys(nearbyAreas).length;

        return {meta, counts, controls};
    });

    fs.writeFileSync(filepath(outfn), JSON.stringify({labels, locations}));
}

var areas = processAreas('data-out/areas.json');
var locationLookup = processLocations('syria', 'data-in/syria-locations.tsv');

processAirstrikes(areas, locationLookup, 'data-in/dashboard-airstrikes.tsv', 'data-out/key-places.json');
