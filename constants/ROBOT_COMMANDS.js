const ROBOT_COMMANDS = {
  REQ_SETUP : 'requestSetup',
  REQ_PING : 'requestPing',
  REQ_RPC_LIST : 'requestRpcList',
  REQ_RPC_EXEC : 'requestRpcExecute',
  REQ_RESET : "requestReset",


  PUB_STATUS : 'publishStatus',
  PUB_BUTTON : 'publishButton',
  PUB_LOGON : 'publishLogon',
  PUB_LOGOFF : 'publishLogoff',
  PUB_BARCODE : 'publishBarcodeScan',
  PUB_KEYPAD_CODE : 'publishKeypadCode',
  PUB_PRINT_LABEL : 'publishPrintLabel',
  PUB_SCALE_WEIGHT : 'publishScaleWeight',

};

module.exports = ROBOT_COMMANDS;