
const { v4: uuidv4 } = require('uuid');

const { log, logd, loge } = require('../../utils/logger');

const robotConfigList = require('../../config/robots.json');
const palletList = require('../../config/pallets.json');
const locationList = require('../../config/locations.json');
const userList = require('../../config/users.json');

const Pallet = require('../../models/Pallet');
const Location = require('../../models/Location');
const Robot = require('../../models/Robot');
const User = require('../../models/User');

const TAG = "RobotRepository";

class RobotRepository {

  constructor() {

    this.RobotList = [];
    this.PalletList = palletList.pallets.map((p) => new Pallet(p, 0, 0));
    this.LocationList = locationList.locations.map((l) => new Location(l.tagName, l.barcode, 0));
    this.UserList = userList.users.map((u) => new User(u.username, u.code));

  }

  findConfigByMacAddress(macAddress) {
    return robotConfigList.robots.find((r) => r.macAddress === macAddress);
  }

  findConfigByMacAddressAndType(macAddress, type) {
    return robotConfigList.robots.find((r) => r.macAddress === macAddress && r.type === type)
  }

  addRobot(macAddress, config, labels, rpcList, url) {
    const r = new Robot(macAddress, config, labels, rpcList, url);
    robotRepository.RobotList.push(r);
    return r;
  }

  getRobot(macAddress) {

    // some command append :0A or :0B for station position identification
    if(macAddress.length > 16) {
      macAddress = macAddress.slice(0,17);
    }

    return this.RobotList.find((r) => r.getMacAddress() === macAddress );
  }

  findPallet(barcode) {
    return this.PalletList.find((p) => p.getBarcode() === barcode );
  }

  findLocation(barcode) {
    return this.LocationList.find((l) => l.getBarcode() === barcode );
  }

  findUser(code) {
    const usr = this.UserList.find((u) => u.getCode() === code);

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
    this.PalletList.push(p);
    return p;
  }

  getNewSession() {
    return uuidv4();
  }

}

let robotRepository = Object.freeze(new RobotRepository());
module.exports = robotRepository;