import iframeMessenger from 'guardian/iframe-messenger'
import doT from 'olado/doT'
import sheetURL from './lib/sheetURL'
import {fetchJSON} from './lib/fetch'

import keyHTML from '../templates/key.html!text'
import keyPlaces from '../../data-out/key-places.json!json'

const TIMELINE_HEIGHT = 60;

function render(el, data, config) {
    iframeMessenger.enableAutoResize();

    var ctx = {
        assetPath: config.assetPath,
        furniture: data.key,
        labels: keyPlaces.labels,
        locations: keyPlaces.locations,
        countLen: Math.max.apply(null, keyPlaces.locations.map(l => l.counts.length)),
        countMax: Math.max.apply(null, keyPlaces.locations.map(l => l.counts).reduce((a, b) => a.concat(b))),
        timelineHeight: TIMELINE_HEIGHT
    };

    el.innerHTML = doT.template(keyHTML)(ctx);
}

window.init = function init(el, config) {
    iframeMessenger.enableAutoResize();

    var dataURL = sheetURL('1pOi6PRFbTW4rA5WwlCJcB0QniUW6AX-PAwZlojYeAHE', true); // TODO: remove test
    fetchJSON(dataURL).then(data => render(el, data, config))
};
