var fs = require('fs');
var path = require('path');
var d3 = require('d3');

var filepath = file => path.join(__dirname, '../..', file);

// MUST BE IN SYNC WITH render-dashboard.js
const MAP_WIDTH = 650, MAP_HEIGHT = 500;

function parseTSV(s) {
    var rows = s.replace(/\n+$/, '').split('\n');
    var headers = rows[0].split('\t');
    return rows.slice(1).map(row => {
        var ret = {};
        row.split('\t').forEach((cell, i) => ret[headers[i]] = cell);
        return ret;
    });
}

function processLocations(country, fn) {
    var geo = require(filepath('data-out/dashboard-geo.json'));

    var projection = d3.geo.mercator().scale(1).translate([0, 0]);
    var path = d3.geo.path().projection(projection);

    var b = path.bounds(geo),
        s = 1 / Math.max((b[1][0] - b[0][0]) / MAP_WIDTH, (b[1][1] - b[0][1]) / MAP_HEIGHT),
        t = [(MAP_WIDTH - s * (b[1][0] + b[0][0])) / 2, (MAP_HEIGHT - s * (b[1][1] + b[0][1])) / 2];

    projection.scale(s).translate(t);

    var input = fs.readFileSync(filepath(fn)).toString();

    var out = parseTSV(input);
    out.forEach(row => {
        row['country'] = country;
        row['coord'] = projection([row['lng'], row['lat']].map(l => parseFloat(l)));
        delete row['lat'];
        delete row['lng'];
    });
    return out;
}

function processAirstrikes(locations, fn, outfn) {
    var input = fs.readFileSync(filepath(fn)).toString();

    var out = parseTSV(input).map(row => {
        var geo = locations[row.place.trim()];
        if (!geo) {
            console.warn(`Unknown location ${row.place}, ignoring...`);
            return undefined;
        }

        return {geo, 'strikes': parseInt(row.strikes), 'date': row.date.trim()};
    }).filter(r => r)// TODO: .sort((a, b) => a.date > b.date);

    fs.writeFileSync(filepath(outfn), JSON.stringify(out));
}

var iraqLocations = processLocations('iraq', 'data-in/iraq-locations.tsv');
var syriaLocations = processLocations('syria', 'data-in/syria-locations.tsv');
var locations = {};
iraqLocations.concat(syriaLocations).forEach(loc => locations[loc['name']] = loc);

processAirstrikes(locations, 'data-in/ir-airstrikes.tsv', 'data-out/ir-airstrikes.json');
