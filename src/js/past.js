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

function render(el, data, config) {
    data.past.sections.forEach(section => {
        section.labels = section.labels.map(l => locations[l]);
    });

    var ctx = {
        assetPath: config.assetPath,
        past: data.past,
    };

    el.innerHTML = doT.template(pastHTML)(ctx);

    keyPlaces.locations.forEach(loc => {
        loc.furniture = data.past.places.find(place => place.id === loc.meta.id);
    });

    var keyCtx = {
        assetPath: config.assetPath,
        controllers: CONTROLLERS,
        labels: keyPlaces.labels,
        locations: keyPlaces.locations,
        countLen: Math.max.apply(null, keyPlaces.locations.map(l => l.counts.length)),
        countMax: Math.max.apply(null, keyPlaces.locations.map(l => l.counts).reduce((a, b) => a.concat(b))),
        timelineHeight: TIMELINE_HEIGHT
    };

    console.log(keyPlaces.locations);

    el.querySelector('.js-keyplaces').innerHTML = doT.template(keyHTML)(keyCtx);

}

window.init = function init(el, config) {
    iframeMessenger.enableAutoResize();

    var dataURL = sheetURL('1pOi6PRFbTW4rA5WwlCJcB0QniUW6AX-PAwZlojYeAHE', true); // TODO: remove test
    fetchJSON(dataURL).then(data => render(el, data, config))
};
