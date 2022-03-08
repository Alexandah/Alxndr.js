import {
  getTag,
  isEditable,
  isLink,
  leftClick,
  rightClick,
  ctrlLeftClick,
  traverseDOMSubtree,
  getScreenPos,
  isSemantic,
  isTextNode,
  isElement,
  makeInput,
  removeNode,
  getRandomInt,
  getDOMPath,
} from "./helpers.js";
import {
  ORANGE_OUTLINE_COLOR,
  GREEN_OUTLINE_COLOR,
  PROHIBIT_SELECTION,
  ALPHABET,
} from "./constants.js";
import Stickynote from "./Stickynote.js";

const SELECTED_BORDER = "9px solid " + ORANGE_OUTLINE_COLOR;
const SEARCH_HIGHLIGHT_BORDER = "1px solid " + GREEN_OUTLINE_COLOR;

const CAN_LVL_DESCEND_TO_NON_DESCENDANTS = false;

export default class DOMHopper {
  constructor() {
    this.root = getTag("body");
    this.selected = this.root;
    this.selected.style.outline = SELECTED_BORDER;
    this.selectedDOMLvl = 0;
    this.lastSelectedChildOfElement = {};
    this.editingMode = false;
    this.searchMode = false;
    this.searchMatches = [];
    this.registers = {
      r0: null,
      r1: null,
      r2: null,
      r3: null,
      r4: null,
      r5: null,
      r6: null,
      r7: null,
      r8: null,
      r9: null,
    };
    this.isSelectable = this.isSelectableDefault;
  }

  isSelectableDefault(node) {
    if (node === null) return false;
    if (isElement(node))
      if (node.hasAttribute(PROHIBIT_SELECTION)) return false;
    if (isSemantic(node)) return true;
    if (node.hasChildNodes()) {
      var qualifyingChildren = Array.from(node.childNodes).filter(
        (node) => isSemantic(node) || isTextNode(node)
      );
      var hasQualifyingChildren = qualifyingChildren.length > 0;
      return hasQualifyingChildren;
    }
    return false;
  }

  isSelectableSearch(node) {
    return this.searchMatches.includes(node);
  }

  isSelectableLeap(node) {
    if (isElement(node))
      if (node.hasAttribute(PROHIBIT_SELECTION)) return false;
    if (isSemantic(node.parentNode)) return false;
    if (isSemantic(node)) return true;
    return false;
  }

  distanceFromRoot(node) {
    if (node === null) return 0;
    if (node === undefined) return 0;
    if (node === this.root) return 0;
    else {
      var x = this.isSelectable(node) ? 1 : 0;
      return x + this.distanceFromRoot(node.parentNode);
    }
  }

  traverseSelectableNodesSubtree(node, func) {
    traverseDOMSubtree(node, func, this.isSelectable);
  }

  getDOMLvlElements(lvl) {
    var selectedDOMLvlElements = [];
    const grabIfOnSelectedDOMLvl = (node) => {
      if (node === null) return;
      if (this.distanceFromRoot(node) == lvl) selectedDOMLvlElements.push(node);
    };
    this.traverseSelectableNodesSubtree(this.root, grabIfOnSelectedDOMLvl);
    return selectedDOMLvlElements;
  }

  getSelectedDOMLvlElements() {
    if (this.selectedDOMLvl == null) return null;
    return this.getDOMLvlElements(this.selectedDOMLvl);
  }

  //Makes impossible that qualitatively identical elements
  //will be mistaken as numerically identical
  //NOTE: This may act up when handling some dynamic webpages
  getUniqueElementKey(element) {
    const uniqueKey = getDOMPath(element);
    return uniqueKey;
  }
  markElementAsLastSelectedChild(element) {
    const proxyParent = this.getNearestSelectableAncestor(element);
    const uniqueKey = this.getUniqueElementKey(proxyParent);
    this.lastSelectedChildOfElement[uniqueKey] = element;
  }
  getLastSelectedChild(parent) {
    const uniqueKey = this.getUniqueElementKey(parent);
    if (uniqueKey in this.lastSelectedChildOfElement)
      return this.lastSelectedChildOfElement[uniqueKey];
    else return null;
  }

  setSelected(element) {
    if (element == null) return;
    if (element == undefined) return;
    if (element.style.outline == SEARCH_HIGHLIGHT_BORDER)
      element.oldOutline = SEARCH_HIGHLIGHT_BORDER;
    else element.oldOutline = 0;
    if (this.selected != null)
      if ("oldOutline" in this.selected)
        this.selected.style.outline = this.selected.oldOutline;
      else this.selected.style.outline = 0;
    element.style.outline = SELECTED_BORDER;
    this.selected = element;
    this.selected.scrollIntoView();
    this.markElementAsLastSelectedChild(this.selected);
    console.log(this.selected);
  }

