
/* (C) 2020 Radical Electronic Systems CC */
class Robot {

    constructor(macAddress, config, url) {
        this.MacAddress = macAddress;
        this.Config = config;        
        this.Url = url;    
        this.Status = "OFFLINE";
    }

    setOnline() {
        this.Status = "ONLINE";
        console.log("ROBOT: " + this.MacAddress + " ONLINE");
    }

    setOffline() {
        this.Status = "OFFLINE";
        console.log("ROBOT: " + this.MacAddress + " OFFLINE");
    }

    getMacAddress() {
        return this.MacAddress;
    }

}

module.exports = Robot;