import DOMHopper from "https://cdn.jsdelivr.net/gh/Alexandah/mOuSe_prototype/DOMHopper/src/DOMHopper.js";
import InputLanguage from "https://cdn.jsdelivr.net/gh/Alexandah/mOuSe_prototype/DOMHopper/src/InputLanguage.js";
import KeyboardParser from "https://cdn.jsdelivr.net/gh/Alexandah/mOuSe_prototype/DOMHopper/src/KeyboardParser.js";

window.domHopper = new DOMHopper();

window.UP = "k";
window.DOWN = "j";
window.LEFT = "h";
window.RIGHT = "l";
window.PRIMARY_CLICK = " ";
window.SECONDARY_CLICK = "enter";
window.INC = "shift";
window.DEC = "control";
window.ESC = "escape";
window.COPY = "c";
window.FIND = "f";
window.GRAB = "g";
window.R0 = "0";
window.R1 = "1";
window.R2 = "2";
window.R3 = "3";
window.R4 = "4";
window.R5 = "5";
window.R6 = "6";
window.R7 = "7";
window.R8 = "8";
window.R9 = "9";
window.REGISTERS = [R0, R1, R2, R3, R4, R5, R6, R7, R8, R9];
window.DEBUG = "alt";

window.TOKEN_ALLOWS_DUPLICATES = {
  [UP]: false,
  [DOWN]: false,
  [LEFT]: false,
  [RIGHT]: false,
  [PRIMARY_CLICK]: true,
  [SECONDARY_CLICK]: true,
  [INC]: true,
  [DEC]: true,
  [ESC]: false,
  [COPY]: false,
  [FIND]: false,
  [GRAB]: false,
  [R0]: false,
  [R1]: false,
  [R2]: false,
  [R3]: false,
  [R4]: false,
  [R5]: false,
  [R6]: false,
  [R7]: false,
  [R8]: false,
  [R9]: false,
  [DEBUG]: false,
};

window.DEFAULT_MODE = "DefaultMode";
window.EDITING_MODE = "EditingMode";
window.GRAB_MODE = "GrabMode";

//CONTROL SETTINGS
window.controls = new InputLanguage([
  UP,
  DOWN,
  LEFT,
  RIGHT,
  PRIMARY_CLICK,
  SECONDARY_CLICK,
  INC,
  DEC,
  COPY,
  FIND,
  ...REGISTERS,
  ESC,
  DEFAULT_MODE,
  EDITING_MODE,
  GRAB_MODE,
  DEBUG,
]);

//NAVIGATION MODE
controls.defWord([DEFAULT_MODE, UP], () => domHopper.jumpUp());
controls.defWord([DEFAULT_MODE, DOWN], () => domHopper.jumpDown());
controls.defWord([DEFAULT_MODE, RIGHT], () => domHopper.jumpRight());
controls.defWord([DEFAULT_MODE, LEFT], () => domHopper.jumpLeft());
controls.defWord([DEFAULT_MODE, INC], () => domHopper.moveSelectionLvlUp());
controls.defWord([DEFAULT_MODE, INC, INC], () =>
  domHopper.goToRootSelectionLvl()
);
controls.defWord([DEFAULT_MODE, DEC], () => domHopper.moveSelectionLvlDown());
controls.defWord([DEFAULT_MODE, PRIMARY_CLICK], () => domHopper.primaryClick());
controls.defWord([DEFAULT_MODE, SECONDARY_CLICK], () =>
  domHopper.secondaryClick()
);
REGISTERS.forEach((Ri) =>
  controls.defWord([DEFAULT_MODE, Ri], () =>
    domHopper.jumpToElementInRegister("r" + Ri)
  )
);
REGISTERS.forEach((Ri) =>
  controls.defWord([DEFAULT_MODE, COPY, Ri], () =>
    domHopper.copySelectedToRegister("r" + Ri)
  )
);

//DEBUG CONTROL AREA
// controls.defWord([DEFAULT_MODE, DEBUG], () => {
//   if (domHopper.leapMode) domHopper.exitLeapMode();
//   else domHopper.enterLeapMode();
// });

//EDITOR MODE
controls.defWord([EDITING_MODE, ESC], () => domHopper.exitEditingMode());

//MODE SETTINGS
window.modeSettingsControls = new InputLanguage([DEFAULT_MODE, EDITING_MODE]);
modeSettingsControls.defWord([DEFAULT_MODE], (event) => {
  event.preventDefault();
});
modeSettingsControls.defWord([EDITING_MODE], () => {});

//MAIN INPUT LISTENER
window.keyboardParser = new KeyboardParser();
document.addEventListener("keydown", (event) => {
  var controlLanguageTokens = parseRawInputIntoControlLanguage();
  modeSettingsControls.read(controlLanguageTokens, [event]);
  controls.read(controlLanguageTokens);
});

console.log("Initialized DOMHopper");
