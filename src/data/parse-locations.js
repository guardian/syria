import fs from 'fs';
import path from 'path';
import d3 from 'd3';
import _ from 'lodash';

// MUST BE IN SYNC WITH render-historical.js
const MAP_WIDTH = 300, MAP_HEIGHT = 260;

var filepath = file => path.join(__dirname, '../..', file);

var project = (function () {
    var geo = require(filepath('data-out/historical-geo.json'));

    var projection = d3.geo.mercator().scale(1).translate([0, 0]);
    var path = d3.geo.path().projection(projection);

    var b = path.bounds(geo),
        s = 1 / Math.max((b[1][0] - b[0][0]) / MAP_WIDTH, (b[1][1] - b[0][1]) / MAP_HEIGHT),
        t = [(MAP_WIDTH - s * (b[1][0] + b[0][0])) / 2, (MAP_HEIGHT - s * (b[1][1] + b[0][1])) / 2];

    projection.scale(s).translate(t);

    return (lat, lng) => projection([lng, lat].map(l => parseFloat(l)));
})();

function parseTSV(s) {
    var rows = s.replace(/\n+$/, '').split('\n');
    var headers = rows[0].split('\t');
    return rows.slice(1).map(row => {
        var ret = {};
        row.split('\t').forEach((cell, i) => ret[headers[i]] = cell.trim());
        return ret;
    });
}


function processLocations(fn, outfn) {
    var input = fs.readFileSync(filepath(fn)).toString();

    var locations = {};
    parseTSV(input).forEach(row => {
        var coord = project(row['lat'], row['lng']);
        var left = coord[0] / MAP_WIDTH * 100;
        locations[row['name']] = {
            'name': row['name'],
            'coord': [row['anchor'] === 'right' ? 100 - left : left, coord[1] / MAP_HEIGHT * 100],
            'style': row['style'],
            'anchor': row['anchor'] || 'left'
        };
    });

    fs.writeFileSync(filepath(outfn), JSON.stringify(locations));
}

processLocations('data-in/historical-locations.tsv', 'data-out/historical-locations.json');
