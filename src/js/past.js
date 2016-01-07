import iframeMessenger from 'guardian/iframe-messenger'
import doT from 'olado/doT'
import sheetURL from './lib/sheetURL'
import {fetchJSON} from './lib/fetch'

import locations from '../../data-out/historical-locations.json!json'
import keyPlaces from '../../data-out/key-places.json!json'
import pastHTML from '../templates/past.html!text'
import keyHTML from '../templates/key.html!text'

const TIMELINE_HEIGHT = 60;

const CONTROLLERS = [
    {'id': 'islamic-state', 'name': 'Isis'},
    {'id': 'government', 'name': 'Syrian regime'},
    {'id': 'kurds', 'name': 'Kurdish forces'}
];

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September',
    'October', 'November', 'December'];

const START = new Date(Date.UTC(2014, 5, 1));
const END = new Date(Date.UTC(2016, 0, 1));
const CALENDAR = (function () {
    var ret = [];
    var date = START;
    while (date < END) {
        ret.push(date);
        date = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
    }
    return ret;
})();

function calendar(start, end) {
    var lastYear, current;
    var ret = [];
    CALENDAR.forEach(date => {
        var year = date.getUTCFullYear();
        if (year !== lastYear) {
            current = {'year': year, months: []};
            ret.push(current);
            lastYear = year;
        }
        current.months.push({
            'name': MONTHS[date.getUTCMonth()],
            'active': date >= start && date < end
        });
    });
    return ret;
}

function render(el, data, config) {
    data.past.sections.forEach(section => {
        section.labels = section.labels.map(l => locations[l]);
        section.calendar = calendar(new Date(section.start), new Date(section.end));
    });

    var ctx = {
        assetPath: config.assetPath,
        past: data.past
    };

    el.innerHTML = doT.template(pastHTML)(ctx);

    var placesById = {};
    data.past.places.forEach(place => placesById[place.id] = place);

    keyPlaces.locations.forEach(loc => {
        loc.furniture = placesById[loc.meta.id] || {'headline': '', 'copy': ''};
    });

    var keyCtx = {
        assetPath: config.assetPath,
        past: data.past,
        controllers: CONTROLLERS,
        labels: keyPlaces.labels,
        locations: keyPlaces.locations,
        countLen: Math.max.apply(null, keyPlaces.locations.map(l => l.counts.length)),
        countMax: Math.max.apply(null, keyPlaces.locations.map(l => l.counts).reduce((a, b) => a.concat(b))),
        timelineHeight: TIMELINE_HEIGHT
    };

    el.querySelector('.js-keyplaces').innerHTML = doT.template(keyHTML)(keyCtx);

}

window.init = function init(el, config) {
    iframeMessenger.enableAutoResize();

    var dataURL = sheetURL('1pOi6PRFbTW4rA5WwlCJcB0QniUW6AX-PAwZlojYeAHE', true); // TODO: remove test
    fetchJSON(dataURL).then(data => render(el, data, config))
};
