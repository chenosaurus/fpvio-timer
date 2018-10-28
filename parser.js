#!/usr/bin/env node

'use strict';

/* eslint no-console: 0 */
const LapRF = require('./lib/laprf')
const SerialPort = require('serialport')
const argv = require('yargs')

  .demand('d')
  .describe('d', 'device')

  .help('h')
  .alias('h', 'help')
  .argv;

const lapRFParser = new LapRF();

let baudRate = 115200;
// baudRate /= 38400;
// baudRate = 57600;

console.log(baudRate, argv.d);

let port = new SerialPort(argv.d, {
  baudRate: baudRate
}, function (err) {
  if (err) {
    console.log('error opening port', err);
  }
});

port.on('open', () => {
  console.log('port opened');


});

port.pipe(lapRFParser);
