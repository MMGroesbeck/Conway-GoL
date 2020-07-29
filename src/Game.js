import React from "react";
import "./Game.css";

const CELL_SIZE = 15;
const WIDTH = 900;
const HEIGHT = 600;
const MAX_HEIGHT = 600

class Cell extends React.Component {
  constructor(cell_size=15) {
    super();
    this.cell_size = cell_size
  }
  render() {
    const { x, y } = this.props;
    return (
      <div
        className="Cell"
        style={{
          left: `${CELL_SIZE * x + 1}px`,
          top: `${CELL_SIZE * y + 1}px`,
          width: `${CELL_SIZE - 1}px`,
          height: `${CELL_SIZE - 1}px`,
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
    cells: [],
    interval: 100,
    steps: 1,
    isRunning: false,
    rows: 40,
    cols: 40,
    cell_size: (MAX_HEIGHT - (MAX_HEIGHT % this.rows)) / this.rows
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
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        if (this.board[y][x]) {
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
    const x = Math.floor(offsetX / this.cell_size);
    const y = Math.floor(offsetY / this.cell_size);
    if (x >= 0 && x <= this.cols && y >= 0 && y <= this.rows) {
      this.board[y][x] = !this.board[y][x];
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
  oneStep() {
    let newBoard = this.makeEmptyBoard();
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        let neighbors = this.calculateNeighbors(this.board, x, y);
        if (this.board[y][x]) {
          if (neighbors === 2 || neighbors === 3) {
            newBoard[y][x] = true;
          } else {
            newBoard[y][x] = false;
          }
        } else {
          if (!this.board[y][x] && neighbors === 3) {
            newBoard[y][x] = true;
          }
        }
      }
    }
    this.board = newBoard;
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
    for (let i = 0; i < dirs.length; i++) {
      const dir = dirs[i];
      let y1 = y + dir[0];
      let x1 = x + dir[1];

      if (
        x1 >= 0 &&
        x1 < this.cols &&
        y1 >= 0 &&
        y1 < this.rows &&
        board[y1][x1]
      ) {
        neighbors++;
      }
    }
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
  handleClear = () => {
    this.board = this.makeEmptyBoard();
    this.setState({ cells: this.makeCells() });
  };
  render() {
    const { cells } = this.state;
    return (
      <div>
        <div
          className="Board"
          style={{
            width: WIDTH,
            height: HEIGHT,
            backgroundSize: `${this.cell_size}px ${this.cell_size}px`,
          }}
          onClick={this.handleClick}
          ref={(n) => {
            this.boardRef = n;
          }}
        >
          {cells.map((cell) => (
            <Cell x={cell.x} y={cell.y} key={`${cell.x},${cell.y}`} />
          ))}
        </div>
        <div className="controls">
          Speed:{" "}
          <input
            value={1000/this.state.interval}
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
      </div>
    );
  }
}
export default Game;
