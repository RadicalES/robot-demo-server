/* (C) 2020 Radical Electronic Systems CC */

const moment = require('moment-timezone');
const config = require('../config.json');
const { v4: uuidv4 } = require('uuid');
const Robot = require('./robot');
const Pallet = require('./pallet');
const Location = require('./location');
const User = require('./user')

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
    this.RobotList = [];
    this.PalletList = config.pallets.map((p) => new Pallet(p, 0.0));
    this.LocationList = config.locations.map((l) => new Location(l.tagName, l.barcode, 0));
    this.UserList = config.users.map((u) => new User(u.username, u.code));
  }

  findConfigByMacAddress(macAddress) {
    return config.robots.find((r) => r.macAddress === macAddress);
  }

  findConfigByMacAddressAndType(macAddress, type) {
    return config.robots.find((r) => r.macAddress === macAddress && r.type === type)
  }

  findPallet(barcode) {
    return robotserver.PalletList.find((p) => p.getBarcode() === barcode );
  }

  findLocation(barcode) {
    return robotserver.LocationList.find((l) => l.getBarcode() === barcode );
  }

  findUser(code) {
    let usr = robotserver.UserList.find((u) => u.getCode() === code);

    console.log("USer: ", usr);

    if(!usr) {
      usr = new User("Unknown user", code);
      this.UserList.push(usr);
    }

    return usr;
  }

  movePallet(pallet, location) {
    if(location.getPallet() == null) {
      location.setPallet(pallet);
    }
  }

  addPallet(barcode) {
    let p = new Pallet(barcode, 0.0);
    this.pallets.push(p);
    return p;
  }

  addRobot(macAddress, config, labels, url) {
    let r = new Robot(macAddress, config, labels, url);
    robotserver.RobotList.push(r);
    return r;
  }

  getRobot(macAddress) {

    // some command append :0A or :0B for station position identification
    if(macAddress.length > 16) {
      macAddress = macAddress.slice(0,17);
    }

    return robotserver.RobotList.find((r) => r.getMacAddress() === macAddress );
  }

  getNewSession() {
    return uuidv4();
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