import React from "react";
import "./Game.css";

const MAX_HEIGHT = 600

class Cell extends React.Component {
  render() {
    const { x, y } = this.props;
    return (
      <div
        className="Cell"
        style={{
          left: `${this.props.cell_size * x + 1}px`,
          top: `${this.props.cell_size * y + 1}px`,
          width: `${this.props.cell_size - 1}px`,
          height: `${this.props.cell_size - 1}px`,
        }}
      />
    );
  }
}
class Game extends React.Component {
  constructor() {
    super();
    this.rows = 40;
    this.cols = 40;
    this.cell_size = (MAX_HEIGHT - (MAX_HEIGHT % this.rows)) / this.rows
    this.board = this.makeEmptyBoard();
  }
  state = {
    board: this.board,
    cells: [],
    interval: 100,
    steps: 1,
    isRunning: false,
    rows: 40,
    cols: 40,
    cell_size: (MAX_HEIGHT - (MAX_HEIGHT % this.rows)) / this.rows,
    topology: "default",
    nextTopo: "default",
    nextRows: 40,
    nextCols: 40
  };
  makeEmptyBoard() {
    let board = [];
    for (let y = 0; y < this.state.rows; y++) {
      board[y] = [];
      for (let x = 0; x < this.state.cols; x++) {
        board[y][x] = false;
      }
    }
    return board;
  }
  makeCells() {
    let cells = [];
    for (let y = 0; y < this.state.rows; y++) {
      for (let x = 0; x < this.state.cols; x++) {
        if (this.state.board[y][x]) {
          cells.push({ x, y });
        }
      }
    }
    return cells;
  }
  getElementOffset() {
    const rect = this.boardRef.getBoundingClientRect();
    const doc = document.documentElement;
    return {
      x: rect.left + window.pageXOffset - doc.clientLeft,
      y: rect.top + window.pageYOffset - doc.clientTop,
    };
  }
  handleClick = (event) => {
    const elemOffset = this.getElementOffset();
    const offsetX = event.clientX - elemOffset.x;
    const offsetY = event.clientY - elemOffset.y;
    const x = Math.floor(offsetX / this.state.cell_size);
    const y = Math.floor(offsetY / this.state.cell_size);
    if ((x >= 0) && (x <= this.state.cols) && (y >= 0) && (y <= this.state.rows)) {
      let newBoard = [...this.state.board]
      newBoard[y][x] = !newBoard[y][x];
      this.setState({ board: newBoard });
    }
    this.setState({ cells: this.makeCells() });
  };
  runGame = () => {
    this.setState({ isRunning: true });
    this.runIteration();
  };
  stopGame = () => {
    this.setState({ isRunning: false });
    if (this.timeoutHandler) {
      window.clearTimeout(this.timeoutHandler);
      this.timeoutHandler = null;
    }
  };
  runIteration() {
    console.log("running iteration");
    this.oneStep();
    this.timeoutHandler = window.setTimeout(() => {
      this.runIteration();
    }, this.state.interval);
  }
  oneStep = async () => {
    let newBoard = this.makeEmptyBoard();
    for (let y = 0; y < this.state.rows; y++) {
      for (let x = 0; x < this.state.cols; x++) {
        let neighbors = await this.calculateNeighbors(this.state.board, x, y);
        if (this.state.board[y][x]) {
          if (neighbors === 2 || neighbors === 3) {
            newBoard[y][x] = true;
          } else {
            newBoard[y][x] = false;
          }
        } else {
          if (!this.state.board[y][x] && neighbors === 3) {
            newBoard[y][x] = true;
          }
        }
      }
    }
    this.setState({ board: newBoard });
    this.setState({ cells: this.makeCells() });
  }
  calculateNeighbors(board, x, y) {
    let neighbors = 0;
    const dirs = [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, 1],
      [1, 1],
      [1, 0],
      [1, -1],
      [0, -1],
    ];
    dirs.forEach(coord => {
      let y1 = y + coord[0]
      let x1 = x + coord[1]
      // Adjust x-axis topology:
      switch(this.state.topology){
        case "cylinder":
        case "torus":
        case "klein":
          if (x1<0){
            x1 = this.state.cols - 1;
          }
          if (x1>=this.state.cols) {
            x1 = 0;
          }
          break;
        case "mobius":
        case "rpp":
          if (x1<0){
            x1 = this.state.cols -1;
            y1 = this.state.rows - y1 -1;
          }
          if (x1>=this.state.cols) {
            x1 = 0;
            y1 = this.state.rows -y1 -1;
          }
          break;
        default:
          break;
      }
      // Adjust y-axis topology:
      switch(this.state.topology){
        case "torus":
          if (y1<0){
            y1 = this.state.rows - 1;
          }
          if (y1>=this.state.rows) {
            y1 = 0;
          }
          break;
        case "klein":
        case "rpp":
          if (y1<0){
            y1 = this.state.rows -1;
            x1 = this.state.cols - x1 -1;
          }
          if (y1>=this.state.rows) {
            y1 = 0;
            x1 = this.state.rows -x1 -1;
          }
          break;
        default:
          break;
      }
      if(x1 >= 0 && y1 >= 0 && x1 < this.state.cols && y1 < this.state.rows) {
        if (board[y1][x1]===true){
          neighbors++;
        }
      }
    })
    return neighbors;
  }
  takeSteps = () => {
    for (let i = 0; i < this.state.steps; i++) {
      this.oneStep()
    }
  }
  handleIntervalChange = (event) => {
    this.setState({ interval: 1000/event.target.value });
  };
  handleStepsChange = (event) => {
    this.setState({ steps: event.target.value })
  }
  handleClear = async () => {
    const newBoard = await this.makeEmptyBoard();
    this.setState({ board: newBoard })
    this.setState({ cells: this.makeCells() });
  };
  handleTopoChange = (event) => {
    this.setState({ nextTopo: event.target.value})
  }
  handleRowsChange = (event) => {
    this.setState({ nextRows: event.target.value})
  }
  handleColsChange = (event) => {
    this.setState({ nextCols: event.target.value})
  }
  newBoard = async () => {
    await this.setState({
      topology: this.state.nextTopo,
      rows: this.state.nextRows,
      cols: this.state.nextCols,
      cell_size: (MAX_HEIGHT - (MAX_HEIGHT % this.state.nextRows)) / this.state.nextRows });
    let board = []
    for (let y = 0; y < this.state.rows; y++) {
      board[y] = [];
      for (let x = 0; x < this.state.cols; x++) {
        board[y][x] = false;
      }
    }
    this.setState({ board: board })
    this.setState({ cells: this.makeCells() });
  }
  render() {
    const { cells } = this.state;
    return (
      <div>
        <div
          className="Board"
          style={{
            width: this.state.cell_size * this.state.cols,
            height: this.state.cell_size * this.state.rows,
            backgroundSize: `${this.state.cell_size}px ${this.state.cell_size}px`,
          }}
          onClick={this.handleClick}
          ref={(n) => {
            this.boardRef = n;
          }}
        >
          {cells.map((cell) => (
            <Cell cell_size={this.state.cell_size} x={cell.x} y={cell.y} key={`${cell.x},${cell.y}`} />
          ))}
        </div>
        <div className="controls">
          Speed:{" "}
          <input
            value={Math.round(1000/this.state.interval)}
            onChange={this.handleIntervalChange}
          />{" "}
          generations per second
          {this.state.isRunning ? (
            <button className="button" onClick={this.stopGame}>
              Stop
            </button>
          ) : (
            <button className="button" onClick={this.runGame}>
              Run
            </button>
          )}
          <button className="button" onClick={this.handleClear}>
            Clear
          </button>
          <button className="button" onClick={this.oneStep}>
            Step
          </button>
          Take{""}
          <input
            value={this.state.steps}
            onChange={this.handleStepsChange}
          />
          steps:
          <button className="button" onClick={this.takeSteps}>
            Go
          </button>
        </div>
        <div className="controls">
          Topology:
          <form>
            <div className="radio">
              <label>
                <input type="radio" value="default" checked={this.state.nextTopo === "default"}
                  onChange={this.handleTopoChange} />
                default
              </label>
            </div>
            <div className="radio">
              <label>
                <input type="radio" value="cylinder" checked={this.state.nextTopo === "cylinder"}
                  onChange={this.handleTopoChange} />
                cylinder
              </label>
            </div>
            <div className="radio">
              <label>
                <input type="radio" value="mobius" checked={this.state.nextTopo === "mobius"} 
                  onChange={this.handleTopoChange}/>
                Möbius band
              </label>
            </div>
            <div className="radio">
              <label>
                <input type="radio" value="torus" checked={this.state.nextTopo === "torus"} 
                  onChange={this.handleTopoChange}/>
                torus
              </label>
            </div>
            <div className="radio">
              <label>
                <input type="radio" value="klein" checked={this.state.nextTopo === "klein"} 
                  onChange={this.handleTopoChange}/>
                Klein bottle
              </label>
            </div>
            <div className="radio">
              <label>
                <input type="radio" value="rpp" checked={this.state.nextTopo === "rpp"} 
                  onChange={this.handleTopoChange}/>
                real projective plane
              </label>
            </div>
          </form>
          Rows:{" "}
          <input
            value={this.state.nextRows}
            onChange={this.handleRowsChange}
          />
          Columns:{" "}
          <input
            value={this.state.nextCols}
            onChange={this.handleColsChange}
          />
          <button className="button" onClick={this.newBoard}>
            New board
          </button>
        </div>
      </div>
    );
  }
}
export default Game;
