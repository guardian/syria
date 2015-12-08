import doT from 'olado/doT'
import share from './lib/share'
import ts2date from './lib/ts2date'
import {fetchJSON} from './lib/fetch'
import {processCopySheet} from './lib/copy'

import mainHTML from '../templates/main.html!text'
import airstrikes from '../../data-out/ir-airstrikes.json!json'

var shareFn = share('Interactive title', 'http://gu.com/p/URL', null, null, '#Interactive');

const WINDOW = 7;
const DAY_MILLIS = 1000 * 60 * 60 * 24;

const START = +new Date(airstrikes.meta.start);
const END = +new Date(airstrikes.meta.end);
const TOTAL_DAYS = (END - START) / DAY_MILLIS - WINDOW;

function renderLocation(ctx, loc, radius) {
    ctx.beginPath();
    ctx.arc(loc.geo.coord[0], loc.geo.coord[1], radius, 0, 2 * Math.PI);
    ctx.fill();
}

function render(el, data, config) {
    var ctx = {
        assetPath: config.assetPath,
        past: data.sheets.past,
        copy: processCopySheet(data.sheets.copy)
    };

    el.innerHTML = doT.template(mainHTML)(ctx);

    var sliderEl = el.querySelector('.js-dashboard-window');
    var textEl = el.querySelector('.js-dashboard-text');
    var locationsEl = el.querySelector('.js-dashboard-locations');
    var locationsCtx = locationsEl.getContext('2d');
    var strikesEl = el.querySelector('.js-dashboard-strikes');
    var strikesCtx = strikesEl.getContext('2d');

    locationsCtx.fillStyle = '#bdbdbd';
    airstrikes.locations.forEach(loc => {
        renderLocation(locationsCtx, loc, 2);
    });

    sliderEl.value = sliderEl.max = TOTAL_DAYS;

    sliderEl.addEventListener('input', () => {
        var offset = parseInt(sliderEl.value);
        var timestamp = START + offset * DAY_MILLIS;
        var start = ts2date(timestamp);
        var end = ts2date(timestamp + WINDOW * DAY_MILLIS);

        strikesEl.width = strikesEl.width;
        strikesCtx.globalAlpha = 0.7;
        strikesCtx.fillStyle = '#b82266';

        airstrikes.locations.forEach(loc => {
            var strikes = loc.strikes.filter(s => s.date >= start && s.date < end);
            var total = strikes.map(s => s.count).reduce((a, b) => a + b, 0);

            if (total > 0) {
                renderLocation(strikesCtx, loc, 3 + total);
            }
        });

        textEl.textContent = `${start} - ${end}`;
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
