class Location {

    constructor(tagName, barcode, status) {
        this.TagName = tagName;
        this.Barcode = barcode;
        this.Status = status;
        this.Pallet = null;
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

    getTagName() {
        return this.TagName;
    }

    setPallet(p) {
        this.Pallet = p;
    }

    getPallet() {
        return this.Pallet;
    }

}

module.exports = Location;