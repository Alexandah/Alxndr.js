import "./Alxndr.js";

class GraphNode extends AlxNode {
  constructor(content, startPos = { x: 0, y: 0 }) {
    super(
      div(
        { style: { position: "absolute", border: "1px solid black" } },
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
export class Graph {
  constructor(sizeX, sizeY) {
    this.drawRegion = svg(
      {
        style: {
          width: sizeX + "px",
          height: sizeY + "px",
        },
      },
      defs(arrowhead())
    );
    this.view = div(
      {
        style: {
          position: "relative",
          left: "0px",
          top: "0px",
          width: sizeX + "px",
          height: sizeY + "px",
          border: "2px solid black",
        },
      },
      this.drawRegion
    );
    this.nodes = [];
    this.edges = [];
  }

  addNode(content, spawnPos = { x: 0, y: 0 }) {
    var node = new GraphNode(content, spawnPos);
    this.nodes.push(node);
    this.view.appendChild(node.node);
    return node;
  }
  removeNode(node) {
    const nodeIndex = this.nodes.indexOf(node);
    const hasNode = nodeIndex != -1;
    if (hasNode) {
      //creating copy bc otherwise the list we are removing from is trimmed as we go,
      //causing early termination and failure to remove some edges
      const edgesToRemove = node.connectedEdges.map((edge) => edge);
      edgesToRemove.forEach((edge) => this.removeEdge(edge));
      this.nodes.splice(nodeIndex, 1);
      node.destroy();
    }
  }

  addEdge(from, to) {
    var edge = new GraphEdge(from, to);
    edge.fromNode.connectedEdges.push(edge);
    edge.toNode.connectedEdges.push(edge);
    this.edges.push(edge);
    this.drawRegion.appendChild(edge.node);
    return edge;
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
