
/* (C) 2020 Radical Electronic Systems CC */

const robotserver = require("./robotserver")
const xml = require('xml');
const FORKLIFT_STATES = require("./forkliftstates")

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

        if((typeof rbt.Config.type != 'undefined') && (rbt.Config.type === 'LABELPRINT')){

          console.log("B1: ", rbt.getLabel("B1"));

          data = {
            MAC : mac,
            status : "OK",
            LCD1 : rbt.getLabel("B1").getUserText(),
            LCD2 : rbt.getLabel("B2").getUserText(),
            LCD3 : rbt.getLabel("B3").getUserText(),
            LCD4 : rbt.getLabel("B4").getUserText(),
            green : lg,
            orange : lo,
            red : lr
          }
        }
        else {
          data = {
            MAC : mac,
            status : "OK",
            LCD1 : "Logon Success",
            LCD2 : id,
            LCD3 : "Welcome",
            LCD4 : "John Jo",
            green : lg,
            orange : lo,
            red : lr
          }
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
          status : "OK",
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
    let rbt = null;

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
          status : "OK",
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
    // service a scan
    else if("publishBarcodeScan" in msg) {
      const obj = msg["publishBarcodeScan"];
      const barcode = obj.barcode;
      const id = obj.id;
      let lg = "false";
      let lo = "false";
      let lr = "false";
      mac = obj.MAC;
      rbt = robotserver.getRobot(mac);

      if(rbt) {
        data = {
          MAC : mac,
          status : "OK",
          LCD1 : "RMT Bin tipped successfully",
          LCD2 : "run:795, tipped: 63",
          LCD3 : "farm:24Z, puc:P1027, orch:REP",
          LCD4 : "cult: BI_PR, / WBC",
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


    console.log("SCAN RESP: ", ress);
    res.status(200).json(ress);
  },

  /* Simulate a Label Print application handler */
  label(req, res, next) {
    let msg = req.body;
    let ress = {status : "FAIL"}
    let rbt = null;

    // service a button
    if("publishPrintLabel" in msg) {
      const obj = msg["publishPrintLabel"];
      const id = obj.id;
      const opt = obj.option;
      const ses = obj.session;

      let lg = "false";
      let lo = "false";
      let lr = "true";
      let st = "LOGOFF";
      let usr = "Label Request"
      let prnt = "Not printing..."
      mac = obj.MAC;
      rbt = robotserver.getRobot(mac);
            
      if(rbt) {

        if(id === "0") {
          st = "DENIED"
          usr = "User not logged on"
        }
        else {
          lr = "false";
          const lbl = rbt.getLabel(opt);
          if(typeof lbl !== 'undefined') {
            prnt = "Printing: " + lbl.getButtonText();
            lg = "true"
          }
          else {
            prnt = "Button not implemented!" 
            lo = "true"
          }
        }

        data = {
          MAC : mac,
          status : st,
          LCD1 : usr,
          LCD2 : prnt,
          LCD3 : "Session:",
          LCD4 : ses,
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

    if(!rbt) {
      return next();
    }


    console.log("LABEL PRINT RESP: ", ress);
    res.status(200).json(ress);
  },

  /* Simulate manual forklift transactions */
  forkliftServerState(req, res, next) {
    let msg = req.body;
    let ress = {status : "FAIL"}
    let rbt = null;

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

      if(rbt) {
        if(btn == "B1") {
          rbt.setForkliftState(FORKLIFT_STATES.LOAD_SCAN_PALLET);
        }
        else if(btn == "B2") {
          lo = "true"
        }

        data = {
          MAC : mac,
          status : "OK",
          LCD1 : "Forklift Empty",
          LCD2 : "Please scan a pallet",
          LCD3 : "",
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
    // service a scan
    else if("publishBarcodeScan" in msg) {
      const obj = msg["publishBarcodeScan"];
      const barcode = obj.barcode;
      const id = obj.id;
      let lg = "false";
      let lo = "false";
      let lr = "false";
      mac = obj.MAC;
      rbt = robotserver.getRobot(mac);

      if(rbt) {

        const state = rbt.getForkliftState();

        data = {
          MAC : mac,
          status : "OK",
          LCD1 : "Error state",
          LCD2 : "Reset Robot",
          LCD3 : "",
          LCD4 : "",
          green : lg,
          orange : lo,
          red : lr
        }

        if(state === FORKLIFT_STATES.LOAD_SCAN_PALLET) {

          const pal = robotserver.findPallet(barcode);

          if(pal) {
            lg = "true"
            data = {
              MAC : mac,
              status : "OK",
              LCD1 : "Please Scan location",
              LCD2 : "",
              LCD3 : "",
              LCD4 : "Press [1] to Reset",
              green : lg,
              orange : lo,
              red : lr
            }

            rbt.setPallet(pal);
            rbt.setForkliftState(FORKLIFT_STATES.LOAD_SCAN_LOCATION);
          }
          else {
            lr = "true"
            data = {
              MAC : mac,
              status : "OK",
              LCD1 : "Pallet does not exist",
              LCD2 : "Please scan again",
              LCD3 : "",
              LCD4 : "",
              green : lg,
              orange : lo,
              red : lr
            }
          }
        }
        else if(state === FORKLIFT_STATES.LOAD_SCAN_LOCATION) {

          const pal = rbt.getPallet();
          const loc = robotserver.findLocation(barcode);

          if(loc) {
            lg = "true"
            data = {
              MAC : mac,
              status : "OK",
              LCD1 : "Forklift Loaded!",
              LCD2 : "Pallet: " + pal.getBarcode(),
              LCD3 : "Location: " + loc.TagName,
              LCD4 : "Press [1] to Reset",
              green : lg,
              orange : lo,
              red : lr
            }

            rbt.setForkliftState(FORKLIFT_STATES.TRANSIT);
          }
          else {
            lr = "true"
            data = {
              MAC : mac,
              status : "OK",
              LCD1 : "Location not found!",
              LCD2 : "Please scan again",
              LCD3 : "",
              LCD4 : "Press [1] to Reset",
              green : lg,
              orange : lo,
              red : lr
            }
          }

        }
        else if(state === FORKLIFT_STATES.TRANSIT) {

          const pal = rbt.getPallet();

          if(pal) {

            if(pal.getBarcode() === barcode) {
              lg = "true"
              data = {
                MAC : mac,
                status : "OK",
                LCD1 : "Scan destination",
                LCD2 : "Pallet: " + pal.getBarcode(),
                LCD3 : "",
                LCD4 : "Press [1] to Reset",
                green : lg,
                orange : lo,
                red : lr
              }

              rbt.setForkliftState(FORKLIFT_STATES.UNLOAD_SCANNED_PALLET);
            }
            else {
              lo = "true"

              data = {
                MAC : mac,
                status : "OK",
                LCD1 : "Pallet barcode do not match",
                LCD2 : "Scan Pallet barcode again",
                LCD3 : "",
                LCD4 : "Press [1] to Reset",
                green : lg,
                orange : lo,
                red : lr
              }
            }
          }
          else {
            lr = "true"
            data = {
              MAC : mac,
              status : "OK",
              LCD1 : "Pallet not found!",
              LCD2 : "Please scan again",
              LCD3 : "",
              LCD4 : "Press [1] to Reset",
              green : lg,
              orange : lo,
              red : lr
            }
          }

        }
        else if(state === FORKLIFT_STATES.UNLOAD_SCANNED_PALLET) {

          const pal = rbt.getPallet();
          const loc = robotserver.findLocation(barcode);

          console

          if(loc) {

            lg = "true"
            data = {
              MAC : mac,
              status : "OK",
              LCD1 : "Pallet stored!",
              LCD2 : "Ready for next pallet",
              LCD3 : "",
              LCD4 : "",
              green : lg,
              orange : lo,
              red : lr
            }

            rbt.setForkliftState(FORKLIFT_STATES.LOAD_SCAN_PALLET);
          }
          else {
            lr = "true"
            data = {
              MAC : mac,
              status : "OK",
              LCD1 : "Location not found!",
              LCD2 : "Please scan again",
              LCD3 : "",
              LCD4 : "[1] to Reset",
              green : lg,
              orange : lo,
              red : lr
            }
          }

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
      console.log("FORKLIFT SERVER SIDE STATE: Robot not found: " + mac);
      return next();
    }


    console.log("FORKLIFT SERVER-SIDE-STATE RESP: ", ress);
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
          status : "OK",
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
          status : "OK",
          LCD1 : "Pallet OK",
          LCD2 : barcode,
          LCD3 : "Success",
          LCD4 : id,
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
          status : "OK",
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

          const w = parseFloat(plt.getWeight());
          robotserver.logWeight(barcode, id, plt.getStatus(), plt.getWeight());

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
            status : "OK",
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
          status : "OK",
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

  /* Simulate a forklift application handler 
   * Handler will service new weights, buttons and pallets
   */
  forklift(req, res, next) {
    let msg = req.body;
    let ress = {status : "FAIL"}
    let rbt = null;
    let mac = null;

    if("requestPalletMove" in msg) {
      const obj = msg["requestPalletMove"];
      const barcode = obj.barcode;
      const id = obj.id;
      const session = obj.session;
      const location = obj.location;
      const status = obj.status;

      let lg = "false";
      let lo = "false";
      let lr = "false";
      const plt = robotserver.findPallet(barcode);
      const loc = robotserver.findLocation(location);
      mac = obj.MAC;
      rbt = robotserver.getRobot(mac);

      if((rbt) && (plt)) {
        
        if(loc) {
          robotserver.movePallet(null, loc);
          lg = "true";

          data = {
            MAC : mac,
            status : "OK",
            LCD1 : "Pallet Loaded: " + barcode,
            LCD2 : "Drive safely! Do not look around",
            LCD3 : "Moving from: " + location,
            LCD4 : "Pallet is no on the move!",
            green : lg,
            orange : lo,
            red : lr
          }

          ress = {
            responseStation : data,
          }
        }
        else {
          lo = "true"
          data = {
            MAC : mac,
            status : "OK",
            LCD1 : "Location Not Found",
            LCD2 : "Add Location?",
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
    }
    else if("requestPalletStore" in msg) {
      const obj = msg["requestPalletStore"];
      const barcode = obj.barcode;
      const id = obj.id;
      const session = obj.session;
      const location = obj.location;
      const destination = obj.destination;
      const status = obj.status;

      let lg = "false";
      let lo = "false";
      let lr = "false";
      const plt = robotserver.findPallet(barcode);
      const loc = robotserver.findLocation(destination);
      mac = obj.MAC;
      rbt = robotserver.getRobot(mac);

      if((rbt) && (plt)) {

        if(loc) {
        
          robotserver.movePallet(plt, loc);
          lg = "true";
          data = {
            MAC : mac,
            status : "OK",
            LCD1 : "Pallet Stored!",
            LCD2 : barcode,
            LCD3 : "At Location:",
            LCD4 : destination,
            green : lg,
            orange : lo,
            red : lr,
          }
        }
        else {
          lr = "true";
          data = {
            MAC : mac,
            status : "OK",
            LCD1 : "Pallet Not Stored!",
            LCD2 : barcode,
            LCD3 : "Location not Found:",
            LCD4 : destination,
            green : lg,
            orange : lo,
            red : lr,
          }
        }
        
        ress = {
          responseStation : data,
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

          const w = parseFloat(plt.getWeight());
          robotserver.logWeight(barcode, id, plt.getStatus(), plt.getWeight());

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
            status : "OK",
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
          status : "OK",
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
      console.log("FORKLIFT: Robot not found: " + mac);
      return next();
    }
      
    console.log("FORLIFT RESP: ", ress);
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

        console.log("ROBOT: ", rbt);
        
        if(status == "REQUEST") {

          //make sure we have a valid setup for this robot
          if(rbt) {    

            // SCALE has extra parameters
            if(type == "SOLAS-SCALE") {
              setup = {
                MAC : mac,
                status : "OK",
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
                  status : "OK",
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
                  status : "OK",
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
            robotserver.addRobot(mac, rbt.config, rbt.labels, clientURL);
  
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

    baseGet(req, res, next) {
      const cmd = req.params.command;

      console.log("BASE GET: ", cmd);

      let ress = {
        requestReset : { MAC : "00:00:00:00:00:00" }
      }
  
      if(cmd === "requestPing") {
        const mac = req.query.MAC;
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
      else if(cmd === "publishStatus") {
        const mac = req.query.MAC;
        const rbt = robotserver.getRobot(mac);
  
        if(rbt) {
          if(req.query.status == "READY") {
            rbt.setOnline(req.query.session);
          }
          else {
            rbt.setOffline();
          }
  
          ress = {
            status : "OK",
          }
        }      
      }
      else if(cmd === "publishLogon") {
        const id = req.query.id;
        const mac = req.query.MAC;
        const rbt = robotserver.getRobot(mac);
        let lg = "true";
        let lo = "false";
        let lr = "false";
  
        if(rbt) {

          if((typeof rbt.Config.type != 'undefined') && (rbt.Config.type === 'LABELPRINT')){
            const lbls = rbt.getLabels();
            data = {
              MAC : mac,
              status : "OK",
              LCD1 : lbls[0],
              LCD2 : lbls[1],
              LCD3 : lbls[2],
              LCD4 : lbls[3],
              green : lg,
              orange : lo,
              red : lr
            }
          }
          else {
            data = {
              MAC : mac,
              status : "OK",
              LCD1 : "Logon Success",
              LCD2 : id,
              LCD3 : "Welcome",
              LCD4 : "John Jo",
              green : lg,
              orange : lo,
              red : lr
            }
          }
          
          ress = {
            responseStation : data,
          }
        }
      }
      else if(cmd === "publishLogoff") {
        mac = req.query.MAC;
        const rbt = robotserver.getRobot(mac);
        let lg = "true";
        let lo = "false";
        let lr = "true";
  
        if(rbt) {
  
          data = {
            MAC : mac,
            status : "OK",
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

    setupGet(req, res, next) {
   
      const cmd = req.params.command;
      let ress = {status : "FAIL"}
      let rbt = null;
      let mac = null;
              
      if(cmd === "requestSetup") {
        const type = req.query.type;
        const status = req.query.status;
        const clientURL = req.query.clientURL;
        mac = req.query.MAC;
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

    /* Simulate a terminal application handler */
    termGet(req, res, next) {
      const cmd = req.params.command;
      let ress = {status : "FAIL"};
      let rbt = null;
      let mac = null;

      console.log("TERM GET: ", cmd);

      // service a button
      if(cmd === "publishButton") {
        const barcode = req.query.barcode;
        const id = req.query.id;
        const btn = req.query.button;
        mac = req.query.MAC;

        let lg = "false";
        let lo = "false";
        let lr = "false";
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

      console.log("TERM GET RESP: ", ress);
      res.status(200).json(ress);
    },		 

    /* Simulate a scanner application handler */
  scanGet(req, res, next) {
    const cmd = req.params.command;
    let ress = {status : "FAIL"}
    let rbt = null;

    // service a button
    if(cmd === "publishButton") {
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
    // service a scan
    else if(cmd === "publishBarcodeScan") {

      const barcode = req.query.barcode;
      const id = req.query.id;
      const btn = req.query.button;
      mac = req.query.MAC;
      
      let lg = "false";
      let lo = "false";
      let lr = "false";
      rbt = robotserver.getRobot(mac);

      if(rbt) {
        data = {
          MAC : mac,
          LCD1 : "Barcode Scan OK",
          LCD2 : "",
          LCD3 : "Success",
          LCD4 : "Scan Next",
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


    console.log("SCALE RESP: ", ress);
    res.status(200).json(ress);
  },

  /* Simulate a scale application handler 
   * Handler will service new weights, buttons and pallets
   */
  scaleGet(req, res, next) {
    const cmd = req.params.command;
    let ress = {status : "FAIL"}
    let rbt = null;
    let mac = null;

    if(cmd === "publishScaleWeight") {
      const status = req.query.status;
      const barcode = req.query.barcode;
      const id = req.query.id;
      mac = req.query.MAC;
      const weight = req.query.weight
      const w = parseFloat(weight);

      let lg = "false";
      let lo = "false";
      let lr = "false";
      const plt = robotserver.findPallet(barcode);
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

          const w = parseFloat(plt.getWeight());
          robotserver.logWeight(barcode, id, plt.getStatus(), plt.getWeight());

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
      
    console.log("SCALE GET RESP: ", ress);
    res.status(200).json(ress);
  },

  scaleJMTGet(req, res, next) {

    const barcode = req.query.input1;
    const weight = req.query.productweight
    const w = parseFloat(weight);
    const u = req.query.units;
    const l = req.query.location;

    let lg = "false";
    let lo = "false";
    let lr = "true";
    data = {
      LCD1 : "Pallet not loaded",
      LCD2 : barcode,
      LCD3 : "Failure",
      LCD4 : "",
      Green : lg,
      Orange : lo,
      Red : lr
  }

    ress = {
      PalletWeighing : {
        _attr: data
      }
    }

    console.log("SCALE RESP: ", xml(ress));
    //res.type('application/xml');
    res.status(200).send(xml(ress));
  },

    init() {}
}