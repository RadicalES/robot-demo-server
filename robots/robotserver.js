/* (C) 2020 Radical Electronic Systems CC */

const moment = require('moment-timezone');
const config = require('../config.json');
const robot = require('./robot');
const pallet = require('./pallet');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvWriter = createCsvWriter({
  path: 'solas.csv',
  header: [
      {id: 'Barcode', title: 'Pallet Barcode'},
      {id: 'TimeStamp', title: 'Time Stamp'},
      {id: 'UserID', title: 'User ID'},
      {id: 'Status', title: 'Status'},
      {id: 'Weight', title: 'Weight'}
  ]
});

class RobotServer {

  constructor() {  
    this.robots = [];
    this.pallets = [];

    for(let c in config.pallets) {
      const b = config.pallets[c];
      let p = new pallet(b, 0.0);
      this.pallets.push(p);
    }

  }

  findConfigByMacAddress(macAddress) {

    for(let c in config.robots) {
      let r = config.robots[c];
      if(r.macAddress == macAddress) {
        return r;
      }
    }

    return null;
  }

  findPallet(barcode) {

    for(let c in robotserver.pallets) {
      let p = robotserver.pallets[c];
      if(p.getBarcode() == barcode) {
        return p;
      }
    }

    return null;
  }

  addPallet(barcode) {
    let p = new pallet(barcode, 0.0);
    this.pallets.push(p);
    return p;
  }

  addRobot(macAddress, config, url) {
    let r = new robot(macAddress, config, url);
    robotserver.robots.push(r);
    return r;
  }

  getRobot(macAddress) {
    
    for(let c in robotserver.robots) {
      let r = robotserver.robots[c];
      if(r.getMacAddress() == macAddress) {
        return r;
      }
    }

    console.log("ROBOT SERVER: cannot find: " + macAddress);
    return null;
  }

  logWeight(barcode, userid, status, weight) {
    const ts = moment().tz('Africa/Johannesburg').format('YYYY-MM-DD hh:mm:ss');
    const rec = [
      {
        Barcode : barcode,
        TimeStamp : ts,
        UserID : userid,
        Status : status,
        Weight : weight
      }
    ]

    csvWriter.writeRecords(rec)
  }

}

var robotserver = new RobotServer();
module.exports = robotserver;