import doT from 'olado/doT'
import share from './lib/share'
import ts2date from './lib/ts2date'
import slider from './lib/slider'
import {fetchJSON} from './lib/fetch'
import {processCopySheet} from './lib/copy'

import mainHTML from '../templates/main.html!text'
import airstrikes from '../../data-out/ir-airstrikes.json!json'

var shareFn = share('Interactive title', 'http://gu.com/p/URL', null, null, '#Interactive');

const WINDOW = 3;
const DAY_MILLIS = 1000 * 60 * 60 * 24;

const START = +new Date(airstrikes.meta.start);

function renderLocation(ctx, loc, radius) {
    ctx.beginPath();
    ctx.arc(loc.geo.coord[0], loc.geo.coord[1], radius, 0, 2 * Math.PI);
    ctx.fill();
}

function render(el, data, config) {
    //airstrikes.counts = airstrikes.counts.slice(0, 14);
    var ctx = {
        assetPath: config.assetPath,
        counts: airstrikes.counts,
        countMax: Math.max.apply(null, airstrikes.counts),
        past: data.sheets.past,
        copy: processCopySheet(data.sheets.copy),
    };

    el.innerHTML = doT.template(mainHTML)(ctx);

    var locationsEl = el.querySelector('.js-dashboard-locations');
    var locationsCtx = locationsEl.getContext('2d');
    var strikesEl = el.querySelector('.js-dashboard-strikes');
    var strikesCtx = strikesEl.getContext('2d');
    var timelineEl = el.querySelector('.js-timeline');
    var timelineWindowEl = el.querySelector('.js-timeline-window');

    locationsCtx.fillStyle = '#999';
    airstrikes.locations.forEach(loc => {
        renderLocation(locationsCtx, loc, 2);
    });

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

    [].slice.apply(el.querySelectorAll('.interactive-share')).forEach(shareEl => {
        var network = shareEl.getAttribute('data-network');
        shareEl.addEventListener('click',() => shareFn(network));
    });
}

export function init(el, context, config, mediator) {
    var dataUrl = 'http://interactive.guim.co.uk/docsdata-test/19lKOCtZFsQSnLeReaYY7wORrGBHFGcD8mpwLsjOpj1Y.json';
    fetchJSON(dataUrl).then(data => render(el, data, config))
}
