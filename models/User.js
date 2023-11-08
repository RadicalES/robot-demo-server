/* (C) 2020 Radical Electronic Systems CC */
class User {

  constructor(name, code) {
      this.Name = name;
      this.Code = code;        
  }

  setName(name) {
      this.Name = name;
  }

  getName() {
      return this.Name;
  }

  getCode() {
      return this.Code;
  }

}

module.exports = User;