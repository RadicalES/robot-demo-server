const BaseResponse = require('./BaseReponse');

class StationResponse extends BaseResponse {

  constructor(mac, status, lcd1, lcd2, lcd3, lcd4, greenLED, orangeLED, redLED) {
    super(mac, status, lcd1, lcd2, lcd3, lcd4, greenLED, orangeLED, redLED);
  }

  getResponse() {
    return {
      responseStation : {
        MAC : this.MAC,
        status : this.Status,
        LCD1 : this.LCD1,
        LCD2 : this.LCD2,
        LCD3 : this.LCD3,
        LCD4 : this.LCD4,
        green : this.GreenLED,
        orange : this.OrangeLED,
        red : this.RedLED
      }
    }
  }

}

module.exports = StationResponse;