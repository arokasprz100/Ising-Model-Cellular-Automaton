class Board {

    constructor(boardSize) {
        this.side = boardSize;
        this.board = new Array(this.side);
        for (let i = 0; i < this.side; ++i) {
            this.board[i] = new Array(this.side);
        }
    }

    getStateAtCoordinates(x, y) {
        return this.board[x][y];
    }

    randomizeState() {
        for (let i = 0; i < this.side; ++i) {
            for (let j = 0; j < this.side; ++j) {
                this.board[j][i] = (Math.random() >= 0.5 ? 1 : -1);
            }
        }
    }

    computeNeighboursSum(x, y, couplingConstant) {
        let x_1 = x - 1 < 0 ? this.side - 1 : x - 1;
        let y_1 = y - 1 < 0 ? this.side - 1 : y - 1;

        let x_2 = x + 1 >= this.side ? 0 : x + 1;
        let y_2 = y + 1 >= this.side ? 0 : y + 1;

        return couplingConstant * (this.board[y_1][x] + this.board[y_2][x] + this.board[y][x_1] + this.board[y][x_2]);
    }

    performSingleStep(modelParameters) {
        const thermalEnergyInverse = modelParameters.thermalEnergyInverse;
        const couplingConstant = modelParameters.couplingConstant;
        const outsideField = modelParameters.outsideField;

        let magnetization = 0;

        // TODO: check needed distribution
        for (let i = 0; i < this.side; ++i) {
            for (let j = 0; j < this.side; ++j) {
                const sum = this.computeNeighboursSum(i, j, couplingConstant) + outsideField;
                if (isFinite(thermalEnergyInverse)) {
                    const r = 1.0/(1.0 + Math.exp(-2.0 * thermalEnergyInverse * sum));
                    let randomNumber = Math.random();
                    this.board[j][i] = (r >= randomNumber ? 1 : -1);
                }
                else {
                    this.board[j][i] = sum > 0 ? 1 : -1;
                }
                magnetization += this.board[j][i];
            }
        }
        return magnetization/(this.side * this.side);
    }

    resizeBoard(newSize) {
        for (let i = 0; i < this.side; ++i) {
            this.board[i] = null;
        }
        this.side = newSize;
        this.board = new Array(this.side);
        for (let i = 0; i < this.side; ++i) {
            this.board[i] = new Array(this.side);
        }
    }

}


class CanvasHandler {

    constructor() {
        this.canvas = document.getElementById("board");
        this.context = this.canvas.getContext("2d");

        const boardWidth = this.canvas.width;
        /// https://gist.github.com/biovisualize/5400576
        this.imageData = this.context.getImageData(0, 0, boardWidth, boardWidth);
        this.data = this.imageData.data;
    }


    draw(board, colorSettings) {
        const canvasWidth = this.canvas.width;
        const ratio = this.canvas.width / board.side;
        for (let i = 0; i < canvasWidth; i = i + ratio) {
            for (let j = 0; j < canvasWidth; j = j + ratio) {

                let value = board.getStateAtCoordinates(j/ratio, i/ratio);
                let colorCode = value > 0 ? colorSettings[0] : colorSettings[1];
                this.drawSingleSpin(j, i, ratio, colorCode, canvasWidth);
            }
        }
        this.context.putImageData(this.imageData, 0, 0);
    }

    drawSingleSpin(x, y, ratio, colorCode, canvasWidth) {

        for (let i = 0; i < ratio; ++i) {
            for (let j = 0; j < ratio; ++j) {

                let offset = 4 * ((y + i) * this.canvas.width + (x + j));
                this.data[offset + 0] = colorCode[3];
                this.data[offset + 1] = colorCode[2];
                this.data[offset + 2] = colorCode[1];
                this.data[offset + 3] = colorCode[0];
            }
        }
    }
}


class SettingsMenuButtons {

