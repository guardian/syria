import iframeMessenger from 'guardian/iframe-messenger'
import doT from 'olado/doT'

import top5HTML from '../templates/top5.html!text'
import top5 from '../../data-out/top5.json!json'

const TIMELINE_HEIGHT = 60;

window.init = function init(el, config) {
    iframeMessenger.enableAutoResize();

    var ctx = {
        assetPath: config.assetPath,
        labels: top5.labels,
        locations: top5.locations,
        countLen: Math.max.apply(null, top5.locations.map(l => l.counts.length)),
        countMax: Math.max.apply(null, top5.locations.map(l => l.counts).reduce((a, b) => a.concat(b))),
        timelineHeight: TIMELINE_HEIGHT
    };

    el.innerHTML = doT.template(top5HTML)(ctx);
}

