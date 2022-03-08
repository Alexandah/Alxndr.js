import { SEMANTIC_NODES, OS_TYPES, OS } from "./constants.js";

export function get(id) {
  return document.getElementById(id);
}

export function getClass(className) {
  return document.getElementsByClassName(className);
}

export function getChildrenWithClass(node, className) {
  if (node.hasChildNodes()) {
    var children = Array.from(node.childNodes);
    var matchingChildren = children.filter(
      (child) => child.className == className
    );
    return matchingChildren;
  }
  return null;
}

export function getChildWithClass(node, className) {
  return getChildrenWithClass(node, className)[0];
}

export function getTags(tagName) {
  return document.getElementsByTagName(tagName);
}

export function getTag(tagName) {
  return getTags(tagName)[0];
}

export function addNode(node, parent = document.body) {
  parent.appendChild(node);
  return node;
}

export function removeNode(node) {
  var parent = node.parentNode;
  parent.removeChild(node);
}

export function makeDiv(parent = document.body) {
  var div = document.createElement("div");
  return addNode(div, parent);
}

export function makeP(text, parent = document.body) {
  var p = document.createElement("p");
  p.appendChild(document.createTextNode(text));
  return addNode(p, parent);
}

export function makeSpan(text, parent = document.body) {
  var p = document.createElement("span");
  p.appendChild(document.createTextNode(text));
  return addNode(p, parent);
}

export function makeInput(type, name, parent = document.body) {
  var input = document.createElement("input");
  input.setAttribute("type", type);
  input.setAttribute("name", name);
  return addNode(input, parent);
}

export function getScreenPos(element) {
  var rect = element.getBoundingClientRect();
  return {
    x: rect.left,
    y: rect.top,
  };
}

export function isElement(node) {
  if (node === null) return false;
  return node.nodeType == 1;
}

export function getElementChildren(element) {
  return Array.from(element.childNodes).filter((node) => isElement(node));
}

export function hasElementChildren(element) {
  return getElementChildren(element).length > 0;
}

export function isScript(node) {
  return node instanceof HTMLScriptElement;
}

export function excludeScripts(elementList) {
  return Array.from(elementList).filter((node) => !isScript(node));
}

export function getKeyContainingX(obj, X) {
  var keyContainingX = null;
  Object.keys(obj).forEach((key) => {
    if (obj[key].indexOf(X) !== -1) {
      keyContainingX = key;
    }
  });
  return keyContainingX;
}

export function isEditable(element) {
  switch (element.nodeName) {
    case "INPUT":
      return true;
    default:
      return false;
  }
}

export function isLink(element) {
  if (element.nodeName == "A") return true;
  return false;
}

export function getOriginalPosition(element) {
  if (!element.hasOwnProperty("originalPosition"))
    element.originalPosition = getScreenPos(element);
  return element.originalPosition;
}

export function leftClick(element) {
  element.click();
}

export function rightClick(element) {
  var evt = new MouseEvent("contextmenu", {
    bubbles: true,
    cancelable: true,
    view: window,
    button: 2,
  });
  element.dispatchEvent(evt);
}

export function ctrlLeftClick(element) {
  switch (OS) {
    case OS_TYPES.MAC:
      element.dispatchEvent(new MouseEvent("click", { metaKey: true }));
      break;
    case OS_TYPES.PC:
      element.dispatchEvent(new MouseEvent("click", { ctrlKey: true }));
      break;
  }
}

export function pressFunctionKey(n) {
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "F" + n }));
}

export function traverseDOMSubtree(node, func, filterChildrenBy = (x) => true) {
  if (filterChildrenBy(node)) func(node);
  if (node.hasChildNodes())
    Array.from(node.childNodes).forEach((child) => {
      traverseDOMSubtree(child, func, filterChildrenBy);
    });
}

export function traverseElementsInDOMSubtree(node, func) {
  traverseDOMSubtree(node, func, (x) => isElement(x));
}

export function traversePathToRoot(node, func) {
  if (node == null) return;
  func(node);
  traversePathToRoot(node.parentNode, func);
}

export function getDOMPath(node) {
  const getChildIndex = (n) => {
    const parent = n.parentNode;
    if (parent == null) return -1;
    const whichChild = Array.from(parent.childNodes).indexOf(n);
    return whichChild;
  };
  const makeNodePathString = (n) => {
    return "/" + n.nodeName + "[" + getChildIndex(n) + "]";
  };

  var path = "";
  const addNodeToPath = (n) => {
    path = makeNodePathString(n) + path;
  };
  traversePathToRoot(node, addNodeToPath);
  return path;
}

export function isSemantic(node) {
  if (node === null) return false;
  return node.nodeName in SEMANTIC_NODES;
}

export function makeSemanticDOMTree(root) {
  if (!isSemantic(root)) return null;

  function SemanticDOMNode(node) {
    this.node = node;
    this.parent = null;
    this.children = [];
  }

  var semanticDOMRoot = null;
  function makeSemanticDOMSubtree(node, lastSemanticAncestor) {
    var semanticNode;
    if (isSemantic(node)) {
      semanticNode = new SemanticDOMNode(node);
      if (semanticDOMRoot == null) {
        semanticDOMRoot = semanticNode;
        lastSemanticAncestor = semanticDOMRoot;
      } else {
        semanticNode.parent = lastSemanticAncestor;
        semanticNode.parent.children.push(semanticNode);
      }
    }
    if (node.hasChildNodes())
      Array.from(node.childNodes).forEach((child) => {
        makeSemanticDOMSubtree(
          child,
          isSemantic(node) ? semanticNode : lastSemanticAncestor
        );
      });
  }
  makeSemanticDOMSubtree(root, null);
  return semanticDOMRoot;
}

export function isTextNode(node) {
  return node.nodeType == 3;
}

export function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}
