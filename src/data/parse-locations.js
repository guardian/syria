import fs from 'fs';
import {filepath, projectFile, dims} from './common'

var project = projectFile('data-out/historical-geo.json', dims.past.WIDTH, dims.past.HEIGHT);

var input = require(filepath('data-in/historical-locations.json'));
var locations = {};
input.forEach(row => {
    var coord = project(row['lat'], row['lng']);
    var left = coord[0] / dims.past.WIDTH * 100;
    locations[row['name']] = {
        'name': row['name'],
        'coord': [row['anchor'] === 'right' ? 100 - left : left, coord[1] / dims.past.HEIGHT * 100],
        'style': row['style'],
        'anchor': row['anchor'] || 'left'
    };
});

fs.writeFileSync(filepath('data-out/historical-locations.json'), JSON.stringify(locations));
