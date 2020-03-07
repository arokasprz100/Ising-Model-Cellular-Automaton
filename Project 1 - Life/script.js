let ratiosOfAliveCells = new Array();
let chartSettings = {
  line : null,
  xScale : null,
  yScale: null,
  xAxis : null
};
let rules = null;
let board = null;
let timer = null;

function validateFormData(rules) {
    let errorMessages = [];
    if(rules.aliveAtStart < 0 || rules.aliveAtStart > 100) errorMessages.push("% of alive cells should be between 0 and 100");
    if(rules.stayValues.length === 0) errorMessages.push("Please provide at least one stay value");
    if(rules.bornValues.length === 0) errorMessages.push("Please provide at least one born value");

    if(errorMessages.length > 0) {
        alert(errorMessages.join(" \n"));
        return false;
    }
    return true;
}

function extractRulesFromForm(form) {
  const aliveAtStart = form.aliveAtStart.value;
  const stayValues = Array.from(form.sValues.selectedOptions).map(v => parseInt(v.value));
  const bornValues = Array.from(form.bValues.selectedOptions).map(v => parseInt(v.value));
  const boardSize = parseInt(form.boardSize.value);
  const redrawInterval = parseInt(form.redrawInterval.value);

  const rulesFromForm = {stayValues, bornValues, aliveAtStart, boardSize, redrawInterval};
  return rulesFromForm;
}

function playSimulation() {
  displaySimulationRunningMenu();
  timer = setInterval(function() { 
    generateNextStep();
  }, rules.redrawInterval);
}


function generateNextStep() {
  board = updateBoard();
  drawPatternOnCanvas();
  ratiosOfAliveCells.push([ratiosOfAliveCells.length, computeAliveCellsRatio()]);
  drawDataOnDensityChart();
}

function generateInitialBoard(form) {
  rules = extractRulesFromForm(form);
  if(validateFormData(rules)){
    drawRandomInitialBoard();
  }
}

function drawRandomInitialBoard() {
  board = createEmptyBoard(rules.boardSize);
  let cellsToFill = chooseRandomCellsToFill(rules.aliveAtStart, rules.boardSize);
  fillGivenCells(cellsToFill);
  ratiosOfAliveCells = new Array();
  ratiosOfAliveCells.push([ratiosOfAliveCells.length, computeAliveCellsRatio()]);
  displaySimulationReadyToRunMenu();
  drawPatternOnCanvas();
}

function createEmptyBoard(boardSize) {
  let emptyBoard = new Array(boardSize);
  for (let i = 0; i < boardSize; ++i) {
    emptyBoard[i] = new Array(boardSize).fill(false);
  }
  return emptyBoard;
}

function stopRedrawingBoard() {
  clearInterval(timer);
  timer = false;
  displaySimulationStoppedMenu();
}

