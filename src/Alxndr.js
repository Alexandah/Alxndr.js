function alxndrDOM(root) {
  document.body.appendChild(root);
}

function isStdObj(obj) {
  return typeof obj === "object" && !Array.isArray(obj) && obj !== null;
}

function makeNode(type) {
  //Allows last 2 arguments to be sent in flexible order without explicit name reference
  if (arguments.length > 3) throw "Alxndr.js Error: Too many arguments!";
  var attributes = null;
  var children = null;
  for (var i = 1; i < arguments.length; i++) {
    let arg = arguments[i];
    if (isStdObj(arg)) {
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
          let styleString = "style=";
          Object.entries(v).forEach(([styleProp, styleVal]) => {
            styleString += styleProp + "=" + styleVal + "; ";
          });
          v = styleString;
        }
        break;
    }
    node.setAttribute(k, v);
  });

  console.log("children: ", children);
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
