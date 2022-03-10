function alxndrDOM(root) {
  document.body.appendChild(root);
}

class ProxyDOMNode {
  constructor(varsIgnoringRender = []) {
    this.domNode = null;
    this.render = function () {};
    this.destroy = function () {
      this.domNode.parentNode.removeChild(this.domNode);
      Object.keys(this).forEach((k) => {
        delete this[k];
      });
    };
    return new Proxy(this, {
      set: (target, key, value) => {
        target[key] = value;
        switch (key) {
          case "domNode":
            break;
          default:
            let skipRender = varsIgnoringRender.includes(key);
            if (skipRender) break;
            this.render();
        }
        return true;
      },
    });
  }
}

class AlxNode extends ProxyDOMNode {
  constructor(children = []) {
    super();
    this.parent = null;
    this.children = children;
  }

  adopt(alxNode) {
    this.children.push(alxNode);
    alxNode.parent = this;
    this.domNode.appendChild(alxNode.domNode);
  }

  abandon(alxNode) {
    var i = this.children.indexOf(alxNode);
    const hasChild = i != -1;
    if (hasChild) {
      this.children.splice(i, 1);
      alxNode.parent = null;
      this.domNode.removeChild(alxNode.domNode);
    }
  }
}

class alxh1 extends AlxNode {
  constructor(text) {
    super();
    this.text = text;
    this.isCool = false;
    this.domNode = h1(text);
    this.domNode.addEventListener("click", () => {
      this.isCool = !this.isCool;
      this.text = "REEEEEEEEEEEEEE";
    });
    this.render = () => {
      this.domNode.innerHTML = this.text;
      this.domNode.style.border = this.isCool
        ? "5px solid orange"
        : "5px solid black";
    };
  }
}

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

  var node = document.createElement(type);

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
            styleString += styleProp + "=" + styleVal + "; ";
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
