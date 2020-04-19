class Board {

    constructor() {
        this.side= 750;
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
                this.board[j][i] = Math.random() >= 0.5;
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
        this.buf = new ArrayBuffer(this.imageData.data.length);
        this.buf8 = new Uint8ClampedArray(this.buf);
        this.data = new Uint32Array(this.buf);

        this.redColorCode = (
            (255 << 24) |    // alpha
            (0 << 16) |    // blue
            (0 <<  8) |    // green
            255) >>> 0; // >>> to uint32
        this.greenColorCode = ((255 << 24) | (0 << 16) | (255 <<  8) | 0) >>> 0;

        this.whiteColorCode = ((255 << 24) | (255 << 16) | (255 <<  8) | 255) >>> 0;
        this.blackColorCode = ((255 << 24) | (0 << 16) | (0 <<  8) | 0) >>> 0;
    }

    draw(board) {
        const boardWidth = board.side;
        for (let i = 0; i < boardWidth; ++i) {
            for (let j = 0; j < boardWidth; ++j) {
                let value = board.getStateAtCoordinates(j, i);
                this.data[i * boardWidth + j] = value ? this.blackColorCode : this.whiteColorCode;
            }
        }
        this.imageData.data.set(this.buf8);
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

class App {

    constructor() {
        this.board = new Board();
        this.canvas = new CanvasHandler();
        this.settingsMenuButtons = new SettingsMenuButtons();

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
        this.loopModel();
    }

    loopModel() {
        this.singleStep();
        this.animationHandler = window.requestAnimationFrame(() => this.loopModel());
    }

    stopModel() {
        this.settingsMenuButtons.enableStartButton();
        this.settingsMenuButtons.activateCentralAndRightButtons();
        window.cancelAnimationFrame(this.animationHandler);
    }

    singleStep() {
        this.board.randomizeState();
        this.canvas.draw(this.board);
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