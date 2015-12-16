import fs from 'fs';
import path from 'path';
import moment from 'moment';
import d3 from 'd3';

export function filepath(file) { return path.join(__dirname, '../..', file); };

export function parseTSV(s) {
    var rows = s.replace(/\n+$/, '').split('\n');
    var headers = rows[0].split('\t');
    return rows.slice(1).map(row => {
        var ret = {};
        row.split('\t').forEach((cell, i) => ret[headers[i]] = cell.trim());
        return ret;
    });
}

export function projectGeo(geo, width, height) {
    var projection = d3.geo.mercator().scale(1).translate([0, 0]);
    var path = d3.geo.path().projection(projection);

    var b = path.bounds(geo),
        s = 1 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height),
        t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];

    projection.scale(s).translate(t);
    return projection;
}

export function projectFile(geoFile, width, height) {
    var geo = require(filepath(geoFile));
    var projection = projectGeo(geo, width, height);

    return (lat, lng) => projection([lng, lat].map(l => parseFloat(l)));
};

export function writePNG(canvas, filename) {
    console.log(`Writing ${filename}`)
    fs.writeFileSync(filename, canvas.toBuffer());
};

export var cfg = {
    dashboard: {
        WIDTH: 650, HEIGHT: 500,
        WINDOW: moment.duration(6, 'months')
    },
    past: {
        WIDTH: 300, HEIGHT: 260
    },
    key: {
        WIDTH: 60, HEIGHT: 60
    }
};
