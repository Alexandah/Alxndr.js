import DOMHopper from "./DOMHopper.js";
import InputLanguage from "./InputLanguage.js";
import KeyboardParser from "./KeyboardParser.js";
import { addNode } from "./helpers.js";

//First, parse to add onClick functions via classes
//we must do this bc chrome hates inline js execution
Array.from(document.querySelectorAll(".alertOnLeftClick")).forEach((node) => {
  node.onclick = () => {
    alert("YEET!");
  };
});

Array.from(document.querySelectorAll(".alertOnRightClick")).forEach((node) => {
  node.oncontextmenu = () => {
    alert("YOU HAVE RIGHT CLICKED");
  };
});

//to make book mark divs
var li = document.createElement("li");
li.setAttribute("noHop", "");
var img = document.createElement("img");
img.setAttribute("height", "16");
img.setAttribute("width", "16");
img.setAttribute("src", "");
img.setAttribute("noHop", "");
addNode(img, li);
var a = document.createElement("");

//Now, set up the DOMHopper
var domHopper = new DOMHopper();

const UP = "k";
const DOWN = "j";
const LEFT = "h";
const RIGHT = "l";
const PRIMARY_CLICK = " ";
const SECONDARY_CLICK = "enter";
const INC = "shift";
const DEC = "control";
const ESC = "escape";
const COPY = "c";
const FIND = "f";
const R0 = "0";
const R1 = "1";
const R2 = "2";
const R3 = "3";
const R4 = "4";
const R5 = "5";
const R6 = "6";
const R7 = "7";
const R8 = "8";
const R9 = "9";
const REGISTERS = [R0, R1, R2, R3, R4, R5, R6, R7, R8, R9];
const DEBUG = "alt";

const TOKEN_ALLOWS_DUPLICATES = {
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

const DEFAULT_MODE = "DefaultMode";
const EDITING_MODE = "EditingMode";
const SEARCH_MODE = "SearchMode";

//CONTROL SETTINGS
var controls = new InputLanguage([
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
  SEARCH_MODE,
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
controls.defWord([DEFAULT_MODE, FIND], () => domHopper.enterSearchMode());

//DEBUG CONTROL AREA
// controls.defWord([DEFAULT_MODE, DEBUG], () => {
//   if (domHopper.leapMode) domHopper.exitLeapMode();
//   else domHopper.enterLeapMode();
// });

//EDITOR MODE
controls.defWord([EDITING_MODE, ESC], () => domHopper.exitEditingMode());

//SEARCH MODE
controls.defWord([SEARCH_MODE, ESC], () => domHopper.exitSearchMode());
controls.defWord([SEARCH_MODE, EDITING_MODE, ESC], () =>
  domHopper.exitSearchMode()
);
controls.defWord([SEARCH_MODE, SECONDARY_CLICK], () => domHopper.acceptMatch());
controls.defWord([SEARCH_MODE, EDITING_MODE, SECONDARY_CLICK], () =>
  domHopper.acceptMatch()
);
controls.defWord([SEARCH_MODE, UP], () => domHopper.jumpUp());
controls.defWord([SEARCH_MODE, DOWN], () => domHopper.jumpDown());
controls.defWord([SEARCH_MODE, RIGHT], () => domHopper.jumpRight());
controls.defWord([SEARCH_MODE, LEFT], () => domHopper.jumpLeft());
controls.defWord([SEARCH_MODE, INC], () => domHopper.moveSelectionLvlUp());
controls.defWord([SEARCH_MODE, DEC], () => domHopper.moveSelectionLvlDown());

//MODE SETTINGS
var modeSettingsControls = new InputLanguage([DEFAULT_MODE, EDITING_MODE]);
modeSettingsControls.defWord([DEFAULT_MODE], (event) => {
  event.preventDefault();
});
modeSettingsControls.defWord([EDITING_MODE], () => {});
modeSettingsControls.defWord([SEARCH_MODE], (event) => {
  event.preventDefault();
});
modeSettingsControls.defWord([SEARCH_MODE, EDITING_MODE], () => {});

//MAIN INPUT PARSER
var keyboardParser = new KeyboardParser();
function parseRawInputIntoControlLanguage() {
  var editingMode = domHopper.editingMode ? EDITING_MODE : false;
  var searchMode = domHopper.searchMode ? SEARCH_MODE : false;
  var defaultMode = !editingMode && !searchMode ? DEFAULT_MODE : false;
  var modes = [defaultMode, editingMode, searchMode];
  var keys = keyboardParser.keys();
  const removeUnwantedDuplicates = (list) => {
    var seen = {};
    return list.filter((item) => {
      var key = item;
      if (TOKEN_ALLOWS_DUPLICATES[key]) {
        return true;
      }
      if (seen[key]) {
        return false;
      }
      seen[key] = true;
      return true;
    });
  };
  keys = removeUnwantedDuplicates(keys);
  var tokens = [...keys, ...modes];
  return tokens.filter((x) => x);
}

//MAIN INPUT LISTENER
document.addEventListener("keydown", (event) => {
  var controlLanguageTokens = parseRawInputIntoControlLanguage();
  modeSettingsControls.read(controlLanguageTokens, [event]);
  controls.read(controlLanguageTokens);
});

console.log("Initialized DOMHopper Demo");
