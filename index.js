'use strict';

const SerialPort = require('serialport');

const kScanInterval = 5 * 1000;
const kTimerBaud = 38400;
const kTxBaud = 115200;

let hasTimer = false;
let hasTx = false;

let timerPortName, txPortName, timerPort, txPort;

let streaming = false;

function startStream() {
  console.log(`opening timer port`)
  timerPort = new SerialPort(timerPortName, {
    baudRate: kTimerBaud
  }, (err) => {
    if (err) {
      console.log(`error opening ${timerPortName}`, err);
      process.exit(1);
    }

    console.log(`opened timer port ${timerPortName}`)

    console.log(`opening tx port`)
    txPort = new SerialPort(txPortName, {
      baudRate: kTxBaud
    }, (err) => {
      if (err) {
        console.log(`error opening ${txPortName}`, err);
        process.exit(1);
      }

      console.log(`opened tx port ${txPortName}`)

      timerPort.pipe(txPort);
      txPort.pipe(timerPort);

      streaming = true;

      console.log('streaming timer to tx');
    })

  })

}

function scanPorts() {

  if (hasTimer && hasTx) {
    if (!streaming) {
      startStream();
    }
    return;
  }

  SerialPort.list().then((ports) => {

    for (const port of ports) {

      if (port.manufacturer == 'ImmersionRC') {
        hasTimer = true
        timerPortName = port.comName
        console.log(`Timer detected on ${timerPortName}`)
      }

      if (port.manufacturer == 'FTDI') {
        hasTx = true
        txPortName = port.comName
        console.log(`Transceiver detected on ${txPortName}`)
      }
    }

  });
}

setInterval(scanPorts, kScanInterval)
/*
  { manufacturer: 'ImmersionRC',
    serialNumber: '00000000001A',
    pnpId: 'usb-ImmersionRC_ImmersionRC_USB_To_UART_00000000001A-if00',
    locationId: undefined,
    vendorId: '04d8',
    productId: '000a',
    comName: '/dev/ttyACM0' },
  { manufacturer: 'FTDI',
    serialNumber: 'A60252KW',
    pnpId: 'usb-FTDI_FT232R_USB_UART_A60252KW-if00-port0',
    locationId: undefined,
    vendorId: '0403',
    productId: '6001',
    comName: '/dev/ttyUSB0' } */
