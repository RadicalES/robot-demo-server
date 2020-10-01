
/* (C) 2020 Radical Electronic Systems CC */

const robotserver = require("./robotserver")

module.exports = {
		 
    scale(req, res) {
        let m = req.body;
        let ress = {status : "FAIL"}

        console.log("SCALE REQ: ", m);

        if("publishScaleWeight" in m) {
            const reqs = m["publishScaleWeight"];
            const mac = reqs.MAC;
            const status = reqs.status;
            const barcode = reqs.barcode;
            const id = reqs.id;
            const weight = reqs.weight
            const w = parseFloat(weight);
            const r = robotserver.getRobot(mac);
            let lg = "false";
            let lo = "false";
            let lr = "false";
            const p = robotserver.findPallet(barcode);

            if((r) && (p)) {
              robotserver.logWeight(barcode, id, status, weight);

              if(w < 900) {
                lr = "true"
              }
              else if(w < 1000) {
                lo = "true"
              }
              else {
                lg = "true"
              }

              data = {
                MAC : mac,
                LCD1 : "Pallet OK",
                LCD2 : barcode,
                LCD3 : "Success",
                LCD4 : "",
                green : lg,
                orange : lo,
                red : lr
              }
              
              ress = {
                responseStation : data,
              }
            }
            else if(r) {
              lo = "true"
              let p = robotserver.addPallet(barcode);
              p.setWeight(weight);
              p.setStatus(status);
              data = {
                MAC : mac,
                LCD1 : "Pallet Not Found",
                LCD2 : "Add Pallet?",
                LCD3 : "[1] Add to database",
                LCD4 : "[2] Return",
                green : lg,
                orange : lo,
                red : lr
              }
              
              ress = {
                responseUser : data,
              }
            }
            else {
              console.log("Robot not found: " + mac);
              // send reset
              ress = {
                requestReset : {
                  MAC : mac
                },
              }
            }
        }
        else if("requestPing" in m) {
          const reqs = m["requestPing"];
          const mac = reqs.MAC;
          data = {
            status : "OK",
            MAC : mac
          }

          ress = {
            responsePong : data,
          }
        }
        else if("publishStatus" in m) {
          const pubs = m["publishStatus"];
          const mac = pubs.MAC;
          const r = robotserver.getRobot(mac);

          if(r) {
            if(pubs.status == "READY") {
              r.setOnline();
            }
            else {
              r.setOffline();
            }
            ress = {
              status : "OK",
            }
          }          
        }
        else if("publishButton" in m) {
          const reqs = m["publishButton"];
          const mac = reqs.MAC;
          const barcode = reqs.barcode;
          const id = reqs.id;
          const btn = reqs.button;
          const r = robotserver.getRobot(mac);
          let lg = "false";
          let lo = "false";
          let lr = "false";
          const p = robotserver.findPallet(barcode);

          if(btn == "B1") {
            if((r) && (p)) {

              const w = parseFloat(p.getWeight());
              robotserver.logWeight(barcode, id, p.getStatus(), p.getWeight());

              if(w < 900) {
                lr = "true"
              }
              else if(w < 1000) {
                lo = "true"
              }
              else {
                lg = "true"
              }

              data = {
                MAC : mac,
                LCD1 : "Pallet OK",
                LCD2 : barcode,
                LCD3 : "Success",
                LCD4 : "",
                green : lg,
                orange : lo,
                red : lr
              }
              
              ress = {
                responseStation : data,
              }
            }
          }          
          else {
            lr = "true"
            lo = "true"
            lg = "true"
            data = {
              MAC : mac,
              LCD1 : "Pallet not loaded",
              LCD2 : barcode,
              LCD3 : "Failure",
              LCD4 : "",
              green : lg,
              orange : lo,
              red : lr
            }
            
            ress = {
              responseStation : data,
            }
          }

          if(!p) {
            console.log("Pallet not found: " + barcode);
          }

          if(!r) {
            console.log("Robot not found: " + mac);
          }
        }
        else if("publishLogon" in m) {
          const reqs = m["publishLogon"];
          const mac = reqs.MAC;
          const id = reqs.id;
          const r = robotserver.getRobot(mac);
          let lg = "true";
          let lo = "false";
          let lr = "false";

          if(r) {
            data = {
              MAC : mac,
              LCD1 : "Logon Success",
              LCD2 : id,
              LCD3 : "Welcome",
              LCD4 : "John Jo",
              green : lg,
              orange : lo,
              red : lr
            }
            
            ress = {
              responseStation : data,
            }
          }
        }
        else if("publishLogoff" in m) {
          const reqs = m["publishLogoff"];
          const mac = reqs.MAC;
          const r = robotserver.getRobot(mac);
          let lg = "true";
          let lo = "false";
          let lr = "true";

          if(r) {

            data = {
              MAC : mac,
              LCD1 : "Terminal Logged Out",
              LCD2 : "Log in to",
              LCD3 : "Operate Scale",
              LCD4 : "",
              green : lg,
              orange : lo,
              red : lr
            }
            
            ress = {
              responseStation : data,
            }
          }
        }
        else {
          // command not supproted, send reset
          ress = {
            requestReset : {
              MAC : "00:00:00:00:00:00"
            },
          }
        }
      
        console.log("SCALE RESP: ", ress);
        res.status(200).json(ress);
    },

    setup(req, res) {
        let m = req.body;
        let ress = {status : "FAIL"}

        console.log("SETUP REQ: ", m);
               
        if("requestSetup" in m) {
          const reqs = m["requestSetup"];
          const mac = reqs.MAC;
          const type = reqs.type;
          const status = reqs.status;
          const clientURL = reqs.clientURL; 
          
          if((type == "SOLAS-Scale") && (status == "REQUEST")) {
            const rbt = robotserver.findConfigByMacAddress(mac);
            if(rbt) {    
              setup = {
                MAC : mac,
                lowLimit : rbt.config.lowLimit,
                highLimit : rbt.config.highLimit,
                units : rbt.config.units,
                name : rbt.tagName,
                security : "OPEN",
                message : rbt.message,
                serverURL : rbt.config.serverURL
              }

              robotserver.addRobot(mac, rbt.config, clientURL);
    
              ress = {
                responseSetup : setup
              }
            }
            else {
              console.log("Robot not found: " + mac);
            }
          }    
        }
        
        console.log("SETUP RESP: ", ress);
        res.status(200).json(ress);
      },

    init() {}
}