const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

function pad(n) {
    return (n < 10 ? '0' : '') + n;
}

export default function ts2date(timestamp, dayOffset) {
    var date = new Date(timestamp + dayOffset * 1000 * 60 * 60 * 24);
    return {
        'cmp': [date.getUTCFullYear(), pad(date.getUTCMonth() + 1), pad(date.getUTCDate())].join('-'),
        'display': date.getUTCDate() + ' ' + MONTHS[date.getUTCMonth()]
    }
}

