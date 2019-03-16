'use strict';

const Path = require('path')
const { crc16 } = require('crc')
const Stream = require('stream')
const StreamParser = require('stream-parser')

const internals = {

  // // constants
  //
  // CRC_SIZE: 3, // size in bytes of crc
  // EVENT_NAMESPACE: 'message', // the main event and namespace for specific
  // EVENT_NAMESPACE_SEPARATOR: ':', // the separator for the namespaced events
  // MESSAGE_HEADER_SIZE: 2, // size in bytes of reserved bits + message length header
  // MESSAGE_LENGTH_SIZE: 10, // size in bits of the message length bit array
  // MESSAGE_NUMBER_SIZE: 12, // size in bits of the message number field
  // MESSAGE_TYPE_MODULE_DIRECTORY: 'message_types', // the directory where the message type files are
  // HTTP_HEADER_SIZE: 14, // size in bytes of the HTTP header
  PREAMBLE_SIZE: 1, // the length in bytes of the preamble
  PREAMBLE_VALUE: new Buffer('5A', 'hex'), // hex value of the preamble
  // RESERVED_BITS_SIZE: 6, // size in bits of the reserved bits bit array

  SOR_LENGTH: 1,
  EOR_LENGTH: 1,

  SOR: 0x5A,
  EOR: 0x5B,
  ESC: 0x5C,
  ESC_OFFSET: 0x40,

  // record types
  RSSI_RECORD: new Buffer('DA01', 'hex'),
  RFSETUP_RECORD: new Buffer('DA02', 'hex'),
  STATECONTROL_RECORD: new Buffer('DA04', 'hex'),
  SETTINGS_RECORD: new Buffer('DA07', 'hex'),
  PASSING_RECORD: new Buffer('DA09', 'hex'),
  STATUS_RECORD: 0xDA0A,
  ERROR_RECORD: new Buffer('FFFF', 'hex'),

  STATUS_FIELDS: {
    SLOT_INDEX: 0x01,
    FLAGS: 0x03,
    BATTERY_VOLTAGE: 0x21,
    LAST_RSSI: 0x22,
    GATE_STATE: 0x23,
    DETECTION_COUNT: 0x24
  },
  // error messages
  errors: {
    unexpectedPreambleCharacter: 'Expected a preamble, found: '
  }
};

/*
 * @implements EventEmitter
 * @implements Stream.Writable
 * @class RTCMParser
 */
