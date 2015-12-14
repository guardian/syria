import fs from 'fs';
import {filepath, projectFn, parseTSV, cfg} from './config'

var project = projectFn('data-out/historical-geo.json', cfg.past.WIDTH, cfg.past.HEIGHT);

function processLocations(fn, outfn) {
    var input = fs.readFileSync(filepath(fn)).toString();

    var locations = {};
    parseTSV(input).forEach(row => {
        var coord = project(row['lat'], row['lng']);
        var left = coord[0] / cfg.past.WIDTH * 100;
        locations[row['name']] = {
            'name': row['name'],
            'coord': [row['anchor'] === 'right' ? 100 - left : left, coord[1] / cfg.past.HEIGHT * 100],
            'style': row['style'],
            'anchor': row['anchor'] || 'left'
        };
    });

    fs.writeFileSync(filepath(outfn), JSON.stringify(locations));
}

processLocations('data-in/historical-locations.tsv', 'data-out/historical-locations.json');
