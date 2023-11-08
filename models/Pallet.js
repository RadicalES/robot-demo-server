
class Pallet {

  constructor(barcode, weight, status) {
    this.Barcode = barcode;
    this.Weight = weight;
    this.Status = status;
  }


 setWeight(weight) {
        this.Weight = weight;
  }

  getWeight() {
      return this.Weight;
  }

  getBarcode() {
      return this.Barcode;
  }

  getStatus() {
      return this.Status;
  }
  
  setStatus(status) {
      this.Status = status;
  }

}

module.exports = Pallet;