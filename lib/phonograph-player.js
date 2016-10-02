'use babel';

import Actions from './phonograph-actions';

export default class PhonographPlayer {
  constructor() {
    const buttonBar = document.createElement('div');
    const trackData = document.createElement('div');

    this.element = document.createElement('div');
    this.artwork = document.createElement('canvas');
    this.style = document.createElement('style');
    this.allControls = document.createElement('div');
    this.track = document.createElement('p');
    this.artist = document.createElement('p');
    this.duration = document.createElement('progress');
    
    this.style.setAttribute('type', 'text/css');
    this.artwork.setAttribute('width', 200);
    this.artwork.setAttribute('height', 200);

    this.artwork.classList.add('pg-artwork');
    this.artwork.classList.add('pg-empty');
    this.element.classList.add('pg-player');
    this.allControls.classList.add('pg-all-controls');
    this.allControls.classList.add('all');
    this.artist.classList.add('artist');
    this.track.classList.add('track');
    this.duration.classList.add('pg-duration');
    buttonBar.classList.add('pg-button-bar');    
    trackData.classList.add('pg-track-data');
    
    ['pg-prev', 'pg-play', 'pg-next'].forEach(button => this.createButton(button, buttonBar));
    ['pg-close', 'pg-collapse'].forEach(button => this.createButton(button, this.element));
    
    trackData.appendChild(this.artist);
    trackData.appendChild(this.track);

    this.allControls.appendChild(buttonBar);
    this.allControls.appendChild(trackData);
    this.allControls.appendChild(this.duration);
    
    this.element.appendChild(this.style);    
    this.element.appendChild(this.artwork);
    this.element.appendChild(this.allControls);
  }
  init(name) {
    this.name = name;
  }
  createButton(className, appendTo) {
    const name = className.replace('pg-', '');
    const button = this[name] = document.createElement('button');
    button.classList.add(className);
    appendTo.appendChild(button);
  }
  registerEventHandlers() {
    Object.keys(Actions).forEach((action) => {
      const element = this.element.querySelector(`.pg-${action}`);
      console.log(element)
      if(element) {
        element.addEventListener('click', Actions[action].bind(this, element));
      }
    })
  }
  getElement() {
    return this.element;
  }
  artist() {
    return this.element.querySelector('.artist');
  }
  track() {
    return this.element.querySelector('.track');
  }
  destroy() {
    if(this.element.parentNode){
      this.element.parentNode.removeChild(this.element);  
      delete this;
    }
  }
}