    constructor() {
        this.randomizeButton = this.createBootstrapMenuButton("Randomize", randomizeModelState);
        this.startButton = this.createBootstrapMenuButton("Start", runModel);
        this.stopButton = this.createBootstrapMenuButton("Stop", stopModel);
        this.singleStepButton = this.createBootstrapMenuButton("Single step", singleStep);

        this.leftButton = this.createButtonDivWrapper(this.startButton);
        this.centralButton = this.createButtonDivWrapper(this.singleStepButton);
        this.rightButton = this.createButtonDivWrapper(this.randomizeButton);

        let buttonSpace = document.getElementById("menuButtons");
        buttonSpace.appendChild(this.leftButton);
        buttonSpace.appendChild(this.centralButton);
        buttonSpace.appendChild(this.rightButton);

    }

    createBootstrapMenuButton(title, onClickHandler) {
        let newButton = document.createElement("button");
        newButton.innerHTML = title;
        newButton.onclick = onClickHandler;
        newButton.classList.add("btn", "btn-dark", "m-2", "menuButton");
        return newButton;
    }

    createButtonDivWrapper(button) {
        let divWrapper = document.createElement("div");
        divWrapper.classList.add("col");
        divWrapper.appendChild(button);
        return divWrapper;
    }

    enableStopButton() {
        this.leftButton.replaceChild(this.stopButton, this.startButton);
    }

    enableStartButton() {
        this.leftButton.replaceChild(this.startButton, this.stopButton);
    }

    deactivateCentralAndRightButtons() {
        this.centralButton.firstElementChild.disabled = true;
        this.rightButton.firstElementChild.disabled = true;
    }

    activateCentralAndRightButtons() {
        this.centralButton.firstElementChild.disabled = false;
        this.rightButton.firstElementChild.disabled = false;
    }

}


class ModelSettings {

    constructor() {
        const redColorCode = [255, 0, 0, 255]; // alpha, blue, green, red
        const greenColorCode = [255, 0, 255, 0];
        const blueColorCode = [255, 255, 0, 0];
        const whiteColorCode = [255, 255, 255, 255];
        const blackColorCode = [255, 0, 0, 0];

        this.possibleResolutions = [500, 250, 100, 50];
        this.possibleColorPairs = [[blackColorCode, whiteColorCode], [redColorCode, greenColorCode], [redColorCode, blueColorCode]];
        this.currentResolution = this.possibleResolutions[0];
        this.currentColorPair = this.possibleColorPairs[0];

        this.addOptionsToResolutionSelect();
        this.addOptionsToColorsSelect();
    }

    addOptionsToResolutionSelect() {
        let resolutionSelect = document.getElementById("resolutionSelect");
        for (const resolution of this.possibleResolutions) {
            let option = document.createElement("option");
            option.value = resolution;
            option.text = resolution;
            resolutionSelect.appendChild(option);
        }
        resolutionSelect.selectedIndex = 0;
    }

    addOptionsToColorsSelect() {
        let colorsSelect = document.getElementById("colorsSelect");
        const possibleOptions = [["black", "white"], ["red", "green"], ["red", "blue"]];
        for (const colorPair of possibleOptions) {
            let option = document.createElement("option");
            option.value = colorPair[0] + colorPair[1];
            option.text = "UP: " + colorPair[0] + " DOWN: " + colorPair[1];
            colorsSelect.appendChild(option);
        }
    }

    updateResolution(resolution) {
        this.currentResolution = resolution;
    }

    updateColorPair(colorString) {
        if (colorString == "blackwhite") {
            this.currentColorPair = this.possibleColorPairs[0];
        }
        else if (colorString == "redgreen") {
            this.currentColorPair = this.possibleColorPairs[1];
        }
        else if (colorString == "redblue") {
            this.currentColorPair = this.possibleColorPairs[2];
        }
    }

    deactivateModelSettings() {
        document.getElementById("resolutionSelect").disabled = true;
        document.getElementById("colorsSelect").disabled = true;

    }

    activateModelSettings() {
        document.getElementById("resolutionSelect").disabled = false;
        document.getElementById("colorsSelect").disabled = false;
    }

}


class ModelParameters {

    constructor() {
        this.boltzmannConstant = 1.0; // TODO: change value
        this.updataModelParameters();
    }

