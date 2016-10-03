const childProcess = require('child_process'),
      command = "osascript -e 'tell application \"%%A%%\" to %%C%%'";

module.exports = {
  prev() {
    let c = command.replace('%%A%%', this.name);
    if (this.element.querySelector('progress').value < 5) {
      c = c.replace('%%C%%', 'previous track');
    } else {
      c = c.replace('%%C%%', 'set player position to 0');
    }

    childProcess.exec(c, () => {});
  },
  next() {
    const c = command.replace('%%A%%', this.name).replace('%%C%%', 'next track');
    childProcess.exec(c, () => {});
  },
  play() {
    let c = command.replace('%%A%%', this.name);
    if (!this.element.classList.contains('pg-playing')) {
      c = c.replace('%%C%%', 'play');
    } else {
      c = c.replace('%%C%%', 'pause');
    }
    childProcess.exec(c, () => { });
  },
  duration(el, e) {
    const rect = el.getBoundingClientRect(),
      percent = e.offsetX / rect.width,
      time = percent * e.target.max,
      c = command.replace('%%A%%', this.name).replace('%%C%%', `set player position to ${time}`);
    childProcess.exec(c, () => {});
  },
  collapse() {
    this.element.classList.toggle('pg-collapsed');
  },
  close() {
    const c = command.replace('%%A%%', this.name).replace('%%C%%', 'quit');
    childProcess.exec(c, () => {});
  },
};
