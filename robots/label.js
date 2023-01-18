class Label {

    constructor(tagName, button, text) {
        this.TagName = tagName;
        this.Button = button;
        this.Text = text;
    }

    getButton() {
         return this.Button;
    }

    getButtonText() {
        return this.Text;
    } 

    getUserText() {
        return this.Button + " : " + this.Text;
    }
}

module.exports = Label;