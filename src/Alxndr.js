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

function removeItemFromArray(item, array) {
  if (array == null || array == undefined || array.length == 0) return;
  const i = array.indexOf(item);
  if (i != -1) array.splice(i, 1);
}

//Applies the same proxy handler to an object and all of its sub-objects
function makePanopticonProxy(obj, handler) {
  Object.keys(obj).forEach((key) => {
    const val = obj[key];
    const isObj = typeof val === "object" && val !== null;
    if (isObj) obj[key] = makePanopticonProxy(val, handler);
  });
  return new Proxy(obj, handler);
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

//THIS SHOULD NOT BE TOUCHED BY ANYONE ELSE OUTSIDE OF ALXNDR.JS
var AlxndrDOM = {
  root: document.body,
  alxNodes: {},
};

function findAlxNodeOfDomNode(domNode) {
  for (const i in Object.values(AlxndrDOM.alxNodes)) {
    const alxNodeData = AlxndrDOM.alxNodes[i];
    const alxNode = alxNodeData.alxNode;
    if (alxNode.node === domNode) return alxNode;
  }
  return null;
}

//Supports dynamic dom nodes.
//Allows associating non-dom variables with a domnode,
//and automatically translates them into dom var changes
//whenever they are set via a user defined render function.
var newId = 0;
class AlxNode {
  constructor(node) {
    this.id = newId++;
    this.nodeData = new ProxyDOMNode(node);
    this.render = function () {};
    this.destroy = function () {
      this.onDestroy();
      this.removeAllDependencies();
      delete AlxndrDOM.alxNodes[this.id];
      this.nodeData.parentNode.removeChild(this.nodeData.node);
      Object.keys(this).forEach((k) => {
        delete this[k];
      });
    };
    const sike = new Proxy(this, {
      set: (target, key, value) => {
        switch (key) {
          case "nodeData":
          case "node":
          case "id":
          case "destroy":
            break;
          default:
            if (isStdObj(value)) {
              console.log("AlxNode setter wrapping obj in proxy: ", value);
              target[key] = new Proxy(value, {
                set: (objTarget, objKey, objVal) => {
                  objTarget[objKey] = objVal;
                  this.tryRender();
                  return true;
                },
              });
              this.tryRender();
            } else {
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

    AlxndrDOM.alxNodes[this.id] = { alxNode: sike, updateCausesRenderOf: [] };
    return sike;
  }

  onDestroy() {}

  tryRender() {
    let skipRender = this.nodeData == null;
    if (skipRender) return;
    this.render();
    if (this.id in AlxndrDOM.alxNodes) {
      const whoElseToRender = AlxndrDOM.alxNodes[this.id].updateCausesRenderOf;
      whoElseToRender.forEach((alxNode) => {
        alxNode.render();
      });
    }
  }

  dependsOn(alxNode) {
    AlxndrDOM.alxNodes[alxNode.id].updateCausesRenderOf.push(this);
  }
  doesNotDependOn(alxNode) {
    if (alxNode == null) return;
    if (alxNode == undefined) return;
    if (alxNode.id == undefined) return;
    removeItemFromArray(
      this,
      AlxndrDOM.alxNodes[alxNode.id].updateCausesRenderOf
    );
  }
  removeAllDependencies() {
    AlxndrDOM.alxNodes[this.id].updateCausesRenderOf.forEach((alxNode) =>
      this.doesNotDependOn(alxNode)
    );
    Object.values(AlxndrDOM.alxNodes).forEach((x) => {
      x.alxNode.doesNotDependOn(this);
    });
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

const domNodeTypes = [
  "a",
  "abbr",
  "address",
  "area",
  "article",
  "aside",
  "audio",
  "b",
  "base",
  "bdo",
  "blockquote",
  "body",
  "br",
  "button",
  "canvas",
  "caption",
  "cite",
  "code",
  "col",
  "colgroup",
  "datalist",
  "dd",
  "del",
  "details",
  "dfn",
  "dialog",
  "div",
  "dl",
  "dt",
  "em",
  "embed",
  "fieldset",
  "figcaption",
  "figure",
  "footer",
  "form",
  "head",
  "header",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "html",
  "i",
  "iframe",
  "img",
  "ins",
  "input",
  "kbd",
  "label",
  "legend",
  "li",
  "link",
  "map",
  "mark",
  "menu",
  "menuitem",
  "meta",
  "meter",
  "nav",
  "object",
  "ol",
  "optgroup",
  "option",
  "output",
  "p",
  "param",
  "pre",
  "progress",
  "q",
  "s",
  "samp",
  "script",
  "section",
  "select",
  "small",
  "source",
  "span",
  "strong",
  "style",
  "sub",
  "summary",
  "sup",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "tr",
  "textarea",
  "time",
  "title",
  "track",
  "u",
  "ul",
  "var",
  "video",
];
const NSElements = ["svg", "path", "defs", "marker", "polygon"];
const createMakeNodeFuncForType = (nodeType) => {
  window[nodeType] = function (...args) {
    return makeNode(nodeType, ...args);
  };
};
const allNodeTypes = domNodeTypes.concat(NSElements);
allNodeTypes.forEach((nodeType) => {
  createMakeNodeFuncForType(nodeType);
});
