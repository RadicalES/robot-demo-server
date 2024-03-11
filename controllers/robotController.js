
const ROBOT_COMMANDS = require('../constants/ROBOT_COMMANDS');
const robotServiceProcessor = require('../service/robots/RobotService');
const { logd } = require('../utils/logger');

const TAG = "RobotController";

const handleResponse = (res, data) => {
  res.status(200).send(data);
}

const handleError = (res, err) => {
  const status = err?.status ?? 500;
  const message = err?.message ?? "Unknown error";
  res.status(status).json({ status: status, message: message});
}

const robotCntrlPreProcess = (req, res, next) => {

  // make sure we have a MAC address
  const payload = Object.values(req.body)
  if(!Object.keys(payload[0]).find((k) => k === 'MAC')) {
    res.status(400).json({message: "No MAC address in payload"});
  }
  else {
    next();
  }

}


const robotCntrlBaseGet = (req, res, next) => {
  res.json({});
}

// catch all error response
const robotCntrlError = (req, res, next) => {

  try {
    const payload = req.body;
    const resMsg = robotServiceProcessor({requestReset : { MAC : '00:00:00:00:00:00' }}, res, next);
    handleResponse(res, resMsg);
  }
  catch(error) {
    // error occured while handling the message
    handleError(error);
  }

}

const robotCntrlSetupPost = (req, res, next) => {

  try {
    const payload = req.body;
    const resMsg = robotServiceProcessor(payload);
    if(resMsg) {
      logd(TAG, "Setup Post", resMsg)
      handleResponse(res, resMsg);
    }
    else {
      // message not supported or not interpreted!
      next();
    }
  }
  catch(error) {
    // server error, error occured while handling the message
    handleError(res, error);
  }

}

const robotCntrlSetupGet = (req, res, next) => {
  res.json({});
}

const robotCntrlScanPost = (req, res, next) => {
  try {
    const payload = req.body;
    const resMsg = robotServiceProcessor(payload);
    if(resMsg) {
      handleResponse(res, resMsg);
    }
    else {
      // message not supported or not interpreted!
      next();
    }
  }
  catch(error) {
    // server error, error occured while handling the message
    handleError(res, error);
  }
}

const robotCntrlScanGet = (req, res, next) => {
  res.json({});
}

const robotCntrlLabelPost = (req, res, next) => {
  try {
    const payload = req.body;
    const resMsg = robotServiceProcessor(payload);
    if(resMsg) {
      handleResponse(res, resMsg);
    }
    else {
      // message not supported or not interpreted!
      next();
    }
  }
  catch(error) {
    // server error, error occured while handling the message
    handleError(res, error);
  }
}

const robotCntrlLabelGet = (req, res, next) => {
  res.json({});
}

const robotCntrlTerminalPost = (req, res, next) => {
  try {
    const payload = req.body;
    const resMsg = robotServiceProcessor(payload);
    if(resMsg) {
      handleResponse(res, resMsg);
    }
    else {
      // message not supported or not interpreted!
      next();
    }
  }
  catch(error) {
    // server error, error occured while handling the message
    handleError(res, error);
  }
}

const robotCntrlTerminalGet = (req, res, next) => {
  res.json({});
}

const robotCntrlScalePost = (req, res, next) => {
  res.json({});
}

const robotCntrlScaleGet = (req, res, next) => {
  res.json({});
}

const robotCntrlForkliftSvrStatePost = (req, res, next) => {
  res.json({});
}

const robotCntrlForkliftPost = (req, res, next) => {
  try {
    const payload = req.body;
    const resMsg = robotServiceProcessor(payload);
    if(resMsg) {
      logd(TAG, "Forklift Post", resMsg)
      handleResponse(res, resMsg);
    }
    else {
      // message not supported or not interpreted!
      next();
    }
  }
  catch(error) {
    // server error, error occured while handling the message
    handleError(res, error);
  }
}

const robotCntrlBootUrl = (req, res, next) => {
  try {
    const payload = req.body;
    const resMsg = robotServiceProcessor(payload);
    if(resMsg) {
      handleResponse(res, resMsg);
    }
    else {
      // message not supported or not interpreted!
      next();
    }
  }
  catch(error) {
    // server error, error occured while handling the message
    handleError(res, error);
  }
}


module.exports = {
  robotCntrlPreProcess,
  robotCntrlBaseGet,
  robotCntrlSetupPost,
  robotCntrlSetupGet,
  robotCntrlScanPost,
  robotCntrlScanGet,
  robotCntrlLabelPost,
  robotCntrlLabelGet,
  robotCntrlTerminalPost,
  robotCntrlTerminalGet,
  robotCntrlScalePost,
  robotCntrlScaleGet,
  robotCntrlForkliftPost,
  robotCntrlForkliftSvrStatePost,
  robotCntrlBootUrl,
  robotCntrlError
}



