import csv from 'csv';
import fs from 'fs';
import es from 'event-stream'
import CombinedStream from 'combined-stream'
import {filepath} from './config'

var russianAirstrikes = fs.createReadStream(filepath('data-in/russian-airstrikes.csv'));
var coalitionAirstrikes = fs.createReadStream(filepath('data-in/coalition-airstrikes.csv'));
var output = fs.createWriteStream(filepath('data-out/airstrikes.json'), {defaultEncoding: 'utf8'})

function processAirstrikes(input, airforce) {
  var processAirstrike = es.through(
    function write(record) {
      var [date, geo] = record['Date Range and Location'].split(', Point: ');
      if (geo) {
        var airstrike = {
          date: date.split(' to ')[0],
          geo: geo.split(', ').map(n => parseFloat(n)).join(' '),
          airforce: airforce
        };
        this.queue(JSON.stringify(airstrike));
      }
    },
    function end() {
      this.queue(null)
    });

  return input
    .pipe(csv.parse({columns:true}))
    .pipe(processAirstrike)
}

var combinedStream = CombinedStream.create();
combinedStream.append( processAirstrikes(russianAirstrikes, 'Russia') );
combinedStream.append( processAirstrikes(coalitionAirstrikes, 'Coalition') );

output.write('[\n');

combinedStream
  .pipe(es.join(',\n')).on('end', () => output.write('\n]'))
  .pipe(output)
