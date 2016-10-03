'use babel';

import path from 'path';
import childProcess from 'child_process';
import fs from 'fs';
import color from 'color';
import ContainerView from './phonograph-container';
import PlayerView from './phonograph-player';
import Players from './players.json';
import ColorThief from './color-thief-fork';

const colorThief = new ColorThief();

const Phonograph = {
  activate() {
    const workspace = global.atom.views.getView(global.atom.workspace);
    this.container = new ContainerView();
    this.players = {};

    for (let i = 0; i < Players.length; i += 1) {
      const player = Players[i];
      const name = player.name;
      const p = {
        name,
        command: Players[name],
        view: new PlayerView({ name }),
      };
      p.view.element.classList.add(name);
      this.players[name] = p;
    }
    workspace.appendChild(this.container.getElement());
    this.getStatus();
    this.reposition();
    window.addEventListener('resize', this.reposition.bind(this));
    return this.container;
  },
  reposition() {
    const active = global.atom.workspace.getActivePaneItem();
    this.container.css({
      top: `${active.getHeight()}px`,
      transform: 'translateY(-100%)',
    });
    if (active.activeItem && active.activeItem.hasClass('settings-view')) {
      this.container.css({
        display: 'none',
      });
    } else {
      this.container.css({
        display: 'block',
      });
    }
  },
  crossfade(result, source, target, length, context, factor) {
    factor = factor || 1;
    cancelAnimationFrame(this.frame);
    for (let i = 0; i < length; i += 4) {
      result.data[i] = source[i] * factor + target[i] * (1 - factor);
      result.data[i + 1] = source[i + 1] * factor + target[i + 1] * (1 - factor);
      result.data[i + 2] = source[i + 2] * factor + target[i + 2] * (1 - factor);
      result.data[i + 3] = 255;
    }
    context.putImageData(result, 0, 0);
    if (factor > 0) {
      this.frame = requestAnimationFrame(
        this.crossfade.bind(this, result, source, target, length, context, factor - 0.01)
      );
    }
  },
  updateArtwork(player) {
    const self = this;
    childProcess.exec(`osascript ${path.join(__dirname, '..', 'applescript', `update_art_${player.name.toLowerCase()}.scpt`)}`,
      (error) => {
        const tmp = path.join(__dirname, '..', '.tmp');
        if (!fs.existsSync(tmp)) fs.mkdirSync(tmp);
        const filePath = path.join(__dirname, '..', '.tmp', `${player.name.toLowerCase()}.png`);
        let file = null;
        if (error) return;

        if (fs.existsSync(filePath)) {
          file = fs.readFileSync(filePath);
          const canvas = player.view.artwork,
              ctx = canvas.getContext('2d'),
              image = new Image();
          let buffer = player.buffer;
          if (!buffer) {
            buffer = player.view.buffer = document.createElement('canvas');
            buffer.width = 200;
            buffer.height = 200;
          }

          image.src = `data:image/png;base64,${file.toString('base64')}`;
          image.onload = () => {
            const size = 200,
                  context = buffer.getContext('2d'),
                  result = context.createImageData(size, size),
                  source = ctx.getImageData(0, 0, size, size).data,
                  length = 4 * size * size,
                  bgImage = new Image(),
                  centerImage = new Image(),
                  half = size / 2,
                  border = 10,
                  scaledSize = size / 2;

            context.drawImage(image, 0, 0, scaledSize, scaledSize);
            context.clearRect(0, 0, scaledSize, border);
            context.clearRect(0, 0, border, scaledSize);
            context.clearRect(0, scaledSize - border, border, scaledSize);
            context.clearRect(scaledSize - border, 0, scaledSize, border);
            const centerBuffer = buffer.toDataURL();

            context.clearRect(0, 0, size, size);
            context.drawImage(image, -half, -half, size, size * image.height / image.width);
            context.drawImage(image, half, -half, size, size * image.height / image.width);
            context.drawImage(image, -half, half - 1, size, size * image.height / image.width);
            context.drawImage(image, half, half - 1, size, size * image.height / image.width);

            const a = 98, b = size - a;
            context.clearRect(0, 0, a, a);
            context.clearRect(b, 0, a, a);
            context.clearRect(0, b, a, a);
            context.clearRect(b, b, a, a);
            bgImage.src = buffer.toDataURL();

            context.drawImage(image, 0, 0, size, size * image.height / image.width);
            const target = context.getImageData(0, 0, size, size).data;
            self.crossfade.call(self, result, source, target, length, ctx);

            bgImage.onload = () => {
              centerImage.src = centerBuffer;
              centerImage.onload = () => {
                const bgPalette = self.getPalette(bgImage);
                const bgColor = bgPalette[4];
                const fgColors = self.getPalette(centerImage, bgColor);

                player.view.style.innerHTML = `.${player.name} progress::-webkit-progress-value{ background-color: rgb(${fgColors[2].join(',')}); }`;
                player.view.style.innerHTML += `.${player.name} progress::-webkit-progress-bar{ background-color: rgb(${fgColors[3].join(',')}); }`;
                player.view.style.innerHTML += `.${player.name} button { color: rgb(${fgColors[0].join(',')}); background-color: rgb(${bgColor.join(',')}); }`;
                player.view.style.innerHTML += `.${player.name} .all button { color: rgb(${bgColor.join(',')}); background-color: rgb(${fgColors[1].join(',')}); }`;
                player.view.style.innerHTML += `.${player.name} { border-color: rgba(${fgColors[0].join(',')}, 0.25); color: rgb(${fgColors[0].join(',')}); background-color: rgb(${bgColor.join(',')});  }`;
              };
            };
          };
        }
    });
  },
  getPalette(image, avoidColor) {
    let palette = colorThief.getPalette(image, 10, 1);

    const avgDistances = {};
    palette.forEach((a) => {
      let acc = 0;
      palette.forEach((b) => {
        acc += this.getColorDistance(a, b);
      });
      avgDistances[a.join(',')] = { d: acc / palette.length };
    });
    palette = palette.sort((a, b) => avgDistances[b.join(',')].d - avgDistances[a.join(',')].d);

    if (avoidColor) {
      let filtered = 0,
          returnValue;
      palette = palette.filter((a, i, arr) => {
        if (this.getColorDistance(a, avoidColor) < 15 && arr.length - filtered > 4) {
          filtered += 1;
          returnValue = false;
        } else {
          returnValue = true;
        }
        return returnValue;
      });
    }

    if (avoidColor && color().rgb(palette[0]).contrast(color().rgb(avoidColor)) < 10) {
      const yiq = ((avoidColor[0] * 299) + (avoidColor[1] * 587) + (avoidColor[2] * 114)) / 1000;
      palette.unshift(yiq >= 120 ? [0, 0, 0] : [255, 255, 255]);
    }

    return palette;
  },
  updatePlayer(event, data) {
    const player = data.player;
    const changed = {
      track: player.lastState.track !== player.state.track,
      status: player.lastState.status !== player.state.status,
      album: player.lastState.album !== player.state.album,
      artist: player.lastState.artist !== player.state.artist,
    };
    if (player.state.status === 'closed') {
      player.view.destroy();
      return;
    }

    if (player.view.getElement().parentNode !== this.container.getElement()) {
      this.container.getElement().appendChild(player.view.getElement());
      player.view.init(player.name);
      player.view.registerEventHandlers();
      changed.track = true;
    }

    if (player.view.artwork.classList.contains('pg-empty')) {
      player.view.artwork.classList.remove('pg-empty');
      changed.track = true;
    }

    if (changed.track) {
      const trackName = player.state.track.length > 22 ? `${player.state.track.substring(0, 22)}&hellip;` : player.state.track;
      this.updateArtwork(player);
      player.view.track.innerHTML = trackName;
    }

    if (changed.artist) {
      player.view.artist.innerHTML = player.state.artist;
    }

    if (changed.status || player.state.status === 'closed') {
      player.view.element.className = '';
      player.view.element.classList.add('pg-player');
      player.view.element.classList.add(player.name);
      player.view.element.classList.add(`pg-${player.state.status}`);
    }
    player.view.duration.value = player.state.position;
    player.view.duration.setAttribute('max', player.state.duration);
  },
  getStatus() {
    clearTimeout(this.timeout);
    childProcess.exec(`osascript ${path.join(__dirname, '..', 'applescript', 'trackinfo.scpt')}`, this.parseTrackInfo.bind(this));
  },
  parseTrackInfo(error, stdout) {
    let players = {};
    if (!error) {
      players = {};

      try {
        players = JSON.parse(stdout.trim().replace(/([^{}:,\w()"]"|"[^{}:,\w()"])/gi, '\\"'));
      } catch (e) {
        try {
          players = JSON.parse(stdout.trim());
        } catch (err) {
          console.log('Could not parse JSON: ');
          console.log(e.message);
          console.log(stdout);
        }
      }
      Object.keys(players).forEach((p) => {
        this.players[p].lastState = this.players[p].state || {};
        this.players[p].state = players[p];
        this.updatePlayer('phonograph:update', { player: this.players[p] });
      });
    }
    this.timeout = setTimeout(this.getStatus.bind(this), 900);
  },
  deactivate() {
    return this.phonographView.destroy();
  },
  getColorDistance(a, b) {
    const colors = [a, b], converted = [];
    // Convert both colors from RGB -> XYZ -> LAB
    colors.forEach((rgb) => {
      const lab = [],
          xyz = [];

      rgb.forEach((c) => {
        c /= 255;
        if (c > 0.04045) {
          c = Math.pow(((c + 0.055) / 1.055), 2.4);
        } else {
          c /= 12.92;
        }
        xyz.push(c * 100);
      });

      lab[0] = (xyz[0] * 0.4124 + xyz[1] * 0.3576 + xyz[2] * 0.1805) / 95.047;
      lab[1] = (xyz[0] * 0.2126 + xyz[1] * 0.7152 + xyz[2] * 0.0722) / 100.000;
      lab[2] = (xyz[0] * 0.0193 + xyz[1] * 0.1192 + xyz[2] * 0.9505) / 108.883;

      lab.forEach((c) => {
        if (c > 0.008856) {
          c = Math.pow(c, (1 / 3));
        } else {
         c = (7.787 * c) + (16 / 116);
        }
        return c;
      });

      converted.push({
        l: (116 * lab[1]) - 16,
        a: 500 * (lab[0] - lab[1]),
        b: 200 * (lab[1] - lab[2]),
      });
    });

    // Now that colors are LAB, use CIE1994 algorithm to find
    // color distance.
    const k2 = 0.015,
        k1 = 0.045,
        c1 = Math.sqrt(converted[0].a * converted[0].a + converted[0].b * converted[0].b),
        c2 = Math.sqrt(converted[1].a * converted[1].a + converted[1].b * converted[1].b),
        sh = 1 + k2 * c1,
        sc = 1 + k1 * c1,
        sl = 1,
        da = converted[0].a - converted[1].a,
        db = converted[0].b - converted[1].b,
        dc = c1 - c2,
        dl = converted[0].l - converted[1].l,
        dh = Math.sqrt(da * da + db * db - dc * dc);

    return Math.sqrt(
      Math.pow((dl / (1 * sl)), 2) +
      Math.pow((dc / (1 * sc)), 2) +
      Math.pow((dh / (1 * sh)), 2)
    );
  },
};

export default Phonograph;
