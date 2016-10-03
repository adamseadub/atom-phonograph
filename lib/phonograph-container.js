'use babel';

export default class PhonographContainer {
  constructor(state) {
     this.data = state;
     this.element = document.createElement('div');
     this.element.classList.add('phonograph-container');
   }

  css(props) {
    Array.prototype.forEach.call(Object.keys(props), (prop) => {
      this.element.style[prop] = props[prop];
    });
  }

  serialize() {
    return {
      data: this.data,
    };
  }

  destroy() {
    this.element.remove();
  }

  getElement() {
    return this.element;
  }
}
