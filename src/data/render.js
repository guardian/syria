import fs from 'fs';
import path from 'path';
import Canvas from 'canvas';
import d3 from 'd3';
import _ from 'lodash';
import moment from 'moment';

const Image = Canvas.Image;

var filepath = file => path.join(__dirname, '../..', file);

let syriaMask = new Image;
syriaMask.src = fs.readFileSync(filepath('src/img/syria-mask.png'));

function writePNG(canvas, filename) {
    console.log(`Writing ${filename}`)
    fs.writeFileSync(filename, canvas.toBuffer());
}

function getLocationsAtDate(areas, date) {
    return _(areas).values()
        .map(locationRows => {
            return _.findLast(locationRows, row => date >= row.moment)
        })
        .value();
}

function render(areas, airstrikes, geo, date, diffDate) {
    date = moment(date);

    var width = 300, height = 260;
    var projection = d3.geo.mercator()
        .center([38.9, 34.85])
        .scale(width*7.9)
        .translate([width / 2, height / 2]);

    var canvas = new Canvas();
    canvas.width = width;
    canvas.height = height;
    var context = canvas.getContext('2d');
    var path = d3.geo.path()
        .projection(projection)
        .context(context);
    var previousPoints = diffDate && getLocationsAtDate(areas, diffDate);
    var points = getLocationsAtDate(areas, date)

    function clearCanvas() {
        // white clear
        context.fillStyle="white";
        context.fillRect(0,0,width,height);
        // GEO
        context.fillStyle = context.strokeStyle = '#f1f1f1';
        path(geo);
        context.fill();
    }

    function renderTerritory(colors) {
        points.forEach((point, i) => {
            if (point) {
                var geoCoords = point.geo.split(' ').map(n => parseFloat(n)).reverse();
                var screenCoords = projection(geoCoords);
                var isis = point.controller === 'Islamic State';
                var fillColor;
                context.beginPath();
                context.arc(screenCoords[0], screenCoords[1] , 1.5, 0, 2*Math.PI);
                if (diffDate) {
                    var wasIsis = previousPoints[i] && previousPoints[i].controller === 'Islamic State';
                    if (isis && !wasIsis) fillColor = colors.gain; // gained
                    else if (!isis && wasIsis) fillColor = colors.loss; // lost
                    else if (isis && wasIsis) fillColor = colors.isis; // stable isis
                    else if (!isis && !wasIsis) fillColor = colors.other; // stable other
                } else {
                    fillColor = isis ? colors.isis : colors.other;
                }
                if (fillColor) {
                    context.fillStyle = fillColor;
                    context.fill();
                }
            }
        })
    }

    function renderAirstrikes(colors) {
        airstrikes
            .filter(a => a.moment <= date && a.moment > diffDate)
            .forEach(airstrike => {
                var geoCoords = airstrike.geo.split(' ').map(n => parseFloat(n)).reverse();
                var screenCoords = projection(geoCoords);
                context.beginPath();
                context.arc(screenCoords[0], screenCoords[1] , 1, 0, 2*Math.PI);
                context.fillStyle = airstrike.airforce === 'Russia' ? colors.russia : colors.coalition;
                context.fill();
            })
    }

    function drawMask() {
        context.drawImage(syriaMask, 0, 0, syriaMask.width, syriaMask.height, 0, 0, width, height);
    }

    function saveFile(suffix) {
        var filename = filepath(`data-out/frames/${date.format('YYYY-MM-DD')}-${suffix}.png`);
        writePNG(canvas, filename);
    }

    // airstrikes
    clearCanvas();
    renderTerritory({isis: '#ccc'});
    renderAirstrikes({russia: '#005689', coalition: 'orange'});
    saveFile('airstrikes');

    // territory
    clearCanvas();
    renderTerritory({isis: '#94b8cd', gain: '#005685', loss: '#dc4b72'});
    saveFile('territory');

}


function main() {
    var rows = require(filepath('data-out/areas.json'));
    var airstrikes = require(filepath('data-out/airstrikes.json'));
    airstrikes.forEach(a => a.moment = moment(a.date, 'MMM D, YYYY HH:mm'));

    var areas = _(rows)
        .forEach(row => row.moment = moment(row.date, 'MMMM D, YYYY'))
        .groupBy('geo')
        .mapValues(rows => {
            return _.sortBy(rows, 'moment');
        }).value();

    var geo = require(filepath('data-out/geo.json'));

    var frameDates = [
        '2014-01-01', '2014-06-01',
        '2015-01-01', '2015-02-01',
        '2015-06-01', '2015-07-01',
        '2015-08-01', '2015-12-01'
    ];
    var frameMoments = frameDates.map(d => moment(d));

    var pairs = frameMoments.map((date,i) => [date, frameMoments[i-1]]);

    pairs.forEach(([frameDate, diffDate]) => {
        render(areas, airstrikes, geo, frameDate, diffDate);
    })
}

main();
