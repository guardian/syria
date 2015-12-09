import iframeMessenger from 'guardian/iframe-messenger'
import doT from 'olado/doT'
import ts2date from './lib/ts2date'
import slider from './lib/slider'

import dashboardHTML from '../templates/dashboard.html!text'
import airstrikes from '../../data-out/ir-airstrikes.json!json'

const WINDOW = 3;
const DAY_MILLIS = 1000 * 60 * 60 * 24;

const START = +new Date(airstrikes.meta.start);

function renderLocation(ctx, loc, radius) {
    ctx.beginPath();
    ctx.arc(loc.geo.coord[0], loc.geo.coord[1], radius, 0, 2 * Math.PI);
    ctx.fill();
}

window.init = function init(el, config) {
    iframeMessenger.enableAutoResize();

    var ctx = {
        assetPath: config.assetPath,
        counts: airstrikes.counts,
        countMax: Math.max.apply(null, airstrikes.counts)
    };

    el.innerHTML = doT.template(dashboardHTML)(ctx);

    var strikesEl = el.querySelector('.js-dashboard-strikes');
    var strikesCtx = strikesEl.getContext('2d');
    var timelineEl = el.querySelector('.js-timeline');
    var timelineWindowEl = el.querySelector('.js-timeline-window');

    slider(timelineEl, timelineWindowEl, 0, airstrikes.counts.length, WINDOW, (min, max) => {
        var start = ts2date(START + min * DAY_MILLIS);
        var end = ts2date(START + max * DAY_MILLIS);

        strikesEl.width = strikesEl.width; // clear canvas
        strikesCtx.globalAlpha = 0.7;
        strikesCtx.fillStyle = '#b82266';

        airstrikes.locations.forEach(loc => {
            var strikes = loc.strikes.filter(s => s.date >= start && s.date < end);
            var total = strikes.map(s => s.count).reduce((a, b) => a + b, 0);

            if (total > 0) {
                renderLocation(strikesCtx, loc, 3 + total);
            }
        });
    });
};
