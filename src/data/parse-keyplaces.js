import fs from 'fs';
import Canvas from 'canvas';
import d3 from 'd3';
import _ from 'lodash';
import moment from 'moment';
import 'moment-range';
import {filepath, parseTSV, projectFile, writePNG, dims} from './common';

const START_DATE = moment.utc('2015-07-01T00:00:00')
const END_DATE = moment.utc('2015-12-31T23:59:59')

const R = 6371000; // metres
const MAX_D = 40000 // metres

var project = projectFile('data-out/historical-geo.json', dims.past.WIDTH, dims.past.HEIGHT);

function deg2rad(deg) {
    return deg * Math.PI / 180;
}

function rad2deg(rad) {
    return rad / Math.PI * 180;
}

function distance(latlng1, latlng2) {
    var φ1 = deg2rad(latlng1.lat);
    var φ2 = deg2rad(latlng2.lat);
    var Δφ = deg2rad(latlng2.lat - latlng1.lat);
    var Δλ = deg2rad(latlng2.lng - latlng1.lng);

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
        locationLookup[row['name']] = {
            'lat': parseFloat(row['lat']),
            'lng': parseFloat(row['lng']),
            'coord': [100 - coord[0] / dims.past.WIDTH * 100, coord[1] / dims.past.HEIGHT * 100]
        };
    });
    return locationLookup;
}

function getPlaceStats(rows, place) {
    var ordered = _.sortBy(rows, 'date')
    var start = ordered[0].date, end = ordered[ordered.length - 1].date;
    var total = _.sum(rows, 'strikes');
    var span = moment.range(start, end).diff('days') + 1;
    return {'name': place, rows, start, end, span, total, 'freq': total / span};
}

function generateLabels(period) {
    var labels = [], i = 0;
    period.by('day', date => {
        if (date.date() === 1) {
            labels.push({'month': date.format('MMM'), 'pos': i});
        }
        i++;
    });
    return labels;
}

function generateCountsAndControls(countsByDate, nearbyAreas, period) {
    var counts = [];
    var controls = [];
    var lastControllers = {};

    period.by('day', date => {
        var count = countsByDate[date.format('YYYY-MM-DD')] || 0;

        var controllers = _(nearbyAreas)
            .mapValues(areaControllers => _.findLast(areaControllers, c => date >= c.moment))
            .groupBy('controller')
            .mapValues(controllerAreas => controllerAreas.length);

        if (!_.isEqual(lastControllers, controllers)) {
            controls.push({'pos': counts.length, 'controllers': controllers});
            lastControllers = controllers;
        }

        counts.push(count);
    });

    return {counts, controls};
}

function processAirstrikes(areas, locationLookup, fn, outfn) {
    var input = fs.readFileSync(filepath(fn)).toString();

    var keyPlaces = _(parseTSV(input))
        .filter(row => START_DATE.isBefore(row.date))
        .filter(row => !!locationLookup[row.place]) // Syria only
        .groupBy('place')
        .pick(['Ar Raqqah', 'Dayr Az Zawr', 'Kobani', 'Al Hasakah'])
        .map(getPlaceStats)
        /*.sortByAll(['span', 'freq'])
        .reverse()
        .slice(0, 4)*/
        .value();

    var minStart = _.sortBy(keyPlaces, 'start')[0].start;
    var maxEnd = _.sortBy(keyPlaces, 'end').reverse()[0].end;
    var period = moment.range(minStart, maxEnd);

    var locations = keyPlaces.map((place, placeI) => {
        var loc = locationLookup[place.name];

        var nearbyAreas = _(areas)
            .filter(area => distance(loc, area) < MAX_D)
            .sortBy('moment')
            .groupBy('geo')
            .value();

        var countsByDate = _(place.rows)
            .groupBy('date')
            .mapValues(dateRows => _.sum(dateRows, 'strikes'))
            .value();

        var {counts, controls} = generateCountsAndControls(countsByDate, nearbyAreas, period);

        var meta = {
            'id': place.name.replace(/ /g, '-').toLowerCase(),
            'coord': loc.coord,
            'areaCount': _.keys(nearbyAreas).length,
            'total': place.total
        };

        return {meta, counts, controls};
    });

    var out = {'labels': generateLabels(period), locations};
    fs.writeFileSync(filepath(outfn), JSON.stringify(out));
}

var areas = processAreas('data-out/areas.json');
var locationLookup = processLocations('syria', 'data-in/syria-locations.tsv');

processAirstrikes(areas, locationLookup, 'data-in/dashboard-airstrikes.tsv', 'data-out/key-places.json');
