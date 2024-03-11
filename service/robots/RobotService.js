
const { log, logd, loge } = require('../../utils/logger');
const ApiError = require('../../errors/ApiError');
const ROBOT_COMMANDS = require('../../constants/ROBOT_COMMANDS');
const ROBOT_APP_TYPES = require('../../constants/ROBOT_APP_TYPES');
const ROBOT_STATUS_CODES = require('../../constants/ROBOT_STATUS_CODES');
const ROBOT_API_TYPES = require('../../constants/ROBOT_API_TYPES');
const ROBOT_BUTTONS = require('../../constants/ROBOT_BUTTONS');
const StationResponse = require('../../models/StationReponse');
const robotRepository = require('../../repository/robots/RobotRepository');

const TAG = "RobotService";

class RobotService {

  constructor() {
  }

  processSetup(data) {
    
    logd(TAG, 'processSetup', data);
    
    const mac = data.MAC;
    const type = data.type;
    const status = data.status;
    const clientUrl = data.clientUrl;
    let resp = null;

    if(status === ROBOT_STATUS_CODES.STATUS_REQUEST) {
      const rbt = robotRepository.findConfigByMacAddress(mac);

      if(rbt) {

        logd(TAG, "Found setup for Robot:\nSTART>>>\n", rbt);
        logd(TAG, "END>>>\n");

        let respData = null;

        // Robot supply its type as definitive
        if(type === ROBOT_APP_TYPES.APP_TYPE_SCALE) {
          respData = {
            MAC : mac,
            status : ROBOT_STATUS_CODES.STATUS_OK,
            lowLimit : rbt.config.lowLimit,
            highLimit : rbt.config.highLimit,
            units : rbt.config.units,
            name : rbt.tagName,
            security : "OPEN",
            protocol : ROBOT_API_TYPES.API_TYPE_ROBOT,
            message : rbt.message,
            session : robotRepository.getNewSession(),
            serverURL : rbt.config.serverURL
          }
        }
        else if(type === ROBOT_APP_TYPES.APP_TYPE_AUTO) {
          respData = {
            MAC : mac,
            status : ROBOT_STATUS_CODES.STATUS_OK,
            name : rbt.tagName,
            security : "OPEN",
            message : rbt.message,
            type : rbt.config.type,
            protocol : ROBOT_API_TYPES.API_TYPE_ROBOT,
            session : robotRepository.getNewSession(),
            serverURL : rbt.config.serverURL
          }
        
        }
        else {
          // application profile should be fixed
          if (typeof rbt.config.type === 'undefined') {
            respData = {
              MAC : mac,
              status : ROBOT_STATUS_CODES.STATUS_OK,
              name : rbt.tagName,
              security : "OPEN",
              message : rbt.message,
              session : robotRepository.getNewSession(),
              serverURL : rbt.config.serverURL
            }
          }
          else { 
            // Simulate a setup when the robot is set to auto profile
            // and we determine the robot application via the setup response
            respData = {
              MAC : mac,
              status : ROBOT_STATUS_CODES.STATUS_OK,
              name : rbt.tagName,
              security : "OPEN",
              message : rbt.message,
              type : rbt.config.type,
              protocol : ROBOT_API_TYPES.API_TYPE_ROBOT,
              session : robotRepository.getNewSession(),
              serverURL : rbt.config.serverURL
            }
          }
        }
        
        resp = { responseSetup : respData };

        robotRepository.addRobot(mac, rbt.config, rbt.labels, rbt.rpcList, clientUrl);  
      }
    }

    return resp;
  }

  processStatus(data) {
    logd(TAG, 'processStatus', data);
      
    const mac = data.MAC;
    const type = data.type;
    const status = data.status;
    const clientUrl = data.clientUrl;
    
    return { MAC : mac, status: "OK"}

  }

    
  processPing(data) {
    logd(TAG, 'processPing', data);
      
    const mac = data.MAC;
    const type = data.type;
    const status = data.status;
    const clientUrl = data.clientUrl;
    let resp = null;

    return {
      responsePong : {
        MAC : mac
      }
    }


  }


  /*
  
   barcode: '1123123',
  id: '',
  MAC: '00:60:35:24:42:85',
  session: '577fda72-5963-40db-b861-40b1a914caab',
  value: 'B1'
  
  
  */
  processButton(data) {
    
    logd(TAG, 'processButton', data);
    
    const mac = data.MAC;
    const rbt = robotRepository.getRobot(mac);
    const barcode = data.barcode;
    const id = data.id;
    const btn = data.button;
    let lg = "false";
    let lo = "false";
    let lr = "false";
    let resp = null;

    if(rbt) {

      logd(TAG, "Robot OK");

      if(btn === ROBOT_BUTTONS.BUTTON_1) {
        lr = "true"
      }
      else if(btn === ROBOT_BUTTONS.BUTTON_2) {
        lo = "true"
      }
      else if(btn === ROBOT_BUTTONS.BUTTON_3) {
        lg = "true"
      }
      else if(btn === ROBOT_BUTTONS.BUTTON_4) {
        lg = "true"
        lr = "true"
      }
      else if(btn === ROBOT_BUTTONS.BUTTON_5) {
        lg = "true"
        lo = "true"
      }

      const res = new StationResponse(mac, ROBOT_STATUS_CODES.STATUS_OK, 
            "Button Pressed", btn, "Success", "Press next button", lr, lo, lg);
      
      // logd(TAG, "Robot RESP", res);

      resp = res.getResponse();
    }

    return resp;
  }

