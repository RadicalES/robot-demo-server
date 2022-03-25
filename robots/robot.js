/* (C) 2020 Radical Electronic Systems CC */

const FORKLIFT_STATES = require("./forkliftstates")

class Robot {

    constructor(macAddress, config, url) {
        this.MacAddress = macAddress;
        this.Config = config;        
        this.Url = url;    
        this.Status = "OFFLINE";
        this.Session = null;
        this.ForkLiftState = FORKLIFT_STATES.LOAD_SCAN_PALLET;
        this.Pallet = null;
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