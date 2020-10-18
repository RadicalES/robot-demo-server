
/* (C) 2020 Radical Electronic Systems CC */

const robotserver = require("./robotserver")

module.exports = {

  // general packets are serviced in the base handler
  // take care of common packets like Ping, Logon, Logoff & Status
  base(req, res, next) {
    let msg = req.body;
    let ress = {
      requestReset : { MAC : "00:00:00:00:00:00" }
    }

    console.log("REQUEST: ", msg);

    if("requestPing" in msg) {
      const obj = msg["requestPing"];
      const mac = obj.MAC;      
      const rbt = robotserver.getRobot(mac);

      if(rbt) {
        data = {
          status : "OK",
          MAC : mac
        }
  
        ress = {
          responsePong : data,
        }
      }
    }
    else if("publishStatus" in msg) {
      const obj = msg["publishStatus"];
      const mac = obj.MAC;
      const rbt = robotserver.getRobot(mac);

      if(rbt) {
        if(obj.status == "READY") {
          rbt.setOnline(obj.session);
        }
        else {
          rbt.setOffline();
        }

        ress = {
          status : "OK",
        }
      }      
    }
    else if("publishLogon" in msg) {
      const obj = msg["publishLogon"];
      const mac = obj.MAC;
      const id = obj.id;
      const rbt = robotserver.getRobot(mac);
      let lg = "true";
      let lo = "false";
      let lr = "false";

      if(rbt) {
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
    else if("publishLogoff" in msg) {
      const obj = msg["publishLogoff"];
      const mac = obj.MAC;
      const rbt = robotserver.getRobot(mac);
      let lg = "true";
      let lo = "false";
      let lr = "true";

      if(rbt) {

        data = {
          MAC : mac,
          LCD1 : "Terminal Logged Out",
          LCD2 : "Log in to",
          LCD3 : "Operate Robot",
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
      return next();
    }

    console.log("BASE RESPONSE: ", ress);
    res.status(200).json(ress);
  },
  
  /* Last handler, we cannot service this Robot, tell it to reset itself */
  error(req, res) {
    const hdr = req.headers;
    
    if((req.method == "POST") && (hdr['user-agent'] === 'Robot-T201')) {

      // command not supported, send reset
      ress = {
        requestReset : {
          MAC : "00:00:00:00:00:00"
        },
      }
      console.log("ERROR RESPONSE: ", ress);
      res.status(200).json(ress);
    }    
  },

  /* Simulate a scanner application handler */
  scan(req, res, next) {
    let msg = req.body;
    let ress = {status : "FAIL"}
    console.log("SCALE RESP: ", ress);
    res.status(200).json(ress);
  },

  /* Simulate a terminal application handler */
  term(req, res, next) {
    let msg = req.body;
    let ress = {status : "FAIL"};
    let rbt = null;
    let mac = null;

    // service a button
    if("publishButton" in msg) {
      const obj = msg["publishButton"];
      const barcode = obj.barcode;
      const id = obj.id;
      const btn = obj.button;
      let lg = "false";
      let lo = "false";
      let lr = "false";
      mac = obj.MAC;
      rbt = robotserver.getRobot(mac);

      if(btn == "B1") {
        lr = "true"
      }
      else if(btn == "B2") {
        lo = "true"
      }
      else if(btn == "B3") {
        lg = "true"
      }
      else if(btn == "B4") {
        lg = "true"
        lr = "true"
      }
      else if(btn == "B5") {
        lg = "true"
        lo = "true"
      }
      
      if(rbt) {
        data = {
          MAC : mac,
          LCD1 : "Button Pressed",
          LCD2 : btn,
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
      return next();
    }   
  
    // if robot not found, let the error handler service it
    if(!rbt) {
      console.log("TERM: Robot not found: " + mac);
      return next();
    }

    console.log("TERM RESP: ", ress);
    res.status(200).json(ress);
  },		 

  /* Simulate a scale application handler 
   * Handler will service new weights, buttons and pallets
   */
  scale(req, res, next) {
    let msg = req.body;
    let ress = {status : "FAIL"}
    let rbt = null;
    let mac = null;

    if("publishScaleWeight" in msg) {
      const obj = msg["publishScaleWeight"];
      const status = obj.status;
      const barcode = obj.barcode;
      const id = obj.id;
      const weight = obj.weight
      const w = parseFloat(weight);
      let lg = "false";
      let lo = "false";
      let lr = "false";
      const plt = robotserver.findPallet(barcode);
      mac = obj.MAC;
      rbt = robotserver.getRobot(mac);

      if((rbt) && (plt)) {
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
      else if(rbt) {
        lo = "true"
        let plt = robotserver.addPallet(barcode);
        plt.setWeight(weight);
        plt.setStatus(status);
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
    }
    else if("publishButton" in msg) {
      const obj = msg["publishButton"];
      const barcode = obj.barcode;
      const id = obj.id;
      const btn = obj.button;
      let lg = "false";
      let lo = "false";
      let lr = "false";
      const plt = robotserver.findPallet(barcode);
      mac = obj.MAC;
      rbt = robotserver.getRobot(mac);

      if(btn == "B1") {
        if((rbt) && (plt)) {

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

      if(!plt) {
        console.log("SCALE: Pallet not found: " + barcode);
      }     
    }
    else {
      return next();
    }

    if(!rbt) {
      console.log("SCALE: Robot not found: " + mac);
      return next();
    }
      
    console.log("SCALE RESP: ", ress);
    res.status(200).json(ress);
  },

  setup(req, res, next) {
      let msg = req.body;
      let ress = {status : "FAIL"}
      let rbt = null;
      let mac = null;
              
      if("requestSetup" in msg) {
        const obj = msg["requestSetup"];
        const type = obj.type;
        const status = obj.status;
        const clientURL = obj.clientURL; 
        mac = obj.MAC;
        rbt = robotserver.findConfigByMacAddressAndType(mac, type);
        
        if(status == "REQUEST") {

          //make sure we have a valid setup for this robot
          if(rbt) {    

            // SCALE has extra parameters
            if(type == "SOLAS-SCALE") {
              setup = {
                MAC : mac,
                lowLimit : rbt.config.lowLimit,
                highLimit : rbt.config.highLimit,
                units : rbt.config.units,
                name : rbt.tagName,
                security : "OPEN",
                message : rbt.message,
                session : robotserver.getNewSession(),
                serverURL : rbt.config.serverURL
              }
            }
            else {

              // application profile should be fixed
              if (typeof rbt.config.type === 'undefined') {
                setup = {
                  MAC : mac,
                  name : rbt.tagName,
                  security : "OPEN",
                  message : rbt.message,
                  session : robotserver.getNewSession(),
                  serverURL : rbt.config.serverURL
                }
              }
              else { 
                // Simulate a setup when the robot is set to auto profile
                // and we determine the robot application via the setup response
                setup = {
                  MAC : mac,
                  name : rbt.tagName,
                  security : "OPEN",
                  message : rbt.message,
                  type : rbt.config.type,
                  session : robotserver.getNewSession(),
                  serverURL : rbt.config.serverURL
                }
              }
            }

            // save the robot to the server list
            robotserver.addRobot(mac, rbt.config, clientURL);
  
            // build response packet
            ress = {
              responseSetup : setup
            }
          }
        }    
      }
      else {
        return next();
      }
      
      if(!rbt) {
        console.log("SETUP: Robot not found: " + mac);
        return next();
      }

      console.log("SETUP RESPONSE: ", ress);
      res.status(200).json(ress);
    },

    init() {}
}