  processBarcode(data) {
    
    logd(TAG, 'processBarcode', data);
    
    const mac = data.MAC;
    const barcode = data.barcode;
    const id = data.id;

    const res = new StationResponse(mac, ROBOT_STATUS_CODES.STATUS_OK, 
      "Scan received!", barcode, id, "Scan next", "true", "true", "false");

    return res.getResponse();

  }

  processScaleWeight(data) {
    
    logd(TAG, 'processScaleWeight', data);
    
    const mac = data.MAC;
    const type = data.type;
    const status = data.status;
    const clientUrl = data.clientUrl;
    let resp = null;




  }

  processKeypadCode(data) {
    
    logd(TAG, 'processKeypadCode', data);
    
    const mac = data.MAC;
    const type = data.type;
    const status = data.status;
    const clientUrl = data.clientUrl;
    let resp = null;




  }

  processPrintLabel(data) {
    
    logd(TAG, 'processPrintLabel', data);
    
    const mac = data.MAC;
    const type = data.type;
    const status = data.status;
    const clientUrl = data.clientUrl;
    let resp = null;




  }

  processLogon(data) {
    
    logd(TAG, 'processLogon', data);
    
    const mac = data.MAC;
    const id = data.id;
    const status = data.status;
    const session = data.session;
    let resp = null;

    const res = new StationResponse(mac, ROBOT_STATUS_CODES.STATUS_OK, 
      "User Logged On: " + id, "Session: " + session, "", "", "true", "false", "false");

    return res.getResponse();
  }

  processLogoff(data) {
    
    logd(TAG, 'processLogoff', data);
    
    const mac = data.MAC;
    const status = data.status;
    const session = data.session;
    let resp = null;

    const res = new StationResponse(mac, ROBOT_STATUS_CODES.STATUS_OK, 
      "User Logged Off" , "Session: " + session, "", "", "true", "false", "false");

    return res.getResponse();
  }

  processPalletStore(data) {
    
    logd(TAG, 'processPalletStore', data);
    
    const mac = data.MAC;
    const status = data.status;
    const dest = data.destination;
    const loc = data.location;
    const session = data.session;
    const barcode = data.barcode;
    const id = data.id;
    const rbt = robotRepository.getRobot(mac);
    let resp = null;

    const res = new StationResponse(mac, ROBOT_STATUS_CODES.STATUS_OK, 
      "Pallet Stored: " + barcode, "From: " + loc, "To: " + dest, "By: " + id, "true", "false", "false");

    return res.getResponse();
  }



  getRpcList(data) {
    logd(TAG, 'getRpcList', data);
    
    const mac = data.MAC;
    const rbt = robotRepository.getRobot(mac);
    let resp = null;

    if(rbt) {
      resp = {
        responseRpcList : rbt.getRpcList()
      }
    }

    return resp;
  }




  // simply ask the robot to reset
  getErrorResponse() {
    return {
      requestReset : {
        MAC : "00:00:00:00:00:00"
      }
    }
  }


  
}

let robotService = Object.freeze(new RobotService());

const robotServiceProcessor = (payload) => {
  const command = Object.keys(payload)[0];
  const data = Object.values(payload)[0];
  let resMsg = null;

  logd(TAG, "robotServiceProcessor: command = " + command + " | data =", data);

  switch(command) {

    case ROBOT_COMMANDS.REQ_SETUP:
      resMsg = robotService.processSetup(data);
      break;

    case ROBOT_COMMANDS.REQ_PING:
      resMsg = robotService.processPing(data);
      break;

    case ROBOT_COMMANDS.REQ_RESET:
      resMsg = robotService.getErrorResponse(data);
      break;

    case ROBOT_COMMANDS.REQ_RPC_LIST:
      resMsg = robotService.getRpcList(data);
      break;

    case ROBOT_COMMANDS.PUB_STATUS:
      resMsg = robotService.processStatus(data);
      break;

    case ROBOT_COMMANDS.PUB_BUTTON:
      resMsg = robotService.processButton(data);
      break;

    case ROBOT_COMMANDS.PUB_BARCODE:
      resMsg = robotService.processBarcode(data);
      break;

    case ROBOT_COMMANDS.PUB_SCALE_WEIGHT:
      resMsg = robotService.processScaleWeight(data);
      break;

    case ROBOT_COMMANDS.PUB_LOGON:
      resMsg = robotService.processLogon(data);
      break;

    case ROBOT_COMMANDS.PUB_LOGOFF:
      resMsg = robotService.processLogoff(data);
      break;

    case ROBOT_COMMANDS.PUB_KEYPAD_CODE:
      resMsg = robotService.processKeypadCode(data);
      break;

    case ROBOT_COMMANDS.PUB_PRINT_LABEL:
      resMsg = robotService.processPrintLabel(data);
      break;

    case ROBOT_COMMANDS.PUB_PALLET_STORE:
      resMsg = robotService.processPalletStore(data);
      break;

  }

  logd(TAG, "robotServiceProcessor::RESPONSE\nSTART>>>\n", resMsg);
  logd(TAG, "END>>>")

  return resMsg;
}  

module.exports = robotServiceProcessor;