    updataModelParameters() {
        const temperatureValue = parseFloat(document.getElementById("temperatureFormControl").value);
        const couplingConstantValue = parseFloat(document.getElementById("couplingConstantFormControl").value);
        const outsideFieldValue = parseFloat(document.getElementById("fieldFormControl").value);

        this.updateThermalEnergyInverse(temperatureValue);
        this.updateCouplingConstant(couplingConstantValue);
        this.updateOutsideFieldH(outsideFieldValue);
    }

    updateThermalEnergyInverse(temperature) {
        this.thermalEnergyInverse = 1.0/(this.boltzmannConstant * temperature);
    }

    updateOutsideFieldH(fieldValue) {
        this.outsideField = fieldValue;
    }

    updateCouplingConstant(constantValue) {
        this.couplingConstant = constantValue;
    }

}


class MagnetizationChart {

    constructor(totalWidth, totalHeight) {

        this.data = [];
        this.lowerDataBound = 0;
        this.nextPointNumber = 0;

        const margin = { top: 50, right: 50, bottom: 50, left: 50 };
        const chartWidth = totalWidth - margin.left - margin.right;
        const chartHeight = totalHeight - margin.top - margin.bottom;

        this.chartSVG = d3.select("#magnetizationChart").append("svg")
            .attr("width", totalWidth).attr("height", totalHeight).append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        let tooltip = d3.select("body").append("div") 
            .attr("class", "tooltip")
            .style("opacity", 0);

        this.xScale = d3.scaleLinear().domain([0, 10]).range([0, chartWidth]);
        this.yScale = d3.scaleLinear().domain([-1, 1]).range([chartHeight, 0]);

        this.line = d3.line().x((d) => {return this.xScale(d[0]); })
            .y((d) => {return this.yScale(d[1]); }).curve(d3.curveMonotoneX);

        this.xAxis = this.chartSVG.append("g").attr("class", "xaxis")
            .attr("transform", "translate(0," + chartHeight + ")")
            .call(d3.axisBottom(this.xScale));

        this.yAxis = this.chartSVG.append("g").attr("class", "yaxis")
            .call(d3.axisLeft(this.yScale));

        this.chartSVG.append("path").attr("class", "line")
            .attr("fill", "none").attr("stroke", "steelblue")
            .attr("stroke-width", 1.5).attr("d", this.line(this.data));

        this.chartSVG.append("svg:text").attr("x", -200).attr("y", -40)
            .attr("dy", ".1em").attr("transform", "rotate(-90)").text("Magnetization");

        this.chartSVG.append("svg:text").attr("x", totalWidth/2.0 - 70).attr("y", totalHeight - 60)
            .attr("dy", ".1em").text("Time");

        this.dataLowerBoundInput = document.getElementById("lowerBoundRange");
        this.dataLowerBoundInput.min = 0;
        this.dataLowerBoundInput.max = 10;
        this.dataLowerBoundInput.value = 0;
    }

    appendMagnetization(magnetization) {

        this.data.push([this.nextPointNumber, magnetization]);
        ++this.nextPointNumber;
        if (this.data.length > 250) {
            this.lowerDataBound = this.nextPointNumber - 250;
            this.dataLowerBoundInput.value = this.lowerDataBound;
        }
        
        this.dataLowerBoundInput.max = this.data.length > 10 ? this.nextPointNumber - 1 : 10;
        this.redrawChart();
    }

    redrawChart() {
        let tooltip = d3.select(".tooltip");
        const dataSlice = this.data.slice(this.lowerDataBound);

        const xAxisRightBound = this.data.length > 10 ? this.nextPointNumber - 1 : 10;
        this.xScale.domain([this.lowerDataBound, xAxisRightBound]);
        this.xAxis.call(d3.axisBottom(this.xScale));

        this.chartSVG.select(".line").attr("d", this.line(dataSlice));

        this.chartSVG.selectAll('circle').remove();
        this.chartSVG.selectAll("circle")
            .data(dataSlice).enter().append('circle')
                .attr('r', 1.5).attr('fill', 'black')
                .attr('cx', (d) => { return this.xScale(d[0]); })
                .attr('cy', (d) => { return this.yScale(d[1]); })
                .on("mouseover", function(d) {
                    tooltip.transition().duration(200).style("opacity", .9);
                    tooltip.html(d[1]).style("left", (d3.event.pageX) + "px")
                        .style("top", (d3.event.pageY - 28) + "px");
                })
                .on("mouseout", function(d) {
                    tooltip.transition().duration(500).style("opacity", 0); 
                });
    }

