import "./Alxndr.js";

class GraphNode extends AlxNode {
  constructor(content, startPos = { x: 0, y: 0 }) {
    super(
      div(
        {
          canGrab: "",
          style: {
            position: "absolute",
            border: "1px solid black",
          },
        },
        content
      )
    );
    this.position = startPos;
    this.connectedEdges = [];
    this.render = () => {
      this.nodeData.style = {
        left: this.position.x + "px",
        top: this.position.y + "px",
      };
    };
  }
}

function arrow(start, end, width = 3, color = "black") {
  return path({
    yesHop: "",
    d: "M" + start.x + " " + start.y + " L" + end.x + " " + end.y,
    stroke: color,
    "stroke-width": width,
    "marker-end": "url(#arrowhead)",
  });
}
class GraphEdge extends AlxNode {
  constructor(fromNode, toNode) {
    super(arrow(fromNode.position, toNode.position, 1));
    this.fromNode = fromNode;
    this.toNode = toNode;
    this.dependsOn(this.fromNode);
    this.dependsOn(this.toNode);
    this.render = () => {
      this.nodeData.d =
        "M" +
        this.fromNode.position.x +
        " " +
        this.fromNode.position.y +
        " L" +
        this.toNode.position.x +
        " " +
        this.toNode.position.y;
    };
  }
}

function arrowhead() {
  return marker(
    {
      id: "arrowhead",
      markerWidth: 10,
      markerHeight: 7,
      refX: 0,
      refY: 3.5,
      orient: "auto",
    },
    polygon({ points: "0 0, 10 3.5, 0 7" })
  );
}
function editorOption(title, action) {
  return button({ onclick: () => action() }, title);
}
function editorTab(options, x = 0, y = 0) {
  const tab = div(
    {
      style: {
        yesHop: "",
        border: "1px solid black",
        position: "absolute",
        top: y + "px",
        left: x + "px",
      },
    },
    options
  );
  ["click", "contextmenu"].forEach((eType) =>
    tab.addEventListener(eType, () => tab.remove())
  );
  domHopper.setSelected(options[0]);
  return tab;
}
export class Graph {
  constructor(sizeX, sizeY) {
    this.drawRegion = svg(
      {
        noHop: "",
        style: {
          width: sizeX + "px",
          height: sizeY + "px",
        },
      },
      defs(arrowhead())
    );
    this.view = div(
      {
        yesHop: "",
        style: {
          position: "relative",
          left: "0px",
          top: "0px",
          width: sizeX + "px",
          height: sizeY + "px",
          border: "2px solid black",
        },
        // onclick: () => {
        //   this.addNode(input(), { x: sizeX / 2, y: sizeY / 2 });
        // },
      },
      this.drawRegion
    );
    this.nodes = [];
    this.edges = [];
    this.openEditorMenu = null;
    this.creatingEdgeFrom = null;
    this.movingEdgeStart = null;
    this.movingEdgeDest = null;
  }

  addNode(content, spawnPos = { x: 0, y: 0 }) {
    var node = new GraphNode(content, spawnPos);
    node.node.oncontextmenu = () => {
      if (this.openEditorMenu != null) this.openEditorMenu.remove();
      const tab = editorTab(
        [
          editorOption("Delete", () => {
            this.removeNode(node);
          }),
          editorOption("Create Edge", () => {
            this.beginEdgeCreation(node);
          }),
        ],
        20,
        20
      );
      this.openEditorMenu = tab;
      node.node.appendChild(tab);
    };
    node.node.onclick = () => {
      this.endMoveEdgeStart();
      this.endMoveEdgeDest();
      if (this.creatingEdgeFrom === node) return;
      this.endEdgeCreation();
    };
    this.nodes.push(node);
    this.view.appendChild(node.node);
    domHopper.setSelected(node.node);
    return node;
  }
  removeNode(node) {
    const nodeIndex = this.nodes.indexOf(node);
    const hasNode = nodeIndex != -1;
    if (hasNode) {
      //creating copy bc otherwise the list we are removing from is trimmed as we go,
      //causing early termination and failure to remove some edges
      const edgesToRemove = node.connectedEdges.map((edge) => edge);
      this.nodes.splice(nodeIndex, 1);
      //setting next selected node
      if (node.connectedEdges.length > 0) {
        const edge = node.connectedEdges[0];
        const isFromNode = edge.fromNode === this;
        domHopper.setSelected(
          isFromNode ? edge.toNode.node : edge.fromNode.node
        );
      } else if (this.nodes.length > 0)
        domHopper.setSelected(this.nodes[0].node);
      node.destroy();
      edgesToRemove.forEach((edge) => this.removeEdge(edge));
    }
  }

