import './polyfill/classList'

import iframeMessenger from 'guardian/iframe-messenger'
import doT from 'olado/doT'
import ts2date from './lib/ts2date'
import slider from './lib/slider'

import dashboardHTML from '../templates/dashboard.html!text'
import airstrikes from '../../data-out/ir-airstrikes.json!json'
import cities from '../../data-out/dashboard-cities.json!json'

const WINDOW = 3;

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
        cities,
        counts: airstrikes.counts,
        countMax: Math.max.apply(null, airstrikes.counts)
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

    slider(timelineEl, timelineWindowEl, 0, airstrikes.meta.days, WINDOW, (min, max) => {
        var start = ts2date(START, min);
        var end = ts2date(START, max);

        strikesEl.width = strikesEl.width; // clear canvas
        strikesCtx.globalAlpha = 0.7;
        strikesCtx.fillStyle = '#b82266';

        var totals = {'iraq': 0, 'syria': 0};

        airstrikes.locations.forEach(loc => {
            var strikes = loc.strikes.filter(s => s.date >= start.cmp && s.date < end.cmp);
            var total = strikes.reduce((sum, strike) => sum + strike.count, 0);

            if (total > 0) {
                renderLocation(strikesCtx, loc, 3 + total);
            }

            totals[loc.geo.country] += total;
        });

        var live = end.cmp === airstrikes.meta.end;
        periodEl.textContent = live ? 'In the last week' : `${start.display} - ${end.display}`;
        syriaTotalEl.textContent = totals.syria;
        iraqTotalEl.textContent = totals.iraq;
        el.classList.toggle('is-in-past', !live);
    });
};
