class Board {

    constructor() {
        this.side = 750;
        this.board = new Array(this.side);
        for (let i = 0; i < this.side; ++i) {
            this.board[i] = new Array(this.side);
        }

        this.r = new Array(this.side);
        for (let i = 0; i < this.side; ++i) {
            this.r[i] = new Array(this.side);
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

        // TODO: check needed distribution
        for (let i = 0; i < this.side; ++i) {
            for (let j = 0; j < this.side; ++j) {
                const sum = this.computeNeighboursSum(i, j, couplingConstant);
                this.r[j][i] = 1.0/(1.0 + Math.exp(-2.0 * thermalEnergyInverse * sum));
                let randomNumber = Math.random();
                this.board[j][i] = (this.r[j][i] >= randomNumber ? 1 : -1);
            }
        }
    }
}


class CanvasHandler {

    constructor(side) {
        this.canvas = document.getElementById("board");
        this.context = this.canvas.getContext("2d");

        const boardWidth = this.canvas.width;
        /// https://gist.github.com/biovisualize/5400576
        this.imageData = this.context.getImageData(0, 0, boardWidth, boardWidth);
        this.data = this.imageData.data;

        this.redColorCode = [255, 0, 0, 255]; // alpha, blue, green, red
        this.greenColorCode = [255, 0, 255, 0];

        this.whiteColorCode = [255, 255, 255, 255];
        this.blackColorCode = [255, 0, 0, 0];
    }

    draw(board) {
        const boardWidth = board.side;
        for (let i = 0; i < boardWidth; ++i) {
            for (let j = 0; j < boardWidth; ++j) {
                let value = board.getStateAtCoordinates(j, i);

                let offset = 4 * (i * boardWidth + j);
                let colorCode = value > 0 ? this.blackColorCode : this.whiteColorCode;

                this.data[offset + 0] = colorCode[3];
                this.data[offset + 1] = colorCode[2];
                this.data[offset + 2] = colorCode[1];
                this.data[offset + 3] = colorCode[0];
            }
        }
        this.context.putImageData(this.imageData, 0, 0);
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

class ModelParameters {

    constructor() {
        this.boltzmannConstant = 1.0; // TODO: change value
        this.updataModelParameters();
    }

    updataModelParameters() {
        const temperatureValue = document.getElementById("temperatureFormControl").value;
        const couplingConstantValue = document.getElementById("couplingConstantFormControl").value;
        const outsideFieldValue = document.getElementById("fieldFormControl").value;

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

class App {

    constructor() {
        this.board = new Board();
        this.canvas = new CanvasHandler();
        this.settingsMenuButtons = new SettingsMenuButtons();
        this.modelParameters = new ModelParameters();

        this.board.randomizeState();
        this.canvas.draw(this.board);

        this.animationHandler = null;
    }

    randomizeModelState() {
        this.board.randomizeState();
        this.canvas.draw(this.board);
    }

    runModel() {
        this.settingsMenuButtons.enableStopButton();
        this.settingsMenuButtons.deactivateCentralAndRightButtons();
        this.loopModel(60);
    }

    loopModel(fps) {
        let then = new Date().getTime();

        fps = fps || 30;
        let interval = 1000/fps;

        let loop = (time) => {
            this.animationHandler = window.requestAnimationFrame(loop);
     
            var now = new Date().getTime();
            var delta = now - then;
     
            if (delta > interval) {
                then = now - (delta % interval);
                this.singleStep();
            }
        }
        return (loop(0));
    }

    stopModel() {
        this.settingsMenuButtons.enableStartButton();
        this.settingsMenuButtons.activateCentralAndRightButtons();
        window.cancelAnimationFrame(this.animationHandler);
        this.animationHandler = null;
    }

    singleStep() {
        this.board.performSingleStep(this.modelParameters);
        this.canvas.draw(this.board);
    }

    changeModelParameter() {
        // if (this.animationHandler !== null) {
        //     // TODO: work on this - is it async?
        //     this.stopModel();
        // }
        this.modelParameters.updataModelParameters();
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