  getElementClosestToSelectedFrom(elements) {
    var closest = null;
    var closestDistance = Infinity;
    elements.forEach((element) => {
      var distance =
        Math.abs(getScreenPos(element).x - getScreenPos(this.selected).x) +
        Math.abs(getScreenPos(element).y - getScreenPos(this.selected).y);
      if (distance < closestDistance) {
        closest = element;
        closestDistance = distance;
      }
    });
    if (closest == null) return this.selected;
    else return closest;
  }

  jump(dirFunc) {
    if (this.editingMode) return;
    if (this.selected != null) {
      var elementsInDir = this.getSelectedDOMLvlElements().filter(dirFunc);
      var jumpTo = this.getElementClosestToSelectedFrom(elementsInDir);
      this.setSelected(jumpTo);
    }
  }
  jumpUp() {
    this.jump(
      (element) => getScreenPos(element).y < getScreenPos(this.selected).y
    );
  }
  jumpDown() {
    this.jump(
      (element) => getScreenPos(element).y > getScreenPos(this.selected).y
    );
  }
  jumpLeft() {
    this.jump(
      (element) => getScreenPos(element).x < getScreenPos(this.selected).x
    );
  }
  jumpRight() {
    this.jump(
      (element) => getScreenPos(element).x > getScreenPos(this.selected).x
    );
  }

  getNearestSelectableAncestor(node) {
    if (node == null) return null;
    var parent = node.parentNode;
    if (this.isSelectable(parent)) return parent;
    return this.getNearestSelectableAncestor(parent);
  }
  getNearestSelectableDescendant(node) {
    if (node == null) return null;
    if (node.hasChildNodes()) {
      var children = node.childNodes;
      for (var i = 0; i < children.length; i++) {
        var child = children[i];
        if (this.isSelectable(child)) return child;
      }

      for (var i = 0; i < children.length; i++) {
        var child = children[i];
        var selectableDescendant = this.getNearestSelectableDescendant(child);
        if (selectableDescendant != null) return selectableDescendant;
      }
    }
    return null;
  }

  moveSelectionLvlUp() {
    if (this.editingMode) return;
    let atTop = this.selected === this.root;
    if (atTop) return;
    this.selectedDOMLvl--;
    var toSelect = this.getNearestSelectableAncestor(this.selected);
    this.setSelected(toSelect);
  }
  moveSelectionLvlDown() {
    if (this.editingMode) return;
    var nextDOMLvlElements = this.getDOMLvlElements(this.selectedDOMLvl + 1);
    var hasNextDOMLvl = nextDOMLvlElements.length > 0;
    if (!hasNextDOMLvl) return;
    this.selectedDOMLvl++;

    var toSelect;
    const lastSelectedChild = this.getLastSelectedChild(this.selected);
    if (lastSelectedChild != null) toSelect = lastSelectedChild;
    else {
      var nearestSelectableDescendant = this.getNearestSelectableDescendant(
        this.selected
      );
      var selectableDescendantIsOnCorrectDOMLvl =
        this.distanceFromRoot(nearestSelectableDescendant) ==
        this.selectedDOMLvl;
      var descendant = selectableDescendantIsOnCorrectDOMLvl
        ? nearestSelectableDescendant
        : CAN_LVL_DESCEND_TO_NON_DESCENDANTS
        ? nextDOMLvlElements[this.selectedDOMLvl]
        : null;
      toSelect = descendant;
    }
    this.setSelected(toSelect);
  }

  goToRootSelectionLvl() {
    if (this.editingMode) return;
    this.selectedDOMLvl = 0;
    this.setSelected(this.root);
  }

  enterEditingMode() {
    this.selected.focus();
    this.editingMode = true;
  }
  exitEditingMode() {
    this.selected.blur();
    this.editingMode = false;
  }

  primaryClick() {
    if (this.selected != null) {
      if (isEditable(this.selected)) {
        this.enterEditingMode();
      }
      leftClick(this.selected);
    }
  }
  secondaryClick() {
    if (this.selected != null) {
      if (isLink(this.selected)) {
        ctrlLeftClick(this.selected);
      } else rightClick(this.selected);
    }
  }

  //REGISTER MANAGER
  copySelectedToRegister(id) {
    if (id in this.registers) {
      if (this.registers[id] != null) this.registers[id].unstick();
      var registerNumber = id[1];
      this.registers[id] = new Stickynote(this.selected, registerNumber);
    }
  }
  jumpToElementInRegister(id) {
    if (!(id in this.registers)) return;
    var element = this.registers[id].stuckOn;
    if (element === undefined) return;
    this.selectedDOMLvl = this.distanceFromRoot(element);
    this.setSelected(element);
  }

