function pad(n) {
    return (n < 10 ? '0' : '') + n;
}

export default function ts2date(timestamp, dayOffset) {
    var date = new Date(timestamp + dayOffset * 1000 * 60 * 60 * 24);
    return [date.getUTCFullYear(), pad(date.getUTCMonth() + 1), pad(date.getUTCDate())].join('-');
}

