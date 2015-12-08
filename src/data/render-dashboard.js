import fs from 'fs';
import path from 'path';
import Canvas from 'canvas';
import d3 from 'd3';
import topojson from 'topojson';
import _ from 'lodash';

const Image = Canvas.Image;

// MUST BE IN SYNC WITH parse-ir.js
const MAP_WIDTH = 650, MAP_HEIGHT = 500;

var filepath = file => path.join(__dirname, '../..', file);

function writePNG(canvas, filename) {
    console.log(`Writing ${filename}`)
    fs.writeFileSync(filename, canvas.toBuffer());
}

function main() {
    var geo = require(filepath('data-out/dashboard-geo.json'));

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

    // GEO
    context.beginPath();
    context.fillStyle = context.strokeStyle = '#f1f1f1';
    path(geo);
    context.fill();

    // SHARED BORDERS
    var topology = topojson.topology({'collection': geo});
    var interiors = topojson.mesh(topology, topology.objects.collection, (a, b) => a !== b);

    context.beginPath();
    context.fillStyle = context.strokeStyle = '#bdbdbd';
    path(interiors);
    context.stroke();

    writePNG(canvas, 'data-out/dashboard/bg.png');
}

main();
