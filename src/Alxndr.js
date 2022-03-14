//is a js obj but not an array or null
function isStdObj(obj) {
  return typeof obj === "object" && !Array.isArray(obj) && obj !== null;
}

//Returns true if it is a DOM node
function isNode(o) {
  return typeof Node === "object"
    ? o instanceof Node
    : o &&
        typeof o === "object" &&
        typeof o.nodeType === "number" &&
        typeof o.nodeName === "string";
}

//Attaches nodes to the document body
function alxndrDOM(bodyChildren) {
  if (!Array.isArray(bodyChildren)) bodyChildren = [bodyChildren];
  bodyChildren.forEach((child) => document.body.appendChild(child));
}

//Allows interacting with a domnode through
//a more aesthetically pleasing and simple syntax
class ProxyDOMNode {
  constructor(domNode) {
    return new Proxy(domNode, {
      set: (target, key, value) => {
        if (key in target) {
          if (key == "style" && isStdObj(value))
            Object.entries(value).forEach(([k, v]) => {
              target.style[k] = v;
            });
          else target[key] = value;
        } else target.setAttribute(key, value);
        return true;
      },
      get: (target, key) => {
        if (key == "node") return target;
        if (key in target) return target[key];
        else return target.getAttribute(key);
      },
    });
  }
}

//Supports dynamic dom nodes.
//Allows associating non-dom variables with a domnode,
//and automatically translates them into dom var changes
//whenever they are set via a user defined render function.
class AlxNode {
  constructor(node) {
    this.nodeData = new ProxyDOMNode(node);
    this.render = function () {};
    this.destroy = function () {
      this.nodeData.parentNode.removeChild(this.nodeData.node);
      Object.keys(this).forEach((k) => {
        delete this[k];
      });
    };
    return new Proxy(this, {
      set: (target, key, value) => {
        switch (key) {
          case "nodeData":
            break;
          default:
            if (isStdObj(value))
              target[key] = new Proxy(value, {
                set: (objTarget, objKey, objVal) => {
                  objTarget[objKey] = objVal;
                  this.tryRender();
                  return true;
                },
              });
            else {
              target[key] = value;
              this.tryRender();
            }
            break;
        }
        return true;
      },
      get: (target, key) => {
        if (key == "node") return this.nodeData.node;
        else return target[key];
      },
    });
  }

  tryRender() {
    let skipRender = this.nodeData == null;
    if (skipRender) return;
    this.render();
  }
}

function makeNode(type) {
  //Allows last 2 arguments to be sent in flexible order without explicit name reference
  if (arguments.length > 3) throw "Alxndr.js Error: Too many arguments!";
  var attributes = null;
  var children = null;
  for (var i = 1; i < arguments.length; i++) {
    let arg = arguments[i];
    if (isStdObj(arg) && !isNode(arg)) {
      if (attributes != null)
        throw "Alxndr.js Error: Tried to set attributes twice.";
      attributes = arg;
    } else if (Array.isArray(arg)) {
      if (children != null)
        throw "Alxndr.js Error: Tried to set children twice.";
      children = arg;
    } else if (typeof arg == "string") {
      if (children != null)
        throw "Alxndr.js Error: Tried to set children twice.";
      children = [arg];
    } else {
      if (children != null)
        throw "Alxndr.js Error: Tried to set children twice.";
      children = [arg];
    }
  }
  if (attributes == null) attributes = {};
  if (children == null) children = [];

  if (NSElements.includes(type))
    var node = document.createElementNS("http://www.w3.org/2000/svg", type);
  else var node = document.createElement(type);

  Object.entries(attributes).forEach(([k, v]) => {
    switch (k) {
      case "class":
        if (Array.isArray(v)) {
          let valsString = "";
          v.forEach((className) => {
            valsString += className + " ";
          });
          v = valsString;
        }
        break;
      case "style":
        if (typeof v == "string") break;
        if (isStdObj(v)) {
          let styleString = "";
          Object.entries(v).forEach(([styleProp, styleVal]) => {
            styleString += styleProp + ":" + styleVal + "; ";
          });
          v = styleString;
        }
        break;
      default:
        const isEventListener = typeof k == "string" && k.indexOf("on") == 0;
        if (isEventListener) node.addEventListener(k.substring(2), v);
        break;
    }
    node.setAttribute(k, v);
  });

  children.forEach((child) => {
    let toAdd;
    if (typeof child === "string") toAdd = document.createTextNode(child);
    else toAdd = child;
    node.appendChild(toAdd);
  });
  return node;
}

function h1(...args) {
  return makeNode("h1", ...args);
}

function h2(...args) {
  return makeNode("h2", ...args);
}

function h3(...args) {
  return makeNode("h3", ...args);
}

function h4(...args) {
  return makeNode("h4", ...args);
}

function div(...args) {
  return makeNode("div", ...args);
}

function p(...args) {
  return makeNode("p", ...args);
}

function ul(...args) {
  return makeNode("ul", ...args);
}

function li(...args) {
  return makeNode("li", ...args);
}

function img(...args) {
  return makeNode("img", ...args);
}

function a(...args) {
  return makeNode("a", ...args);
}

function span(...args) {
  return makeNode("span", ...args);
}

function form(...args) {
  return makeNode("form", ...args);
}

function input(...args) {
  return makeNode("input", ...args);
}

function sub(...args) {
  return makeNode("sub", ...args);
}

function button(...args) {
  return makeNode("button", ...args);
}

const NSElements = ["svg", "path", "defs", "marker", "polygon"];
function svg(...args) {
  return makeNode("svg", ...args);
}

function path(...args) {
  return makeNode("path", ...args);
}

function defs(...args) {
  return makeNode("defs", ...args);
}

function marker(...args) {
  return makeNode("marker", ...args);
}

function polygon(...args) {
  return makeNode("polygon", ...args);
}
