import csv from 'csv';
import fs from 'fs';
import _ from 'lodash';
import through from 'through'
import {filepath} from './common';

var input = fs.createReadStream(filepath('data-in/areas.csv'));
var output = fs.createWriteStream(filepath('data-out/areas.json'), {defaultEncoding: 'utf8'})

var join = function (str) {
  var first = true
  return through(function (data) {
    if(!first)
      this.emit('data', str)
    first = false
    this.emit('data', data)
    return true
  })
}

var processRecord = through(
  function write(record) {
    var geo = record['Lat Long / MGRS Grid'].split(' ').map(n => parseFloat(n)).join(' ');
    var current = { geo: geo, date: 'December 1, 2015', controller: record['Controlled By'].trim() };
    var prevField = record['Controlled By (Previous)'].trim();
    var prevRecords =  prevField.length === 0 ? [] :
      _(prevField)
        .split(',').chunk(2).map(pair => pair.join('')) // no delimiter fuckery
        .map(pair => {
            var [date, controller] = pair.split(';');
            return { geo: geo, date: date.trim(), controller: controller && controller.trim() };
        }).value();

    prevRecords.concat(current)
      .map(r => JSON.stringify(r))
      .forEach(str => this.push(str));
  },
  function end () {
    this.queue(null);
  })

output.write('[\n');
input
  .pipe(csv.parse({columns:true}))
  .pipe(processRecord)
  .pipe(join(',\n')).on('end', () => output.write('\n]'))
  .pipe(output)