    reset() {
        this.nextPointNumber = 0;
        this.data = [];
        this.lowerDataBound = 0;
        this.xScale.domain([0, 10]);
        this.xAxis.call(d3.axisBottom(this.xScale));
        this.chartSVG.select(".line").attr("d", this.line(this.data));
        this.chartSVG.selectAll('circle').remove();

        this.dataLowerBoundInput.min = 0;
        this.dataLowerBoundInput.max = 10;
        this.dataLowerBoundInput.value = 0;
    }

    resizeChart(value) {
        this.lowerDataBound = value;
        this.redrawChart();
    }

    deactivateRangeSelection() {
        document.getElementById("lowerBoundRange").disabled = true;
    }

    activateRangeSelection() {
        document.getElementById("lowerBoundRange").disabled = false;
    }
}


class App {

    constructor() {
        this.modelParameters = new ModelParameters();
        this.modelSettings = new ModelSettings();

        this.board = new Board(this.modelSettings.currentResolution);
        this.canvas = new CanvasHandler();
        this.settingsMenuButtons = new SettingsMenuButtons();

        this.board.randomizeState();
        this.canvas.draw(this.board, this.modelSettings.currentColorPair);
        this.animationHandler = null;

        this.magnetizationChart = new MagnetizationChart(500, 400);
    }

    randomizeModelState() {
        this.board.randomizeState();
        this.canvas.draw(this.board, this.modelSettings.currentColorPair);
        this.magnetizationChart.reset();
    }

    runModel() {
        this.settingsMenuButtons.enableStopButton();
        this.settingsMenuButtons.deactivateCentralAndRightButtons();
        this.modelSettings.deactivateModelSettings();
        this.magnetizationChart.deactivateRangeSelection();
        this.loopModel();
    }

    loopModel() {
        this.singleStep();
        this.animationHandler = window.requestAnimationFrame(() => this.loopModel());
    }

    stopModel() {
        this.settingsMenuButtons.enableStartButton();
        this.settingsMenuButtons.activateCentralAndRightButtons();
        this.modelSettings.activateModelSettings();
        this.magnetizationChart.activateRangeSelection();
        window.cancelAnimationFrame(this.animationHandler);
        this.animationHandler = null;
    }

    singleStep() {
        const magnetization = this.board.performSingleStep(this.modelParameters);
        this.canvas.draw(this.board, this.modelSettings.currentColorPair);
        this.magnetizationChart.appendMagnetization(magnetization);
    }

    changeModelParameter() {
        this.modelParameters.updataModelParameters();
    }

    changeModelResolution(newResolution) {
        this.modelSettings.updateResolution(newResolution);
        this.board.resizeBoard(newResolution);
        this.randomizeModelState();
    }

    changeModelColors(newColors) {
        this.modelSettings.updateColorPair(newColors);
        this.canvas.draw(this.board, this.modelSettings.currentColorPair);
    }

    resizeMagnetizationChart(newLowerBound) {
        this.magnetizationChart.resizeChart(newLowerBound);
    }

}


let app = null;

function initializeApp() {
    app = new App();
}

function randomizeModelState(event) {
    event.preventDefault();
    app.randomizeModelState();
}

function runModel(event) {
    event.preventDefault();
    app.runModel();
}

function stopModel(event) {
    event.preventDefault();
    app.stopModel();
}

function singleStep(event) {
    event.preventDefault();
    app.singleStep();
}

function updateModelParameter() {
    app.changeModelParameter();
}

function updateResolution(event) {
    app.changeModelResolution(parseInt(event.target.value));
}

function updateColorPair(event) {
    app.changeModelColors(event.target.value);
}

function resizeMagnetizationChart(event) {
    console.log("Test");
    app.resizeMagnetizationChart(parseInt(event.target.value));
}