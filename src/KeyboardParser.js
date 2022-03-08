export default class KeyboardParser {
  constructor(pressFadeTime = 200, maxDuplicatePresses = 2) {
    this.keysActive = {};
    this.pressFadeTime = pressFadeTime;
    this.maxDuplicatePresses = maxDuplicatePresses;
    document.addEventListener("keydown", (event) => {
      var keys = this.parseCurrentKeyEvent(event);
      this.log(keys, event);
    });
  }

  keys() {
    var keys = [];
    Object.keys(this.keysActive).forEach((key) => {
      var timesPressed = this.keysActive[key].timesPressed;
      for (var i = 0; i < timesPressed; i++) {
        keys.push(key);
      }
    });
    return keys;
  }

  log(keys, keyEvent) {
    keys.forEach((key) => {
      var keyIsInactive = !(key in this.keysActive);
      if (keyIsInactive) {
        this.keysActive[key] = { timesPressed: 1 };
        this.fade(key);
      } else {
        var keyIsBeingHeldDown = keyEvent.repeat;
        var keyAllowsMoreMultiPresses =
          this.keysActive[key].timesPressed < this.maxDuplicatePresses;
        if (!keyIsBeingHeldDown && keyAllowsMoreMultiPresses) {
          this.keysActive[key].timesPressed++;
        }
      }
    });
  }

  fade(key) {
    setTimeout(() => {
      var keyIsActive = key in this.keysActive;
      if (keyIsActive) {
        this.deactivate(key);
      }
    }, this.pressFadeTime);
  }

  deactivate(key) {
    delete this.keysActive[key];
  }

  parseCurrentKeyEvent(event) {
    var mainKey = event.key.toLowerCase();
    var ctrl = event.ctrlKey ? "control" : false;
    var shift = event.shiftKey ? "shift" : false;
    var alt = event.altKey ? "alt" : false;
    var meta = event.metaKey ? "meta" : false;
    switch (mainKey) {
      case ctrl:
      case shift:
      case alt:
      case meta:
        mainKey = false;
        break;
    }
    var currentKeysDown = [mainKey, ctrl, shift, alt, meta].filter((x) => x);
    return currentKeysDown;
  }
}
