class BaseResponse {

  constructor(mac, status, lcd1, lcd2, lcd3, lcd4, greenLED, orangeLED, redLED) {
    this.MAC = mac;
    this.Status = status;
    this.LCD1 = lcd1;
    this.LCD2 = lcd2;
    this.LCD3 = lcd3;
    this.LCD4 = lcd4;
    this.GreenLED = greenLED;
    this.OrangeLED = orangeLED;
    this.RedLED = redLED;
  }

  getResponse() {
    return null;
  }

}

module.exports = BaseResponse;