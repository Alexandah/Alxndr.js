import {
  getChildrenWithClass,
  getChildWithClass,
  addNode,
  removeNode,
} from "./helpers.js";
import { PROHIBIT_SELECTION } from "./constants.js";
import "./Alxndr.js";

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

    this.note = span({ class: this.noteClass, noHop: "" }, text);

    var hasNoteHolder =
      getChildrenWithClass(this.parentOfNoteHolder, "noteHolder").length > 0;
    if (!hasNoteHolder) {
      var parentOfNoteHolderIsPositioned =
        this.parentOfNoteHolder.style.position != "";
      if (!parentOfNoteHolderIsPositioned)
        this.addInertPositioning(this.parentOfNoteHolder);

      const mustManuallyRepositionNoteHolder =
        this.parentOfNoteHolder !== this.stuckOn;

      this.noteHolder = span(
        (() => {
          let attr = { class: "noteHolder", noHop: "" };
          if (mustManuallyRepositionNoteHolder)
            attr.style = {
              position: "absolute",
              top: this.stuckOn.offsetTop,
              left: this.stuckOn.offsetLeft,
            };
          return attr;
        })(),
        [note]
      );
      addNode(this.noteHolder, this.parentOfNoteHolder);
    } else
      this.noteHolder = getChildWithClass(
        this.parentOfNoteHolder,
        "noteHolder"
      );
    addNode(this.note, this.noteHolder);
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
