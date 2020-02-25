let L = 10;

function playSimulation(form) {
  const aliveAtStart = form.aliveAtStart.value;
  const stayValues = Array.from(form.sValues.selectedOptions).map(v => parseInt(v.value));
  const bornValues = Array.from(form.bValues.selectedOptions).map(v => parseInt(v.value));
  const rules = {stayValues, bornValues};
  const boardSize = parseInt(form.boardSize.value);
  L = boardSize;

  console.log(rules);
  
  let board = createEmptyBoard();
  let cellsToFill = chooseRandomCellsToFill(aliveAtStart);
  fillGivenCells(board, cellsToFill);
  drawBoard(board, rules);
}

function createEmptyBoard() {
  let board = new Array(L);
  for (let i = 0; i < L; ++i) {
    board[i] = new Array(L).fill(false);
  }
  return board;
}

let timer;

function drawBoard(board, rules) {
  timer = setInterval(function(){ 
    drawPatternOnCanvas(board); 
    board = updateBoard(board, rules);
  }, 1000);
}

function stopRedrawingBoard() {
  clearInterval(timer); 
}


function drawPatternOnCanvas(pattern) {

  let canvas = document.getElementById("lifeBoard");
  let canvasSide = canvas.width;
  let rectangleSide = canvasSide/L;

  let ctx = canvas.getContext("2d");

  for (let i = 0; i < L; ++i) {
    for (let j = 0; j < L; ++j) {
      ctx.beginPath();
      ctx.fillStyle = pattern[i][j] ? "black" : "white";
      ctx.rect(i * rectangleSide, j*rectangleSide, rectangleSide, rectangleSide);
      ctx.fill();
      ctx.strokeStyle = "black";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
}

function chooseRandomCellsToFill(percentageOfCellsToFill) {
  const numberOfCellsToFill = percentageOfCellsToFill * (L * L) / 100;
  cellsToFill = new Array();
  while (cellsToFill.length < numberOfCellsToFill) {
    randomCell = chooseRandomCell();
    if (!checkIfCellAlreadyDrawn(cellsToFill, randomCell)) {
      cellsToFill.push(randomCell);
    }
  }
  return cellsToFill;
}


function chooseRandomCell() {
  let x = Math.floor(Math.random() * L);
  let y = Math.floor(Math.random() * L);
  return {x, y};
}

function checkIfCellAlreadyDrawn(cells, randomCell) {
  return cells.find((cell) => {return cell.x === randomCell.x && cell.y === randomCell.y; }) !== undefined;
}


function fillGivenCells(board, coordinatesOfCellsToFill) {
  for(let cell of coordinatesOfCellsToFill) {
    board[cell.x][cell.y] = true;
  }
}


function updateBoard(currentBoard, rules) {
  newBoard = createEmptyBoard();
  for (let i = 0; i < L; ++i) {
    for (let j = 0; j < L; ++j) {
      newBoard[i][j] = decideCellsFate(currentBoard, i, j, rules);
    }
  }
  return newBoard;
}


function countAliveNeighbours(board, x, y) {
  let aliveNeighbours = 0;
  for (let i = -1; i <= 1; ++i) {
    for (let j = -1; j <= 1; ++j) {
      if (i !== 0 && j !== 0) {
        const [neighbourX, neighbourY] = getNeighbourCoordinates(x, y, i, j);
        aliveNeighbours += board[neighbourX][neighbourY] ? 1 : 0;
      }
    }
  }
  return aliveNeighbours;
}


function getNeighbourCoordinates(x, y, xOffset, yOffset) {
  let newX = x, newY = y;
  if (x + xOffset < 0) newX = L + xOffset;
  else newX = (newX + xOffset) % L;

  if (y + yOffset < 0) newY = L + yOffset;
  else newY = (newY + yOffset) % L;

  return [newX, newY];
}

function decideCellsFate(board, x, y, rules) {
  let numberOfAliveNeighbours = countAliveNeighbours(board, x, y);
  if (board[x][y] === false) {
    return rules.bornValues.find(v => v === numberOfAliveNeighbours) !== undefined;
  }
  else {
    return rules.stayValues.find(v => v === numberOfAliveNeighbours) !== undefined;
  }
}