  //SEARCH MODE
  enterSearchMode() {
    this.searchMode = true;
    this.openSearchBar();
  }

  openSearchBar() {
    var searchBar = makeInput("text", "Search Bar");
    searchBar.setAttribute("class", "searchBar");
    searchBar.addEventListener("input", (event) => this.searchDOM(event.data));
    this.setSelected(searchBar);
    this.enterEditingMode();
  }
  closeSearchBar() {
    this.exitEditingMode();
    var searchBar = getClass("searchBar")[0];
    removeNode(searchBar);
  }

  turnOnSearchHighlight(element) {
    if (element === this.selected) return;
    element.style.oldOutline = element.style.outline;
    element.style.outline = SEARCH_HIGHLIGHT_BORDER;
  }
  turnOffSearchHighlight(element) {
    if (element === this.selected) return;
    element.style.outline = element.style.oldOutline;
  }

  parseSearchString(string) {
    var terms = string.split(" ");
    const isElementString = (term) =>
      term[0] == "<" && term[term.length - 1] == ">";
    return terms.map((x) => {
      if (isElementString(x))
        return {
          text: x.substring(1, x.length - 1).toUpperCase(),
          isElementTerm: true,
        };
      else return { text: x, isElementTerm: false };
    });
  }

  searchDOM(string) {
    var searchTerms = this.parseSearchString(string);
    this.searchMatches.forEach((element) =>
      this.turnOffSearchHighlight(element)
    );
    this.searchMatches = [];

    this.traverseSelectableNodesSubtree(this.root, (element) => {
      var matchesAllTerms = true;
      for (var i = 0; i < searchTerms.length; i++) {
        var searchTerm = searchTerms[i];
        if (searchTerm.isElementTerm) {
          var isDesiredElement = element.nodeName == searchTerm.text;
          if (!isDesiredElement) {
            matchesAllTerms = false;
            break;
          }
        } else {
          //check for text matches
          var hasTerm = element.innerText.indexOf(searchTerm.text) != -1;
          if (!hasTerm) {
            matchesAllTerms = false;
            break;
          }
        }
      }
      if (matchesAllTerms) this.searchMatches.push(element);
    });

    this.searchMatches.forEach((element) =>
      this.turnOnSearchHighlight(element)
    );
    return this.searchMatches;
  }

  acceptMatch() {
    if (this.editingMode) {
      this.isSelectable = this.isSelectableSearch;
      this.closeSearchBar();
      this.setSelected(this.searchMatches[0]);
    } else this.exitSearchMode();
  }

  exitSearchMode() {
    this.isSelectable = this.isSelectableDefault;
    if (this.editingMode) {
      this.closeSearchBar();
      this.searchMatches.forEach((element) =>
        this.turnOffSearchHighlight(element)
      );
      this.searchMatches = [];
      //todo: change this to be the element selected before search mode
      this.setSelected(this.root);
    } else this.setSelected(this.selected);
    this.searchMode = false;
  }

  //LEAP MODE
  enterLeapMode() {
    this.leapMode = true;
    this.isSelectable = this.isSelectableLeap;
    this.assignKeyCombosToSelectableElements();
  }
  makeKeyCombo() {
    return (
      ALPHABET[getRandomInt(ALPHABET.length)] +
      ALPHABET[getRandomInt(ALPHABET.length)]
    );
  }
  assignKeyCombosToSelectableElements() {
    this.keyCombos = {};
    var stickyNotesMade = 0;
    this.traverseSelectableNodesSubtree(this.root, (element) => {
      do {
        var keycombo = this.makeKeyCombo();
        // console.log("made key combo: ", keycombo);
      } while (keycombo in this.keyCombos);
      // var keycombo = this.makeKeyCombo();
      console.log("made key combo: ", keycombo);
      this.keyCombos[keycombo] = new Stickynote(element, keycombo);
      stickyNotesMade++;
      console.log(stickyNotesMade);
      // console.log("WTF?");
    });
    return this.keyCombos;
  }
  leapToElementWithKeyCombo(keycombo) {
    this.setSelected(this.keyCombos[keycombo].stuckOn);
    this.exitLeapMode();
  }
  exitLeapMode() {
    this.isSelectable = this.isSelectableDefault;
    Object.values(this.keyCombos).forEach((stickynote) => stickynote.unstick());
    this.leapMode = false;
  }
}
