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
    super(arrow(fromNode.position, toNode.position));
    this.fromNode = fromNode;
    this.toNode = toNode;
    this.dependsOn(this.fromNode);
    this.dependsOn(this.toNode);
    this.render = () => {
      console.log(
        "rendering edge ",
        this,
        " attached to nodes ",
        toNode,
        fromNode
      );
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
    console.log("removing node ", node);
    console.log(this.nodes);
    console.log(this.edges);
    const nodeIndex = this.nodes.indexOf(node);
    const hasNode = nodeIndex != -1;
    if (hasNode) {
      console.log(node.connectedEdges.length);
      console.log("connnected edges ", node.connectedEdges);
      node.connectedEdges.forEach((edge) => {
        console.log(edge);
        this.removeEdge(edge);
      });
      console.log(
        "connnected edges after 1st removal loop ",
        node.connectedEdges,
        typeof node.connectedEdges
      );
      node.connectedEdges.forEach((edge) => {
        console.log(edge);
        this.removeEdge(edge);
      });
      console.log(node.connectedEdges.length);
      console.log(
        "connnected edges after 2nd removal loop ",
        node.connectedEdges,
        typeof node.connectedEdges
      );
      this.nodes.splice(nodeIndex, 1);
      node.destroy();
    }
    console.log(this.nodes);
    console.log(this.edges);
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
    console.log("attempting to remove edge ", edge);
    const edgeIndex = this.edges.indexOf(edge);
    const hasEdge = edgeIndex != -1;
    console.log("hasEdge? ", hasEdge);
    if (hasEdge) {
      removeItemFromArray(edge, edge.fromNode.connectedEdges);
      removeItemFromArray(edge, edge.toNode.connectedEdges);
      this.edges.splice(edgeIndex, 1);
      edge.destroy();
    }
  }
}
