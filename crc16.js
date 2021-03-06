const {crc16 } = require('crc')

const data = Buffer.from([0x5a, 0x3d,
               0x00,0x00,0x00,0x0a,0xda,0x21,0x02,
               0x3c,0x0d,0x23,0x01,0x01,0x24,0x04,
               0x00,0x00,0x00,0x00,0x01,0x01,0x01,
               0x22,0x04,0x00,0x80,0x62,0x44,0x01,
               0x01,
               0x02,0x22,0x04,0x00,0x00,0x62,0x44,
               0x01,0x01,0x03,0x22,0x04,0x00,0x80,
               0x6a,
               0x44,0x01,0x01,0x04,0x22,0x04,0x00,
               0x00,0x62,0x44,0x03,0x02,0x00,0x00,
               0x5b]);

console.log(crc16(data).toString(16));
