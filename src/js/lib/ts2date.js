function pad(n) {
    return (n < 10 ? '0' : '') + n;
}

export default function ts2date(timestamp) {
    var date = new Date(timestamp);
    return [date.getUTCFullYear(), pad(date.getUTCMonth() + 1), pad(date.getUTCDate())].join('-');
}

