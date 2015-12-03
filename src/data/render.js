import fs from 'fs';
import path from 'path';
import Canvas from 'canvas';
import d3 from 'd3';
import _ from 'lodash';
import moment from 'moment';

const Image = Canvas.Image;

var filepath = file => path.join(__dirname, '../..', file);


let fgImg = new Image;
fgImg.src = fs.readFileSync(filepath('src/img/fg.png'));

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

function render(areas, geo, date, diffDate) {
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

    // white clear
    context.fillStyle="white";
    context.fillRect(0,0,width,height);

    // GEO
    context.fillStyle = context.strokeStyle = '#f1f1f1';
    path(geo);
    context.fill();

    var previousPoints = diffDate && getLocationsAtDate(areas, diffDate);

    var points = getLocationsAtDate(areas, date)
    points.forEach((point, i) => {
        if (point) {
            var geoCoords = point.geo.split(' ').map(n => Number(n)).reverse();
            var screenCoords = projection(geoCoords);
            var isis = point.controller === 'Islamic State';
            context.beginPath();
            context.arc(screenCoords[0], screenCoords[1] , 1.5, 0, 2*Math.PI);
            if (diffDate) {
                var wasIsis = previousPoints[i] && previousPoints[i].controller === 'Islamic State';
                if (isis && !wasIsis) context.fillStyle = '#5ebfba'; // gained
                else if (!isis && wasIsis) context.fillStyle = '#dc4b72'; // lost
                else if (isis && wasIsis) context.fillStyle = '#333'; // stable isis
                else if (!isis && !wasIsis) context.fillStyle = '#ccc'; // stable other
            } else {
                context.fillStyle = isis ? '#333' : '#ccc';
            }
            context.fill();
        }
    })

    context.drawImage(fgImg, 0, 0, fgImg.width, fgImg.height, 0, 0, width, height);

    var filename = filepath(`data-out/frames/${date.format('YYYY-MM-DD')}.png`);
    writePNG(canvas, filename);
}


function main() {
    var rows = require(filepath('data-out/areas.json'));
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
        render(areas, geo, frameDate, diffDate);
    })
}

main();
