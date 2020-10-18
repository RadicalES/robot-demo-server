
/* (C) 2020 Radical Electronic Systems CC */

class Robot {

    constructor(macAddress, config, url) {
        this.MacAddress = macAddress;
        this.Config = config;        
        this.Url = url;    
        this.Status = "OFFLINE";
        this.Session = null;
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

}

module.exports = Robot;