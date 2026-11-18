// SOLMAR HEAT — Input Management
export class Input {
  constructor() {
    this.keys = {};
    this.pressedKeys = {};
    this.mouse = { x: 0, y: 0, worldX: 0, worldY: 0, down: false, clicked: false };

    window.addEventListener('keydown', (e) => {
      if (!this.keys[e.code]) {
        this.pressedKeys[e.code] = true;
      }
      this.keys[e.code] = true;
      if (['Space', 'KeyW', 'KeyS', 'KeyA', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        // Prevent default browser scrolling
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    window.addEventListener('mousedown', (e) => {
      this.mouse.down = true;
      this.mouse.clicked = true;
    });

    window.addEventListener('mouseup', (e) => {
      this.mouse.down = false;
    });
  }

  isDown(code) {
    return !!this.keys[code];
  }

  consumePressed(code) {
    const val = !!this.pressedKeys[code];
    this.pressedKeys[code] = false;
    return val;
  }

  consumeClick() {
    const val = this.mouse.clicked;
    this.mouse.clicked = false;
    return val;
  }
}
