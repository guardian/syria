import iframeMessenger from 'guardian/iframe-messenger'
import doT from 'olado/doT'
import sheetURL from './lib/sheetURL'
import {fetchJSON} from './lib/fetch'

import locations from '../../data-out/historical-locations.json!json'
import pastHTML from '../templates/past.html!text'

function render(el, data, config) {
    data.past.sections.forEach(section => {
        section.labels = section.labels.map(l => locations[l]);
    });

    var ctx = {
        assetPath: config.assetPath,
        past: data.past
    };

    el.innerHTML = doT.template(pastHTML)(ctx);
}

window.init = function init(el, config) {
    iframeMessenger.enableAutoResize();

    var dataURL = sheetURL('1pOi6PRFbTW4rA5WwlCJcB0QniUW6AX-PAwZlojYeAHE', true); // TODO: remove test
    fetchJSON(dataURL).then(data => render(el, data, config))
};
