import iframeMessenger from 'guardian/iframe-messenger'
import doT from 'olado/doT'
import sheetURL from './lib/sheetURL'
import {fetchJSON} from './lib/fetch'

import top5HTML from '../templates/top5.html!text'
import top5 from '../../data-out/top5.json!json'

const TIMELINE_HEIGHT = 60;

function render(el, data, config) {
    iframeMessenger.enableAutoResize();

    var ctx = {
        assetPath: config.assetPath,
        furniture: data.top5,
        labels: top5.labels,
        locations: top5.locations,
        countLen: Math.max.apply(null, top5.locations.map(l => l.counts.length)),
        countMax: Math.max.apply(null, top5.locations.map(l => l.counts).reduce((a, b) => a.concat(b))),
        timelineHeight: TIMELINE_HEIGHT
    };

    el.innerHTML = doT.template(top5HTML)(ctx);
}

window.init = function init(el, config) {
    iframeMessenger.enableAutoResize();

    var dataURL = sheetURL('1pOi6PRFbTW4rA5WwlCJcB0QniUW6AX-PAwZlojYeAHE', true); // TODO: remove test
    fetchJSON(dataURL).then(data => render(el, data, config))
};
