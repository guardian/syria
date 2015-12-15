import doT from 'olado/doT'

import top5HTML from '../templates/top5.html!text'
import locations from '../../data-out/top5-locations.json!json'

const TIMELINE_HEIGHT = 60;

window.init = function init(el, config) {
    var ctx = {
        assetPath: config.assetPath,
        locations,
        countLen: Math.max.apply(null, locations.map(l => l.counts.length)),
        countMax: Math.max.apply(null, locations.map(l => l.counts).reduce((a, b) => a.concat(b))),
        timelineHeight: TIMELINE_HEIGHT
    };

    el.innerHTML = doT.template(top5HTML)(ctx);
}

