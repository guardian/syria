import fs from 'fs';
import path from 'path';
import Canvas from 'canvas';
import d3 from 'd3';
import _ from 'lodash';
import moment from 'moment';

const Image = Canvas.Image;

const MAP_WIDTH = 300, MAP_HEIGHT = 260;

var filepath = file => path.join(__dirname, '../..', file);

let airstrikeAsterisk = new Image;
airstrikeAsterisk.src = fs.readFileSync(filepath('src/img/airstrike-asterisk-7px.png'));

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
    var canvas = new Canvas();
    canvas.width = MAP_WIDTH;
    canvas.height = MAP_HEIGHT;
    var context = canvas.getContext('2d');

    var projection = d3.geo.mercator().scale(1).translate([0, 0]);
    var path = d3.geo.path().projection(projection).context(context);

    var b = path.bounds(geo),
        s = 1 / Math.max((b[1][0] - b[0][0]) / MAP_WIDTH, (b[1][1] - b[0][1]) / MAP_HEIGHT),
        t = [(MAP_WIDTH - s * (b[1][0] + b[0][0])) / 2, (MAP_HEIGHT - s * (b[1][1] + b[0][1])) / 2];

    projection.scale(s).translate(t);

    var previousPoints = diffDate && getLocationsAtDate(areas, diffDate);
    var points = getLocationsAtDate(areas, date)

    function clearCanvas() {
        // white clear
        context.fillStyle="white";
        context.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
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
                var x = Math.round(screenCoords[0] - (airstrikeAsterisk.width/2));
                var y = Math.round(screenCoords[1] - (airstrikeAsterisk.height/2));
                context.drawImage(airstrikeAsterisk, x, y);
            })
    }

    function saveFile(suffix) {
        var filename = filepath(`data-out/historical/${date.format('YYYY-MM-DD')}-${suffix}.png`);
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

    var geo = require(filepath('data-out/historical-geo.json'));

    var frameDates = [
        //'2014-01-01', '2014-06-01',
        '2014-09-01', '2015-01-01', '2015-02-01',
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
