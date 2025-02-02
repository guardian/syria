import fs from 'fs';
import Canvas from 'canvas';
import d3 from 'd3';
import _ from 'lodash';
import moment from 'moment';
import {filepath, projectGeo, dims} from './common';

const Image = Canvas.Image;

function icon(fp) {
    var img = new Image;
    img.src = fs.readFileSync(filepath(fp));
    return img;
}

var airstrikeImages = {
    'Russia': icon('src/img/airstrike-russia.png'),
    'Coalition': icon('src/img/airstrike-coalition.png')
};

function getLocationsAtDate(areas, date) {
    return _(areas).values()
        .map(locationRows => {
            return _.findLast(locationRows, row => date >= row.moment)
        })
        .value();
}

function writePNG(canvas, filename) {
    console.log(`Writing ${filename}`)
    fs.writeFileSync(filename, canvas.toBuffer());
}

function render(areas, airstrikes, geo, date, diffDate) {
    var canvas = new Canvas();
    canvas.width = dims.past.WIDTH;
    canvas.height = dims.past.HEIGHT;
    var context = canvas.getContext('2d');

    var projection = projectGeo(geo, dims.past.WIDTH, dims.past.HEIGHT);
    var path = d3.geo.path().projection(projection).context(context);

    var previousPoints = diffDate && getLocationsAtDate(areas, diffDate);
    var points = getLocationsAtDate(areas, date)

    function clearCanvas() {
        // white clear
        context.fillStyle="white";
        context.fillRect(0, 0, dims.past.WIDTH, dims.past.HEIGHT);
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

    function renderAirstrikes() {
        airstrikes
            .filter(a => a.moment <= date && a.moment > diffDate)
            .forEach(airstrike => {
                var geoCoords = airstrike.geo.split(' ').map(n => parseFloat(n)).reverse();
                var screenCoords = projection(geoCoords);
                var img = airstrikeImages[airstrike.airforce];
                var x = Math.round(screenCoords[0] - (img.width / 2));
                var y = Math.round(screenCoords[1] - (img.height / 2));
                context.drawImage(img, x, y);
            })
    }

    function saveFile(suffix) {
        var filename = filepath(`data-out/historical/${date.format('YYYY-MM-DD')}-${suffix}.png`);
        writePNG(canvas, filename);
    }

    // airstrikes
    clearCanvas();
    renderTerritory({isis: '#ccc'});
    renderAirstrikes();
    saveFile('airstrikes');

    // territory
    clearCanvas();
    renderTerritory({isis: '#79bae2', gain: '#29619a', loss: '#d22e0a'});
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
        '2014-06-01', '2015-01-01',
        '2015-02-01', '2015-07-01',
        '2016-01-01'
    ];
    var frameMoments = frameDates.map(d => moment(d));

    var pairs = frameMoments.map((date,i) => [date, frameMoments[i-1]]);

    pairs.forEach(([frameDate, diffDate]) => {
        render(areas, airstrikes, geo, frameDate, diffDate);
    })
}

main();
