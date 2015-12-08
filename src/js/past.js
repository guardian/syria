import iframeMessenger from 'guardian/iframe-messenger'
import doT from 'olado/doT'
import sheetURL from './lib/sheetURL'
import {fetchJSON} from './lib/fetch'
import {processCopySheet} from './lib/copy'

import pastHTML from '../templates/past.html!text'

function render(el, data, config) {
    var ctx = {
        assetPath: config.assetPath,
        past: data.sheets.past,
        copy: processCopySheet(data.sheets.copy),
    };

    el.innerHTML = doT.template(pastHTML)(ctx);
}

window.init = function init(el, config) {
    iframeMessenger.enableAutoResize();

    var dataUrl = sheetURL('19lKOCtZFsQSnLeReaYY7wORrGBHFGcD8mpwLsjOpj1Y', true); // TODO: remove test
    fetchJSON(dataUrl).then(data => render(el, data, config))
};
