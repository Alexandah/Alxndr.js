import {
  getChildrenWithClass,
  getChildWithClass,
  makeSpan,
  removeNode,
} from "./helpers.js";
import { PROHIBIT_SELECTION } from "./constants.js";

const elementsRejectingSpanChildren = ["INPUT"];
function canHaveSpanChildren(element) {
  return !elementsRejectingSpanChildren.includes(element.nodeName);
}

export default class Stickynote {
  constructor(element, text, noteClass = "registerNote") {
    this.stuckOn = element;
    this.noteClass = noteClass;
    this.parentOfNoteHolder = canHaveSpanChildren(this.stuckOn)
      ? this.stuckOn
      : this.stuckOn.parentElement;

    var hasNoteHolder =
      getChildrenWithClass(this.parentOfNoteHolder, "noteHolder").length > 0;
    if (!hasNoteHolder) {
      var parentOfNoteHolderIsPositioned =
        this.parentOfNoteHolder.style.position != "";
      if (!parentOfNoteHolderIsPositioned)
        this.addInertPositioning(this.parentOfNoteHolder);
      this.noteHolder = makeSpan("", this.parentOfNoteHolder);
      this.noteHolder.setAttribute("class", "noteHolder");
      this.noteHolder.setAttribute(PROHIBIT_SELECTION, "");
      const mustManuallyRepositionNoteHolder =
        this.parentOfNoteHolder !== this.stuckOn;
      if (mustManuallyRepositionNoteHolder)
        this.noteHolder.setAttribute(
          "style",
          "position: absolute; top: " +
            this.stuckOn.offsetTop +
            "px; left: " +
            this.stuckOn.offsetLeft +
            "px;"
        );
    } else
      this.noteHolder = getChildWithClass(
        this.parentOfNoteHolder,
        "noteHolder"
      );
    this.note = makeSpan(text, this.noteHolder);
    this.note.setAttribute("class", this.noteClass);
    this.note.setAttribute(PROHIBIT_SELECTION, "");
  }

  addInertPositioning(element) {
    element.style.position = "relative";
    element.style.top = "0";
    element.style.left = "0";
  }
  removeInertPositioning(element) {
    element.style.position = "";
    element.style.top = "";
    element.style.left = "";
  }

  unstick() {
    removeNode(this.note);
    var hasNotesLeft =
      getChildrenWithClass(this.noteHolder, this.noteClass).length > 0;
    if (!hasNotesLeft) {
      removeNode(this.noteHolder);
      this.removeInertPositioning(this.parentOfNoteHolder);
    }
  }
}
