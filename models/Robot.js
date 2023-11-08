
const { log, logd, loge } = require('../utils/logger');

const FORKLIST_STATES = require('./FORKLIST_STATES');
const Label = require('./Label');

const TAG = "RobotObject";

class Robot {


  constructor(macAddress, config, labels, url) {
    this.MacAddress = macAddress;
    this.Config = config;
    this.Url = url;
    this.Status = "OFFLINE";
    this.Session = null;
    this.ForkliftState = FORKLIST_STATES.LOAD_SCAN_PALLET;
    this.Pallet = null;
    this.Labels = labels?.map((l, i) => {
      const k = Object.keys(l)[0];
      const v = Object.values(l)[0];
      return new Label(i + "tag: " + k, k);
    });
  }

  setOnline(session) {
    this.Status = "ONLINE";
    this.Session = session;
    console.log("ROBOT: " + this.MacAddress + " Session: " + this.Session + " - ONLINE");
  }

  setOffline() {
      this.Status = "OFFLINE";
      this.Session = null;
      console.log("ROBOT: " + this.MacAddress + " OFFLINE");
  }

  getMacAddress() {
      return this.MacAddress;
  }

  getSession() {
      return this.Session;
  }

  getLabels() {
      return this.Labels;
  }

  getLabel(button) {
      return this.Labels.find((l) =>  { 
          return l.getButton() === button });
  }

  getForkliftState() {
      return this.ForkLiftState;
  }

  setForkliftState(state) {
      this.ForkLiftState = state;
  }

  getPallet() {
      return this.Pallet;
  }

  setPallet(pallet) {
      this.Pallet = pallet;
  }


}

module.exports = Robot;