  addEdge(from, to) {
    var edge = new GraphEdge(from, to);
    const offset = {
      x: (edge.fromNode.position.x + edge.toNode.position.x) / 2,
      y: (edge.fromNode.position.y + edge.toNode.position.y) / 2,
    };
    edge.node.oncontextmenu = () => {
      if (this.openEditorMenu != null) this.openEditorMenu.remove();
      const tab = editorTab(
        [
          editorOption("Delete", () => {
            //set next selected item
            domHopper.setSelected(edge.fromNode.node);
            this.removeEdge(edge);
          }),
          editorOption("Move Start", () => {
            this.beginMoveEdgeStart(edge);
          }),
          editorOption("Move Dest", () => {
            this.beginMoveEdgeDest(edge);
          }),
        ],
        offset.x,
        offset.y
      );
      this.openEditorMenu = tab;
      this.view.appendChild(tab);
    };
    edge.fromNode.connectedEdges.push(edge);
    edge.toNode.connectedEdges.push(edge);
    this.edges.push(edge);
    this.drawRegion.appendChild(edge.node);
    return edge;
  }

  beginEdgeCreation(startNode) {
    this.creatingEdgeFrom = startNode;
    domHopper.setSelected(startNode.node);
  }
  endEdgeCreation() {
    if (this.creatingEdgeFrom == null) return;
    const dest = findAlxNodeOfDomNode(domHopper.selected);
    this.addEdge(this.creatingEdgeFrom, dest);
    this.creatingEdgeFrom = null;
  }

  beginMoveEdgeStart(edge) {
    if (this.movingEdgeDest != null) return;
    this.movingEdgeStart = edge;
    domHopper.setSelected(edge.fromNode.node);
  }
  endMoveEdgeStart() {
    if (this.movingEdgeStart == null) return;
    const newStart = findAlxNodeOfDomNode(domHopper.selected);
    this.movingEdgeStart.doesNotDependOn(this.movingEdgeStart.fromNode);
    this.movingEdgeStart.fromNode = newStart;
    this.movingEdgeStart.dependsOn(newStart);
    console.log("modified edge to state: ", this.movingEdgeStart);
    this.movingEdgeStart = null;
  }

  beginMoveEdgeDest(edge) {
    if (this.movingEdgeStart != null) return;
    this.movingEdgeDest = edge;
    domHopper.setSelected(edge.toNode.node);
  }
  endMoveEdgeDest() {
    if (this.movingEdgeDest == null) return;
    const newDest = findAlxNodeOfDomNode(domHopper.selected);
    this.movingEdgeDest.doesNotDependOn(this.movingEdgeDest.toNode);
    this.movingEdgeDest.toNode = newDest;
    this.movingEdgeDest.dependsOn(newDest);
    console.log("modified edge to state: ", this.movingEdgeDest);
    this.movingEdgeDest = null;
  }

  removeEdge(edge) {
    const edgeIndex = this.edges.indexOf(edge);
    const hasEdge = edgeIndex != -1;
    if (hasEdge) {
      removeItemFromArray(edge, edge.fromNode.connectedEdges);
      removeItemFromArray(edge, edge.toNode.connectedEdges);
      this.edges.splice(edgeIndex, 1);
      edge.destroy();
    }
  }
}
