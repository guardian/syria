import './polyfill/classList'

import iframeMessenger from 'guardian/iframe-messenger'
import doT from 'olado/doT'
import ts2date from './lib/ts2date'
import slider from './lib/slider'
import { fetchJSON } from './lib/fetch'
import sheetURL from './lib/sheetURL'

import dashboardHTML from '../templates/dashboard.html!text'
import airstrikes from '../../data-out/dashboard-airstrikes.json!json'
import cities from '../../data-out/dashboard-cities.json!json'

const TIMELINE_WINDOW = 3;
const TIMELINE_HEIGHT = 60; // keep in sync with _dashboard.scss

const START = +new Date(airstrikes.meta.start);
const END = +new Date(airstrikes.meta.end);

const COLORS = {'syria': '#b82266', 'iraq': '#d37da3'};

function renderLocation(ctx, loc, radius) {
    ctx.beginPath();
    ctx.arc(loc.geo.coord[0], loc.geo.coord[1], radius, 0, 2 * Math.PI);
    ctx.fill();
}

window.init = function init(el, config) {
    iframeMessenger.enableAutoResize();

    var ctx = {
        assetPath: config.assetPath,
        cities,
        timeline: airstrikes.timeline,
        countLen: airstrikes.timeline.counts.length,
        countMax: Math.max.apply(null, airstrikes.timeline.counts.map(c => (c.iraq || 0) + (c.syria || 0))),
        windowSize: TIMELINE_WINDOW * 2 + 1,
        timelineHeight: TIMELINE_HEIGHT
    };

    el.innerHTML = doT.template(dashboardHTML)(ctx);

    var strikesEl = el.querySelector('.js-dashboard-strikes');
    var strikesCtx = strikesEl.getContext('2d');
    var timelineEl = el.querySelector('.js-timeline');
    var timelineWindowEl = el.querySelector('.js-timeline-window');
    var analysisEl = el.querySelector('.js-analysis');
    var periodEl = el.querySelector('.js-period');
    var syriaTotalEl = el.querySelector('.js-syria-total');
    var iraqTotalEl = el.querySelector('.js-iraq-total');

    function renderMap(start, end) {
        strikesEl.width = strikesEl.width; // clear canvas
        strikesCtx.globalAlpha = 0.7;

        var totals = {'iraq': 0, 'syria': 0};

        airstrikes.locations.forEach(loc => {
            var strikes = loc.strikes.filter(s => s.date >= start.cmp && s.date <= end.cmp);
            var total = strikes.reduce((sum, strike) => sum + strike.count, 0);

            if (total > 0) {
                strikesCtx.fillStyle = COLORS[loc.geo.country];
                renderLocation(strikesCtx, loc, Math.sqrt(total) * 5);
            }

            totals[loc.geo.country] += total;
        });

        var live = end.cmp === airstrikes.meta.end;
        periodEl.textContent = live ? 'In the last week' : `${start.display} - ${end.display}`;
        syriaTotalEl.textContent = totals.syria;
        iraqTotalEl.textContent = totals.iraq;
        el.classList.toggle('is-in-past', !live);
    }

    slider(timelineEl, timelineWindowEl, 0, airstrikes.meta.days, TIMELINE_WINDOW, (min, max) => {
        var start = ts2date(START, min);
        var end = ts2date(START, max);

        renderMap(start, end);
    });

    renderMap(ts2date(END, -TIMELINE_WINDOW * 2), ts2date(END, 0));

    var dataURL = sheetURL('1pOi6PRFbTW4rA5WwlCJcB0QniUW6AX-PAwZlojYeAHE', true); // TODO: remove test
    fetchJSON(dataURL).then(resp => {
        ['dashboard1', 'dashboard2'].forEach(n => {
            el.querySelector('.js-' + n + '-headline').innerHTML = resp[n].headline;
            el.querySelector('.js-' + n + '-copy').innerHTML = resp[n].copy;
        });
    });
};
