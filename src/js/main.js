import mainHTML from '../templates/main.html!text'
import share from './lib/share'
import doT from 'olado/doT'
import {fetchJSON} from './lib/fetch'
import {processCopySheet} from './lib/copy'

var shareFn = share('Interactive title', 'http://gu.com/p/URL', null, null, '#Interactive');

function render(el, data, config) {
    var ctx = {
        assetPath: config.assetPath,
        past: data.sheets.past,
        copy: processCopySheet(data.sheets.copy)
    };

    el.innerHTML = doT.template(mainHTML)(ctx);

    [].slice.apply(el.querySelectorAll('.interactive-share')).forEach(shareEl => {
        var network = shareEl.getAttribute('data-network');
        shareEl.addEventListener('click',() => shareFn(network));
    });
}

export function init(el, context, config, mediator) {
    var dataUrl = 'http://interactive.guim.co.uk/docsdata-test/19lKOCtZFsQSnLeReaYY7wORrGBHFGcD8mpwLsjOpj1Y.json';
    fetchJSON(dataUrl).then(data => render(el, data, config))
}