module.exports = class LapRFParser extends Stream.Writable {

  constructor() {

    super();

    this._bytes(internals.SOR_LENGTH, this._detectSOR);
  }
  //
  // // Loops until we find the first preamble.
  //
  _detectSOR(buffer) {

    if (this._isSOR(buffer)) {
      console.log('got SOR');
      //reset message
      this._message = buffer;
      this._bytes(internals.EOR_LENGTH, this._detectEOR);;
      return;
    }

    this._bytes(internals.SOR_LENGTH, this._detectSOR);
  }
  //
  // // Check if the buffer found is a preamble
  //
  _isSOR(buffer) {

    const expected = internals.SOR.toString('hex');
    const actual = buffer.toString('hex');

    return actual === expected;
  }

  _detectEOR(buffer) {

    if (this._isEOR(buffer)) {
      console.log('got EOR, parsing message')
      this._message = Buffer.concat([this._message, buffer])
      this._decodeMessage();
      // this._message.push(buffer);
      this._bytes(internals.SOR_LENGTH, this._detectSOR)
    }
    else {
      process.stdout.write('.')
      this._message = Buffer.concat([this._message, buffer])
      this._bytes(internals.EOR_LENGTH, this._detectEOR)
    }
  }

  _isEOR(buffer) {

    const expected = internals.EOR.toString('hex');
    const actual = buffer.toString('hex');

    return actual === expected;
  }

  _decodeMessage() {
    console.log('decoding message')
    this._message = this._unescapeBytes(this._message)
    console.log(this._message, this._message.length)
  //
  // console.log(this._message.readUInt8(1).toString(16), this._message.readUInt8(2).toString(16), this._message.readUInt8(3).toString(16), this._message.readUInt8(4).toString(16))
  //
  //   console.log(this._message.readUInt8(1).toString(2), this._message.readUInt8(2).toString(2), this._message.readUInt8(3).toString(2), this._message.readUInt8(4).toString(2))

    const p3 = this._message.readUInt8(3);
    const p4 = this._message.readUInt8(4);

    const p5 = this._message.readUInt8(5);
    const p6 = this._message.readUInt8(6);


    const crc =  p3 | p4 << 8;

    let typeRaw = p5 | p6 << 8;

    // check crc

    console.log(typeRaw, internals.STATUS_RECORD)
    if(typeRaw === internals.STATUS_RECORD) {
        console.log('status')

        let data = this._message.slice(7)

        let signature = data.readUInt8(0)
        let size = data.readUInt8(1)

        console.log(`sig: ${signature}, size: ${size}`)

        switch(signature) {
          case internals.STATUS_FIELDS.SLOT_INDEX:
            console.log('SLOT_INDEX')
          break;
          case internals.STATUS_FIELDS.FLAGS:
            console.log('FLAGS')
          break;
          case internals.STATUS_FIELDS.BATTERY_VOLTAGE:
            console.log('BATTERY_VOLTAGE')

            let voltagemV = data.readUInt16LE(3)
            let batteryVoltage = voltagemV / 1000.0
            console.log('v:',batteryVoltage)

          break;
          case internals.STATUS_FIELDS.LAST_RSSI:
            console.log('LAST_RSSI')
          break;
          case internals.STATUS_FIELDS.GATE_STATE:
            console.log('GATE_STATE')
          break;
          case internals.STATUS_FIELDS.DETECTION_COUNT:
            console.log('DETECTION_COUNT')
          break;
        }
    }

    this._message.writeUInt8(0, 3);
    this._message.writeUInt8(0, 4);

    // console.log('@', this._message)

    //const crc = p3 | p4
    const crc2 = crc16(this._message);
    console.log(`crc: ${crc} - ${crc2}`)

    // let bytes = Buffer.from([
    //         0x5a,0x3d,0x00,0x00,0x00,0x0a,0xda,0x21,
    //         0x02,0x3c,0x0d,0x23,0x01,0x01,0x24,0x04,
    //         0x00,0x00,0x00,0x00,0x01,0x01,0x01,0x22,
    //         0x04,0x00,0x80,0x62,0x44,0x01,0x01,0x02,
    //         0x22,0x04,0x00,0x00,0x62,0x44,0x01,0x01,
    //         0x03,0x22,0x04,0x00,0x80,0x6a,0x44,0x01,
    //         0x01,0x04,0x22,0x04,0x00,0x00,0x62,0x44,
    //         0x03,0x02,0x00,0x00,0x5b
    //     ]);
    //     console.log(crc16(bytes).toString(16))
    //     //== 0x1b53
  }

   _unescapeBytes(bytes) {
      let unescaped = []
      for(const byte of bytes) {
        if (byte == internals.ESC) {
          unescaped.push(byte - internals.ESC_OFFSET)
        }
        else {
          unescaped.push(byte)
        }
      }
      return Buffer.from(unescaped)
    }
    //
    // _escapeBytes (bytes) {
    //   let escaped = []
    //
    //   for (let i = 0; i < bytes.length; i ++) {
    //     const byte = bytes[i]
    //     if ((byte === internals.SOR || byte === internals.EOR || byte === internals.ESC) && i != 0 && i != bytes.length - 1) {
    //       escaped.push(internals.ESC)
    //       escaped.push(byte + internals.ESC_OFFSET)
    //     }
    //     else {
    //       escaped.push(byte)
    //     }
    //
    //     return escaped
    //   }
    //
    //
    //   var escaped: [UInt8] = []
    //   for (i, byte) in bytes.enumerated() {
    //       if (byte == SOR || byte == EOR || byte == ESC) && i != 0 && i != bytes.count - 1 {
    //           escaped.append(ESC)
    //           escaped.append(byte + ESC_OFFSET)
    //       } else {
    //           escaped.append(byte)
    //       }
    //   }
    //   return escaped
    // }

};

StreamParser(module.exports.prototype);
