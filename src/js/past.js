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

function formatDate(date) {
    return MONTHS[date.getUTCMonth()] + ' ' + date.getUTCFullYear();
}

function render(el, data, config) {
    data.past.sections.forEach(section => {
        section.labels = section.labels.map(l => locations[l]);
        var start = new Date(section.start);
        var end = new Date(+new Date(section.end) - 24 * 60 * 60);
        section.subheadline = `${formatDate(start)} - ${formatDate(end)}`;
    });

    var ctx = {
        assetPath: config.assetPath,
        past: data.past,
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