function drawPatternOnCanvas() {
  let boardSizeInCells = board.length;

  let canvas = document.getElementById("lifeBoard");
  let canvasSide = canvas.width;
  let rectangleSide = canvasSide/boardSizeInCells;

  let ctx = canvas.getContext("2d");

  for (let i = 0; i < boardSizeInCells; ++i) {
    for (let j = 0; j < boardSizeInCells; ++j) {
      ctx.beginPath();
      ctx.fillStyle = board[i][j] ? "black" : "white";
      ctx.rect(j * rectangleSide, i * rectangleSide, rectangleSide, rectangleSide);
      ctx.fill();
      ctx.strokeStyle = "black";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
}

function chooseRandomCellsToFill(percentageOfCellsToFill, boardSize) {
  const numberOfCellsToFill = percentageOfCellsToFill * (boardSize * boardSize) / 100;
  cellsToFill = new Array();
  while (cellsToFill.length < numberOfCellsToFill) {
    randomCell = chooseRandomCell(boardSize);
    if (!checkIfCellAlreadyDrawn(cellsToFill, randomCell)) {
      cellsToFill.push(randomCell);
    }
  }
  return cellsToFill;
}


function chooseRandomCell(boardSize) {
  let x = Math.floor(Math.random() * boardSize);
  let y = Math.floor(Math.random() * boardSize);
  return {x, y};
}

function checkIfCellAlreadyDrawn(cells, randomCell) {
  return cells.find((cell) => {return cell.x === randomCell.x && cell.y === randomCell.y; }) !== undefined;
}


function fillGivenCells(coordinatesOfCellsToFill) {
  for(let cell of coordinatesOfCellsToFill) {
    board[cell.x][cell.y] = true;
  }
}


function updateBoard() {
  newBoard = createEmptyBoard(rules.boardSize);
  for (let i = 0; i < rules.boardSize; ++i) {
    for (let j = 0; j < rules.boardSize; ++j) {
      newBoard[i][j] = decideCellsFate(i, j);
    }
  }
  return newBoard;
}

function computeAliveCellsRatio() {
  let numberOfAllCells = rules.boardSize * rules.boardSize;
  let numberOfAliveCells = 0;
  for (let i = 0; i < rules.boardSize; ++i) {
    for (let j = 0; j < rules.boardSize; ++j) {
      numberOfAliveCells = board[i][j] ? numberOfAliveCells + 1 : numberOfAliveCells;
    }
  }
  return numberOfAliveCells/numberOfAllCells;
}


function countAliveNeighbours(x, y, boardSize) {
  let aliveNeighbours = 0;
  for (let i = -1; i <= 1; ++i) {
    for (let j = -1; j <= 1; ++j) {
      if (!(i === 0 && j === 0)) {
        const [neighbourX, neighbourY] = getNeighbourCoordinates(x, y, i, j, boardSize);
        aliveNeighbours += board[neighbourX][neighbourY] ? 1 : 0;
      }
    }
  }
  return aliveNeighbours;
}


function getNeighbourCoordinates(x, y, xOffset, yOffset, boardSize) {
  let newX = x, newY = y;
  if (x + xOffset < 0) newX = boardSize + xOffset;
  else newX = (newX + xOffset) % boardSize;

  if (y + yOffset < 0) newY = boardSize + yOffset;
  else newY = (newY + yOffset) % boardSize;

  return [newX, newY];
}

function decideCellsFate(x, y) {
  let numberOfAliveNeighbours = countAliveNeighbours(x, y, rules.boardSize);
  console.log(x + ", " + y + ": " + numberOfAliveNeighbours);
  if (board[x][y] === false) {
    return rules.bornValues.find(v => v === numberOfAliveNeighbours) !== undefined;
  }
  else {
    return rules.stayValues.find(v => v === numberOfAliveNeighbours) !== undefined;
  }
}


function displaySimulationSettingsMenu() {
  let settingsMenu = document.getElementById("settingsMenu");
  settingsMenu.innerHTML = `
  <form id="settingsMenu">

    Click while holding CTRL to choose more than one stay/born value. <br/><br/>

    <label for="sValues">S (stay)</label>
    <select class="form-control" id="sValues" name="sValues" multiple>
      <option>0</option>
      <option>1</option>
      <option>2</option>
      <option>3</option>
      <option>4</option>
      <option>5</option>
      <option>6</option>
      <option>7</option>
      <option>8</option>
    </select>

    <label for="bValues">B (born)</label>
    <select class="form-control" id="bValues" name="bValues" multiple>
      <option>0</option>
      <option>1</option>
      <option>2</option>
      <option>3</option>
      <option>4</option>
      <option>5</option>
      <option>6</option>
      <option>7</option>
      <option>8</option>
    </select>

    <label for="aliveAtStart">% of alive cells at the begining</label>
    <input class="form-control" id="aliveAtStart" name="aliveAtStart" type="number" min="0" max="100" step="0.1" value="0"/>

    <label for="boardSize"> Board size (side)</label>
    <select class="form-control" id="boardSize" name="boardSize">
      <option>10</option>
      <option>25</option>
      <option>50</option>
      <option>100</option>
    </select>

    <label for="redrawInterval"> Redraw interval [ms]</label>
    <select class="form-control" id="redrawInterval" name="redrawInterval">
      <option>1000</option>
      <option>500</option>
      <option>250</option>
    </select>

    <input class="my-2 form-control" type="button" onclick="generateInitialBoard(this.form)" value="Generate initial board" />
  </form>
  `;
}


function displaySimulationReadyToRunMenu() {
  let settingsMenu = document.getElementById("settingsMenu");
  settingsMenu.innerHTML = `
  <table class="table">
    <tr><th>Stay</th><td>${rules.stayValues}</td></tr>
    <tr><th>Born</th><td>${rules.bornValues}</td></tr>
    <tr><th>Alive</th><td>${rules.aliveAtStart} %</td></tr>
    <tr><th>Board size</th><td>${rules.boardSize}x${rules.boardSize}</td></tr>
  </table>
  <form id="settingsMenu">
    <input class="my-2 form-control" type="button" onclick='playSimulation()' value="Start" />
    <input class="my-2 form-control" type="button" onclick='generateNextStep()' value="Next step" />
    <input class="my-2 form-control" type="button" onclick='drawRandomInitialBoard()' value="Generate again" />
    <input class="my-2 form-control" type="button" onclick="displaySimulationSettingsMenu()" value="Edit" />
  </form>
  `;
}


function displaySimulationRunningMenu() {
  let settingsMenu = document.getElementById("settingsMenu");
  settingsMenu.innerHTML = `
  <form id="settingsMenu">
    <input class="my-2 form-control" type="button" onclick='stopRedrawingBoard()' value="Stop" />
  </form>
  `;
}


function displaySimulationStoppedMenu(){
  let settingsMenu = document.getElementById("settingsMenu");
  settingsMenu.innerHTML = `
  <form id="settingsMenu">
    <input class="my-2 form-control" type="button" onclick='playSimulation()' value="Resume" />
    <input class="my-2 form-control" type="button" onclick='generateNextStep()' value="Next step" />
    <input class="my-2 form-control" type="button" onclick="displaySimulationSettingsMenu()" value="Edit" />
  </form>
  `;
}


function drawDensityChart() {

  let margin = {top: 50, right: 50, bottom: 50, left: 50};
  let width = 1000 - margin.left - margin.right;
  let height = 400 - margin.top - margin.bottom;

  let svg = d3.select("#densityChart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  let xScale = chartSettings.xScale = d3.scaleLinear()
    .domain([0, 10])
    .range([0, width]);

  // add the y Axis
  let yScale = chartSettings.yScale = d3.scaleLinear()
    .domain([0, 1])
    .range([height, 0]);

  let line = chartSettings.line = d3.line()
    .x(function(d) { return xScale(d[0]); })
    .y(function(d) { return yScale(d[1]); })
    .curve(d3.curveMonotoneX);

  let xAxis = chartSettings.xAxis = svg.append("g")
    .attr("class", "xaxis")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(xScale));

  svg.append("g")
    .attr("class", "yaxis")
    .call(d3.axisLeft(yScale));

  svg.append("path").attr("class", "line")
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5)
    .attr("d", line(ratiosOfAliveCells));

  svg.append("svg:text")
    .attr("x", -180)
    .attr("y", -40)
    .attr("dy", ".1em")
    .attr("transform", "rotate(-90)")
    .text("Density");

  svg.append("svg:text")
    .attr("x", 430)
    .attr("y", 340)
    .attr("dy", ".1em")
    .text("Time");
}

function drawDataOnDensityChart() {

  let svg = d3.select("#densityChart").select("svg");

  let rightValue = ratiosOfAliveCells.length > 10 ? ratiosOfAliveCells.length : 10;
  chartSettings.xScale.domain([0, rightValue]);
  chartSettings.xAxis.call(d3.axisBottom(chartSettings.xScale));

  svg.select(".line").attr("d", chartSettings.line(ratiosOfAliveCells));

  svg.select("g").selectAll('circle').remove();
  svg.select("g").selectAll('circle')
    .data(ratiosOfAliveCells)
    .enter()
    .append('circle')
    .attr('r',3).attr('fill','black')
    .attr('cx', function(d) { return chartSettings.xScale(d[0]); })
    .attr('cy', function(d) { return chartSettings.yScale(d[1]); });
}

