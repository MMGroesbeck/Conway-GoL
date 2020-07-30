import React, { useEffect } from "react";
import "./Game.css";
import { findByLabelText } from "@testing-library/react";

const MAX_HEIGHT = 500;

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
    this.cell_size = (MAX_HEIGHT - (MAX_HEIGHT % this.rows)) / this.rows;
    this.updateWindowDimensions = this.updateWindowDimensions.bind(this);
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
    nextCols: 40,
    gens: 0,
  };
  componentDidMount() {
    this.updateWindowDimensions();
    window.addEventListener("resize", this.updateWindowDimensions);
    this.newBoard();
  }
  componentWillUnmount() {
    window.removeEventListener("resize", this.updateWindowDimensions);
  }
  updateWindowDimensions() {
    this.setState({ width: window.innerWidth, height: window.innerHeight });
  }
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
    if (x >= 0 && x <= this.state.cols && y >= 0 && y <= this.state.rows) {
      let newBoard = [...this.state.board];
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
  runIteration = async () => {
    console.log("running iteration");
    await this.oneStep();
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
    await this.setState({ board: newBoard });
    this.setState({ cells: this.makeCells(), gens: this.state.gens + 1 });
  };
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
    dirs.forEach((coord) => {
      let y1 = y + coord[0];
      let x1 = x + coord[1];
      // Adjust x-axis topology:
      switch (this.state.topology) {
        case "cylinder":
        case "torus":
        case "klein":
          if (x1 < 0) {
            x1 = this.state.cols - 1;
          }
          if (x1 >= this.state.cols) {
            x1 = 0;
          }
          break;
        case "mobius":
        case "rpp":
          if (x1 < 0) {
            x1 = this.state.cols - 1;
            y1 = this.state.rows - y1 - 1;
          }
          if (x1 >= this.state.cols) {
            x1 = 0;
            y1 = this.state.rows - y1 - 1;
          }
          break;
        default:
          break;
      }
      // Adjust y-axis topology:
      switch (this.state.topology) {
        case "torus":
          if (y1 < 0) {
            y1 = this.state.rows - 1;
          }
          if (y1 >= this.state.rows) {
            y1 = 0;
          }
          break;
        case "klein":
        case "rpp":
          if (y1 < 0) {
            y1 = this.state.rows - 1;
            x1 = this.state.cols - x1 - 1;
          }
          if (y1 >= this.state.rows) {
            y1 = 0;
            x1 = this.state.rows - x1 - 1;
          }
          break;
        default:
          break;
      }
      if (x1 >= 0 && y1 >= 0 && x1 < this.state.cols && y1 < this.state.rows) {
        if (board[y1][x1] === true) {
          neighbors++;
        }
      }
    });
    return neighbors;
  }
  takeSteps = async () => {
    console.log("Planned: ", this.state.steps);
    for (let i = 0; i < this.state.steps; i++) {
      console.log(i);
      await this.oneStep();
    }
  };
  handleIntervalChange = (event) => {
    this.setState({ interval: 1000 / event.target.value });
  };
  handleStepsChange = (event) => {
    this.setState({ steps: event.target.value });
  };
  handleClear = async () => {
    const newBoard = await this.makeEmptyBoard();
    this.setState({ board: newBoard });
    this.setState({ cells: this.makeCells(), gens: 0 });
  };
  handleTopoChange = (event) => {
    this.setState({ nextTopo: event.target.value });
  };
  handleRowsChange = (event) => {
    this.setState({ nextRows: event.target.value });
  };
  handleColsChange = (event) => {
    this.setState({ nextCols: event.target.value });
  };
  newBoard = async () => {
    await this.setState({
      topology: this.state.nextTopo,
      rows: this.state.nextRows,
      cols: this.state.nextCols,
      cell_size:
        (MAX_HEIGHT - (MAX_HEIGHT % this.state.nextRows)) / this.state.nextRows,
    });
    let board = [];
    for (let y = 0; y < this.state.rows; y++) {
      board[y] = [];
      for (let x = 0; x < this.state.cols; x++) {
        board[y][x] = false;
      }
    }
    await this.setState({ board: board });
    this.setState({ cells: this.makeCells(), gens: 0 });
  };
  render() {
    const { cells } = this.state;
    let runGame = this.runGame;
    let stopGame = this.stopGame;
    let oneStep = this.oneStep;
    let takeSteps = this.takeSteps;
    let handleClear = this.handleClear;
    let newBoard = this.newBoard;
    return (
      <div>
        <div class="navbar">
          <h1>Conway's Game of Life</h1>
          <nav>
            {this.state.isRunning ? (
              <a href="javascript:;" role="button" onClick={stopGame}>
                stop
              </a>
            ) : (
              <a href="javascript:;" role="button" onClick={runGame}>
                run
              </a>
            )}
            |
            <a href="javascript:;" role="button" onClick={oneStep}>
              step
            </a>
            |
            <div>
              take{""}
              <input 
                type="text" 
                className="navinput"
                style={{ height: "2rem"}}
                value={this.state.steps} 
                onChange={this.handleStepsChange}
              />
              steps:{" "}
              <a href="javascript:;" role="button" onClick={takeSteps}>
                go
              </a>
            </div>
            |
            <a href="javascript:;" role="button" onClick={handleClear}>
              clear
            </a>
            |
            <div>
            speed:{" "}
              <input
                className="navinput"
                type="text"
                value={Math.round(1000 / this.state.interval)}
                onChange={this.handleIntervalChange}
              />{" "}
              generations per second
            </div>
            <div>
              {this.state.gens} generations run
            </div>
          </nav>
        </div>
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
            <Cell
              cell_size={this.state.cell_size}
              x={cell.x}
              y={cell.y}
              key={`${cell.x},${cell.y}`}
            />
          ))}
        </div>
        <div className="footer">
          topology:
          <form>
            <div className="radio">
              <label>
                <input
                  type="radio"
                  value="default"
                  checked={this.state.nextTopo === "default"}
                  onChange={this.handleTopoChange}
                />
                default
              </label>
            </div>
            <div className="radio">
              <label>
                <input
                  type="radio"
                  value="cylinder"
                  checked={this.state.nextTopo === "cylinder"}
                  onChange={this.handleTopoChange}
                />
                cylinder
              </label>
            </div>
            <div className="radio">
              <label>
                <input
                  type="radio"
                  value="mobius"
                  checked={this.state.nextTopo === "mobius"}
                  onChange={this.handleTopoChange}
                />
                Möbius band
              </label>
            </div>
            <div className="radio">
              <label>
                <input
                  type="radio"
                  value="torus"
                  checked={this.state.nextTopo === "torus"}
                  onChange={this.handleTopoChange}
                />
                torus
              </label>
            </div>
            <div className="radio">
              <label>
                <input
                  type="radio"
                  value="klein"
                  checked={this.state.nextTopo === "klein"}
                  onChange={this.handleTopoChange}
                />
                Klein bottle
              </label>
            </div>
            <div className="radio">
              <label>
                <input
                  type="radio"
                  value="rpp"
                  checked={this.state.nextTopo === "rpp"}
                  onChange={this.handleTopoChange}
                />
                real projective plane
              </label>
            </div>
          </form>
          rows:{" "}
          <input
            className="navinput"
            type="text"
            value={this.state.nextRows}
            onChange={this.handleRowsChange} />
          columns:{" "}
          <input
            className="navinput"
            type="text"
            value={this.state.nextCols}
            onChange={this.handleColsChange} />
          <a href="javascript:;" role="button" onClick={newBoard}>
            new board
          </a>
        </div>
      </div>
    );
  }
}
export default Game;
