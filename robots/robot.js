/* (C) 2020 Radical Electronic Systems CC */

const FORKLIFT_STATES = require("./forkliftstates")
const Label = require("./label")

class Robot {

    constructor(macAddress, config, labels, url) {
        this.MacAddress = macAddress;
        this.Config = config;        
        this.Url = url;    
        this.Status = "OFFLINE";
        this.Session = null;
        this.ForkLiftState = FORKLIFT_STATES.LOAD_SCAN_PALLET;
        this.Pallet = null;
        this.Labels = labels?.map((l, i) => {
            const e = Object.entries(l)[0];
            return new Label(i + "tag:" + e[0], e[0], e[1]);
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