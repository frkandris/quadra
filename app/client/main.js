const gameLevelEnvironment = require('./includes/gameLevelEnvironment');

const numberOfPlayers = 2;
let playerLevelEnvironment = [];
for (let i = 0; i < numberOfPlayers; i++) {
    playerLevelEnvironment[i] = require('./includes/playerLevelEnvironment');
}

const blockMap = require('./includes/blockMap');
const colorRelated = require('./includes/colorRelated');
const statRelated = require('./includes/statRelated');
const drawBlock = require('./includes/drawBlock');
const chat = require('./includes/chat');
const recordGame = require('./includes/recordGame');
const blockGenerator = require('./includes/blockGenerator');


const calculationAreaDefinitions = require('./includes/calculationAreaDefinitions');
const currentCalculationArea = calculationAreaDefinitions.currentCalculationArea;
const tempCalculationArea = calculationAreaDefinitions.tempCalculationArea;
const currentGravityCalculationArea = calculationAreaDefinitions.currentGravityCalculationArea;

const socket = io();

function sendGameEvent(eventValue) {
    socket.emit('clientEvent', eventValue, playerLevelEnvironment[0].playerId);
}
socket.on('serverEvent', function(serverEvent, playerId){
    console.log('serverEvent', serverEvent, playerId);
});

    // this function gets called if there was a keyboard event

    function checkKeyboardInput(event) {

        // if there is no saved game being replayed now, handle inputs from the keyboard
        if(!replayingAGame) {
            switch (event.key) {
                case 'ArrowUp':
                    recordGame.saveGameEvent(playerLevelEnvironment[0].frameNumber, 'keyPressed', 'rotateRight');
                    sendGameEvent('rotateRight');
                    handlePlayerInput('rotateRight');
                    break;
                case 'ArrowDown':
                    recordGame.saveGameEvent(playerLevelEnvironment[0].frameNumber, 'keyPressed', 'rotateLeft');
                    sendGameEvent('rotateLeft');
                    handlePlayerInput('rotateLeft');
                    break;
                case 'ArrowLeft':
                    recordGame.saveGameEvent(playerLevelEnvironment[0].frameNumber, 'keyPressed', 'moveLeft');
                    sendGameEvent('moveLeft');
                    handlePlayerInput('moveLeft');
                    break;
                case 'ArrowRight':
                    recordGame.saveGameEvent(playerLevelEnvironment[0].frameNumber, 'keyPressed', 'moveRight');
                    sendGameEvent('moveRight');
                    handlePlayerInput('moveRight');
                    break;
                case ' ':
                    recordGame.saveGameEvent(playerLevelEnvironment[0].frameNumber, 'keyPressed', 'instantDrop');
                    sendGameEvent('instantDrop');
                    handlePlayerInput('instantDrop');
                    break;
                default:
                    return;
            }
        }
        event.preventDefault();
    }


    // this function feeds the handlePlayerInput function with keyboard actions from the recording

    function checkPlayerInputFromRecording() {
        for (let i = 0; i < preloadedGameString.length; i++) {
            if (preloadedGameString[i].frameNumber === playerLevelEnvironment[0].frameNumber) {
                handlePlayerInput(preloadedGameString[i].eventValue);
            }
        }
    }

    function handlePlayerInput(event) {
        switch (event) {
            case 'rotateRight':
                moveBlockInCalculationArea('rotateRight');
                break;
            case 'rotateLeft':
                moveBlockInCalculationArea('rotateLeft');
                break;
            case 'moveLeft':
                moveBlockInCalculationArea('moveLeft');
                break;
            case 'moveRight':
                moveBlockInCalculationArea('moveRight');
                break;
            case 'instantDrop':
                // instant drop
                while (playerLevelEnvironment[0].moveCanBeDone === true) {
                    playerLevelEnvironment[0].yPlayArea = playerLevelEnvironment[0].yPlayArea + gameLevelEnvironment.pixelSize;
                    moveBlockInCalculationArea('moveDown');
                }
                break;
            default:
                return;
        }
    }


    // this function calculates what happens, when the block moves & rotates in currentCalculationArea

    function moveBlockInCalculationArea(direction){
        let xOnCalculationArea;
        let yOnCalculationArea;
        let x;
        let y;
        let xCalculationAreaModifier = 0;
        let yCalculationAreaModifier = 0;
        let rotationModifier = 0;
        let isRectangleFilled;

        let numberOfRotations = Object.keys(blockMap[playerLevelEnvironment[0].blockIndex]).length;

        if (direction === 'moveDown') {
            // calculationArea modifications
            yCalculationAreaModifier = -1;
        }
        if (direction === 'moveLeft') {
            // calculationArea modifications
            xCalculationAreaModifier = 1;
            // playArea modifications
            playerLevelEnvironment[0].xPlayArea = playerLevelEnvironment[0].xPlayArea - gameLevelEnvironment.pixelSize;
        }
        if (direction === 'moveRight') {
            // calculationArea modifications
            xCalculationAreaModifier = -1;
            // playArea modifications
            playerLevelEnvironment[0].xPlayArea = playerLevelEnvironment[0].xPlayArea + gameLevelEnvironment.pixelSize;
        }
        if (direction === 'rotateLeft') {
            // calculationArea modifications
            playerLevelEnvironment[0].rotationIndex++;
            if (playerLevelEnvironment[0].rotationIndex === numberOfRotations) {
                playerLevelEnvironment[0].rotationIndex = 0;
            }
            rotationModifier = -1;
        }
        if (direction === 'rotateRight') {
            // calculationArea modifications
            playerLevelEnvironment[0].rotationIndex--;
            if (playerLevelEnvironment[0].rotationIndex < 0) {
                playerLevelEnvironment[0].rotationIndex = numberOfRotations - 1;
            }
            rotationModifier = 1;
        }
        if (direction === "") {
            // do nothing
        }

        // test if we can make the move

        playerLevelEnvironment[0].moveCanBeDone = true;

        // 1.0. copy currentCalculationArea to tempCalculationArea

        const numberOfRows = currentCalculationArea.length;
        const numberOfColumns = currentCalculationArea[0].length;
        for (let y = 0; y < numberOfRows; y++) {
            for (let x = 0; x < numberOfColumns; x++) {
                tempCalculationArea[y][x] = currentCalculationArea[y][x];
            }
        }

        // 1.1. remove blockMap from tempCalculationArea

        playerLevelEnvironment[0].rotationIndex += rotationModifier;
        if (playerLevelEnvironment[0].rotationIndex < 0) {
            playerLevelEnvironment[0].rotationIndex = numberOfRotations - 1;
        }
        if (playerLevelEnvironment[0].rotationIndex === numberOfRotations) {
            playerLevelEnvironment[0].rotationIndex = 0;
        }

        let blockMapNumberOfRows = Object.keys(blockMap[playerLevelEnvironment[0].blockIndex][playerLevelEnvironment[0].rotationIndex][playerLevelEnvironment[0].rotationIndex]).length;
        let blockMapNumberOfColumns = Object.keys(blockMap[playerLevelEnvironment[0].blockIndex][playerLevelEnvironment[0].rotationIndex][playerLevelEnvironment[0].rotationIndex][0]).length;
        for (y = 0; y < blockMapNumberOfRows; y++) {
            for (x = 0; x < blockMapNumberOfColumns; x++) {
                isRectangleFilled = blockMap[playerLevelEnvironment[0].blockIndex][playerLevelEnvironment[0].rotationIndex][playerLevelEnvironment[0].rotationIndex][y][x];
                if (isRectangleFilled === 1) {
                    yOnCalculationArea = Math.floor(playerLevelEnvironment[0].yPlayArea / gameLevelEnvironment.pixelSize) + y + yCalculationAreaModifier;
                    xOnCalculationArea = Math.floor(playerLevelEnvironment[0].xPlayArea / gameLevelEnvironment.pixelSize) + x + xCalculationAreaModifier;
                    tempCalculationArea[yOnCalculationArea][xOnCalculationArea] = 0;
                }
            }
        }

        // 1.2. test if we could add the block to tempCalculationArea without overlap or any other problems

        playerLevelEnvironment[0].rotationIndex -= rotationModifier;
        if (playerLevelEnvironment[0].rotationIndex < 0) {
            playerLevelEnvironment[0].rotationIndex = numberOfRotations - 1;
        }
        if (playerLevelEnvironment[0].rotationIndex === numberOfRotations) {
            playerLevelEnvironment[0].rotationIndex = 0;
        }
        blockMapNumberOfRows = Object.keys(blockMap[playerLevelEnvironment[0].blockIndex][playerLevelEnvironment[0].rotationIndex][playerLevelEnvironment[0].rotationIndex]).length;
        blockMapNumberOfColumns = Object.keys(blockMap[playerLevelEnvironment[0].blockIndex][playerLevelEnvironment[0].rotationIndex][playerLevelEnvironment[0].rotationIndex][0]).length;

        for (y = 0; y < blockMapNumberOfRows; y++) {
            for (x = 0; x < blockMapNumberOfColumns; x++) {
                isRectangleFilled = blockMap[playerLevelEnvironment[0].blockIndex][playerLevelEnvironment[0].rotationIndex][playerLevelEnvironment[0].rotationIndex][y][x];
                if (isRectangleFilled === 1) {
                    yOnCalculationArea = Math.floor(playerLevelEnvironment[0].yPlayArea / gameLevelEnvironment.pixelSize) + y;
                    xOnCalculationArea = Math.floor(playerLevelEnvironment[0].xPlayArea / gameLevelEnvironment.pixelSize) + x;
                    if (yOnCalculationArea > (numberOfRows - 2)) {
                        // block reached the bottom
                        playerLevelEnvironment[0].selectANewBlockNextFrame = true;
                        playerLevelEnvironment[0].moveCanBeDone = false;
                    }
                    if (tempCalculationArea[yOnCalculationArea][xOnCalculationArea] !== 0) {
                        // move can not be done, as the block in the new position would overlap with something
                        playerLevelEnvironment[0].moveCanBeDone = false;
                    }
                }
            }
        }

        if (playerLevelEnvironment[0].moveCanBeDone === true) {

            // 1.3. move can be done - remove blockMap from currentCalculationArea

            playerLevelEnvironment[0].rotationIndex += rotationModifier;
            if (playerLevelEnvironment[0].rotationIndex < 0) {
                playerLevelEnvironment[0].rotationIndex = numberOfRotations - 1;
            }
            if (playerLevelEnvironment[0].rotationIndex === numberOfRotations) {
                playerLevelEnvironment[0].rotationIndex = 0;
            }
            blockMapNumberOfRows = Object.keys(blockMap[playerLevelEnvironment[0].blockIndex][playerLevelEnvironment[0].rotationIndex][playerLevelEnvironment[0].rotationIndex]).length;
            blockMapNumberOfColumns = Object.keys(blockMap[playerLevelEnvironment[0].blockIndex][playerLevelEnvironment[0].rotationIndex][playerLevelEnvironment[0].rotationIndex][0]).length;

            for (y = 0; y < blockMapNumberOfRows; y++) {
                for (x = 0; x < blockMapNumberOfColumns; x++) {
                    isRectangleFilled = blockMap[playerLevelEnvironment[0].blockIndex][playerLevelEnvironment[0].rotationIndex][playerLevelEnvironment[0].rotationIndex][y][x];
                    if (isRectangleFilled === 1) {
                        yOnCalculationArea = Math.floor(playerLevelEnvironment[0].yPlayArea / gameLevelEnvironment.pixelSize) + y + yCalculationAreaModifier;
                        xOnCalculationArea = Math.floor(playerLevelEnvironment[0].xPlayArea / gameLevelEnvironment.pixelSize) + x + xCalculationAreaModifier;
                        currentCalculationArea[yOnCalculationArea][xOnCalculationArea] = 0;
                    }
                }
            }

            // 1.4. add blockMap to currentCalculationArea

            playerLevelEnvironment[0].rotationIndex -= rotationModifier;
            if (playerLevelEnvironment[0].rotationIndex < 0) {
                playerLevelEnvironment[0].rotationIndex = numberOfRotations - 1;
            }
            if (playerLevelEnvironment[0].rotationIndex === numberOfRotations) {
                playerLevelEnvironment[0].rotationIndex = 0;
            }
            blockMapNumberOfRows = Object.keys(blockMap[playerLevelEnvironment[0].blockIndex][playerLevelEnvironment[0].rotationIndex][playerLevelEnvironment[0].rotationIndex]).length;
            blockMapNumberOfColumns = Object.keys(blockMap[playerLevelEnvironment[0].blockIndex][playerLevelEnvironment[0].rotationIndex][playerLevelEnvironment[0].rotationIndex][0]).length;
            for (y = 0; y < blockMapNumberOfRows; y++) {
                for (x = 0; x < blockMapNumberOfColumns; x++) {
                    isRectangleFilled = blockMap[playerLevelEnvironment[0].blockIndex][playerLevelEnvironment[0].rotationIndex][playerLevelEnvironment[0].rotationIndex][y][x];
                    if (isRectangleFilled === 1) {
                        yOnCalculationArea = Math.floor(playerLevelEnvironment[0].yPlayArea / gameLevelEnvironment.pixelSize) + y;
                        xOnCalculationArea = Math.floor(playerLevelEnvironment[0].xPlayArea / gameLevelEnvironment.pixelSize) + x;
                        currentCalculationArea[yOnCalculationArea][xOnCalculationArea] = playerLevelEnvironment[0].blockIndex+1;
                    }
                }
            }
        } // if (playerLevelEnvironment[0].moveCanBeDone === true)

        else {
            // move can not be done

            if (direction === 'moveDown') {
                playerLevelEnvironment[0].selectANewBlockNextFrame = true;
            }
            if (direction === 'moveLeft') {
                playerLevelEnvironment[0].xPlayArea = playerLevelEnvironment[0].xPlayArea + gameLevelEnvironment.pixelSize;
            }
            if (direction === 'moveRight') {
                playerLevelEnvironment[0].xPlayArea = playerLevelEnvironment[0].xPlayArea - gameLevelEnvironment.pixelSize;
            }
            if (direction === 'rotateLeft') {
                playerLevelEnvironment[0].rotationIndex--;
                if (playerLevelEnvironment[0].rotationIndex < 0) {
                    playerLevelEnvironment[0].rotationIndex = numberOfRotations - 1;
                }
            }
            if (direction === 'rotateRight') {
                playerLevelEnvironment[0].rotationIndex++;
                if (playerLevelEnvironment[0].rotationIndex === numberOfRotations) {
                    playerLevelEnvironment[0].rotationIndex = 0;
                }
            }
        }
    }


    // this function draws the playArea, the shadow and the pixel perfect falling block

    function drawPlayAreaWithFallingBlock() {

        let x;
        let y;
        const c = document.getElementById("playAreaCanvas[0]");
        const ctx = c.getContext("2d");

        ctx.clearRect(0, 0, c.width, c.height);

        // copy currentCalculationArea to tempCalculationArea

        const numberOfRows = currentCalculationArea.length;
        const numberOfColumns = currentCalculationArea[0].length;
        for (y = 0; y < numberOfRows; y++) {
            for (x = 0; x < numberOfColumns; x++) {
                tempCalculationArea[y][x] = currentCalculationArea[y][x];
            }
        }

        // remove current falling block from tempCalculationArea

        const blockMapNumberOfRows = Object.keys(blockMap[playerLevelEnvironment[0].blockIndex][playerLevelEnvironment[0].rotationIndex][playerLevelEnvironment[0].rotationIndex]).length;
        const blockMapNumberOfColumns = Object.keys(blockMap[playerLevelEnvironment[0].blockIndex][playerLevelEnvironment[0].rotationIndex][playerLevelEnvironment[0].rotationIndex][0]).length;
        let isRectangleFilled;
        for (y = 0; y < blockMapNumberOfRows; y++) {
            for (x = 0; x < blockMapNumberOfColumns; x++) {
                isRectangleFilled = blockMap[playerLevelEnvironment[0].blockIndex][playerLevelEnvironment[0].rotationIndex][playerLevelEnvironment[0].rotationIndex][y][x];
                if (isRectangleFilled === 1) {
                    const yOnCalculationArea = Math.floor(playerLevelEnvironment[0].yPlayArea / gameLevelEnvironment.pixelSize) + y;
                    const xOnCalculationArea = Math.floor(playerLevelEnvironment[0].xPlayArea / gameLevelEnvironment.pixelSize) + x;
                    tempCalculationArea[yOnCalculationArea][xOnCalculationArea] = 0;
                }
            }
        }

        drawAllBlocksToPlayArea(ctx);

        // draw a the shadow of the moving block

        drawShadow();

        // draw pixel perfect moving block

        const xModifierInSquares = playerLevelEnvironment[0].xPlayArea / gameLevelEnvironment.pixelSize;
        const yModifierInSquares = playerLevelEnvironment[0].yPlayArea / gameLevelEnvironment.pixelSize;
        const yModifierInPixels = 0;
        const blockToDrawIndex = playerLevelEnvironment[0].blockIndex;
        const blockToDrawRotation = playerLevelEnvironment[0].rotationIndex;
        const drawEmptyLines = true;
        const blockMapToDraw = blockMap[blockToDrawIndex][blockToDrawRotation][blockToDrawRotation];
        const blockToDrawColor = colorRelated.getBlockColor(blockToDrawIndex);
        drawBlock.drawBlock(ctx, blockMapToDraw, blockToDrawColor, xModifierInSquares, yModifierInSquares, yModifierInPixels, drawEmptyLines, playerLevelEnvironment[0].playAreaMode, playerLevelEnvironment[0].fullLines, playerLevelEnvironment[0].gameEndFadeAnimationCounter, gameLevelEnvironment.gameEndFadeAnimationLength, playerLevelEnvironment[0].fullLineFadeAnimationCounter, gameLevelEnvironment.fullLineFadeAnimationLength);

    }


    // this function draws all blocks one by one to the playArea

    function drawAllBlocksToPlayArea(ctx) {

        // go thru the blocks one by one in playerLevelEnvironment[0].listOfBlocksInThePlayingArea
        for (let i = 0; i < playerLevelEnvironment[0].listOfBlocksInThePlayingArea.length; i++) {

            // draw the block
            const xModifierInSquares = playerLevelEnvironment[0].listOfBlocksInThePlayingArea[i].blockX;
            const yModifierInSquares = playerLevelEnvironment[0].listOfBlocksInThePlayingArea[i].blockY + 1;
            const yModifierInPixels = 0;
            const drawEmptyLines = true;
            const blockMapToDraw = playerLevelEnvironment[0].listOfBlocksInThePlayingArea[i].blockMap;
            const blockToDrawColor = colorRelated.getBlockColor(playerLevelEnvironment[0].listOfBlocksInThePlayingArea[i].blockIndex);
            drawBlock.drawBlock(ctx, blockMapToDraw, blockToDrawColor, xModifierInSquares, yModifierInSquares, yModifierInPixels, drawEmptyLines, playerLevelEnvironment[0].playAreaMode, playerLevelEnvironment[0].fullLines, playerLevelEnvironment[0].gameEndFadeAnimationCounter, gameLevelEnvironment.gameEndFadeAnimationLength, playerLevelEnvironment[0].fullLineFadeAnimationCounter, gameLevelEnvironment.fullLineFadeAnimationLength);

        }
    }


    // this function draws the play area, sometimes with opacity

    function drawPlayArea() {

        // get the canvas
        const c = document.getElementById("playAreaCanvas[0]");
        const ctx = c.getContext("2d");

        // clear the canvas
        ctx.clearRect(0, 0, c.width, c.height);

        // draw the canvas
        drawAllBlocksToPlayArea(ctx);

    }


    // this function checks if we have full lines in the calculationArea and removes them

    function checkFullLineInCurrentCalculationArea(){

        playerLevelEnvironment[0].fullLines = [];
        let fullLineFound = false;

        const numberOfRows = currentCalculationArea.length;
        const numberOfColumns = currentCalculationArea[0].length;

        // let's check all rows for full lines
        let numberOfFilledRectanglesInRow;
        let isRectangleFilled;
        for (let i = 0; i < numberOfRows; i++) {
            numberOfFilledRectanglesInRow = 0;
            for (let j = 0; j < numberOfColumns; j++) {
                isRectangleFilled = currentCalculationArea[i][j];
                if (isRectangleFilled > 0) {
                    numberOfFilledRectanglesInRow++;
                }
            }
            if (numberOfFilledRectanglesInRow === numberOfColumns) {
                // we've found a full line in row i
                fullLineFound = true;
                playerLevelEnvironment[0].fullLines.push(i);
            }
        }
        if (fullLineFound === true) {
            playerLevelEnvironment[0].playAreaMode = 'fullLineRemoveAnimation';
            let numberOfNewLinesCleared = playerLevelEnvironment[0].fullLines.length;
            let numberOfLinesCleared = statRelated.increaseNumberOfLinesCleared(numberOfNewLinesCleared);
            let pointsReceived = statRelated.calculatePointsReceived(numberOfNewLinesCleared, playerLevelEnvironment[0].gameLevel);
            playerLevelEnvironment[0].points += pointsReceived;

            chat.sayPointsReceived(pointsReceived, numberOfNewLinesCleared);
            if (
                Math.round(numberOfLinesCleared / gameLevelEnvironment.numberOfLinesNeedsToBeClearedToIncreaseGameSpeed) !==
                Math.round((numberOfLinesCleared-numberOfNewLinesCleared) / gameLevelEnvironment.numberOfLinesNeedsToBeClearedToIncreaseGameSpeed)
            ) {
                playerLevelEnvironment[0].gameLevel++;
                playerLevelEnvironment[0].fallingSpeed = playerLevelEnvironment[0].fallingSpeed + 0.5;
                chat.sayLevelIncreased(playerLevelEnvironment[0].gameLevel);
            }
        }
    }


    // this function animates the full lines, until they are non-visible

    function animateFullLines() {

        playerLevelEnvironment[0].fullLineFadeAnimationCounter--;

        if (playerLevelEnvironment[0].fullLineFadeAnimationCounter === 0) {
            playerLevelEnvironment[0].fullLineFadeAnimationCounter = gameLevelEnvironment.fullLineFadeAnimationLength;
            return true;
        } else {
            return false;
        }
    }


    // this function removes the full lines

    function hideFullLines(fullLines) {

        const numberOfColumns = currentCalculationArea[0].length;

        let fullLine;
        for (let p = 0; p < fullLines.length; p++) {

            let l;
            fullLine = fullLines[p];

            // remove it
            for (l = 0; l < numberOfColumns; l++) {
                currentCalculationArea[fullLine][l] = 0;
                currentCalculationArea[0][l] = 0;
            }
            // move everything above the line 1 row down
            for (let k = fullLine; k > 0; k--) {
                for (l = 0; l < numberOfColumns; l++) {
                    currentCalculationArea[k][l] = currentCalculationArea[k - 1][l];
                }
            }

            // modify playerLevelEnvironment[0].listOfBlocksInThePlayingArea because of full line
            modifyListOfBlocksInThePlayingAreaBecauseOfFullLine(fullLine);
        }

        playerLevelEnvironment[0].playAreaMode = 'gravityAnimation';

    }


    // this function draws a shadow of the block

    function drawShadow() {

        // let's try to move the block downwards and look for overlap

        const numberOfRows = currentCalculationArea.length;
        let shadowCanBeMoved;
        let yModifier = 0;
        let isRectangleFilled;
        do {
            shadowCanBeMoved = true;
            const blockMapNumberOfRows = Object.keys(blockMap[playerLevelEnvironment[0].blockIndex][playerLevelEnvironment[0].rotationIndex][playerLevelEnvironment[0].rotationIndex]).length;
            const blockMapNumberOfColumns = Object.keys(blockMap[playerLevelEnvironment[0].blockIndex][playerLevelEnvironment[0].rotationIndex][playerLevelEnvironment[0].rotationIndex][0]).length;
            for (let y = 0; y < blockMapNumberOfRows; y++) {
                for (let x = 0; x < blockMapNumberOfColumns; x++) {
                    isRectangleFilled = blockMap[playerLevelEnvironment[0].blockIndex][playerLevelEnvironment[0].rotationIndex][playerLevelEnvironment[0].rotationIndex][y][x];
                    if (isRectangleFilled === 1) {
                        const yOnCalculationArea = Math.floor(playerLevelEnvironment[0].yPlayArea / gameLevelEnvironment.pixelSize) + y + yModifier;
                        const xOnCalculationArea = Math.floor(playerLevelEnvironment[0].xPlayArea / gameLevelEnvironment.pixelSize) + x;
                        if (yOnCalculationArea > (numberOfRows - 2)) {
                            shadowCanBeMoved = false;
                        }
                        if (tempCalculationArea[yOnCalculationArea][xOnCalculationArea] !== 0) {
                            shadowCanBeMoved = false;
                        }
                    }
                }
            }
            yModifier++;
        }
        while (shadowCanBeMoved === true);

        // let's draw the block
        const c = document.getElementById("playAreaCanvas[0]");
        const ctx = c.getContext("2d");

        const xModifierInSquares = Math.floor(playerLevelEnvironment[0].xPlayArea / gameLevelEnvironment.pixelSize);
        const yModifierInSquares = Math.floor(playerLevelEnvironment[0].yPlayArea / gameLevelEnvironment.pixelSize) + yModifier - 1;
        const yModifierInPixels = 0;
        const blockToDrawIndex = playerLevelEnvironment[0].blockIndex;
        const blockToDrawRotation = playerLevelEnvironment[0].rotationIndex;
        const drawEmptyLines = true;
        const blockMapToDraw = blockMap[blockToDrawIndex][blockToDrawRotation][blockToDrawRotation];
        const blockToDrawColor = colorRelated.getBlockColor('shadow');
        drawBlock.drawBlock(ctx, blockMapToDraw, blockToDrawColor, xModifierInSquares, yModifierInSquares, yModifierInPixels, drawEmptyLines, playerLevelEnvironment[0].playAreaMode, playerLevelEnvironment[0].fullLines, playerLevelEnvironment[0].gameEndFadeAnimationCounter, gameLevelEnvironment.gameEndFadeAnimationLength, playerLevelEnvironment[0].fullLineFadeAnimationCounter, gameLevelEnvironment.fullLineFadeAnimationLength);

    }


    // this function draws the next blocks to the nextBlocksAreaCanvas

    function drawNextBlocksArea() {

        // let's draw the block
        const c = document.getElementById("nextBlocksAreaCanvas[0]");
        const ctx = c.getContext("2d");
        ctx.clearRect(0, 0, c.width, c.height);

        for (let i = 0; i < gameLevelEnvironment.numberOfBlocksDisplayedInTheNextBlocksArea; i++) {
            const allBlockPointer = (playerLevelEnvironment[0].blockCounter + i + 1) % gameLevelEnvironment.numberOfBlocksInAllBlocks;
            const blockToDrawIndex = gameLevelEnvironment.allBlocks[allBlockPointer];
            const blockToDrawRotation = 0;
            const xModifierInSquares = ((gameLevelEnvironment.numberOfBlocksDisplayedInTheNextBlocksArea - 1) * 5) - (i * 5);
            const yModifierInSquares = 0;
            const yModifierInPixels = 0;
            const drawEmptyLines = false;
            const blockMapToDraw = blockMap[blockToDrawIndex][blockToDrawRotation][blockToDrawRotation];
            const blockToDrawColor = colorRelated.getBlockColor(blockToDrawIndex);
            drawBlock.drawBlock(ctx, blockMapToDraw, blockToDrawColor, xModifierInSquares, yModifierInSquares, yModifierInPixels, drawEmptyLines, playerLevelEnvironment[0].playAreaMode, playerLevelEnvironment[0].fullLines, playerLevelEnvironment[0].gameEndFadeAnimationCounter, gameLevelEnvironment.gameEndFadeAnimationLength, playerLevelEnvironment[0].fullLineFadeAnimationCounter, gameLevelEnvironment.fullLineFadeAnimationLength);
        }
    }


    // this function saves the block that has completed its journey to playerLevelEnvironment[0].listOfBlocksInThePlayingArea

    function saveDoneBlock() {

        let blockAlreadyInserted = false;
        for (let i = 0; i < playerLevelEnvironment[0].listOfBlocksInThePlayingArea.length; i++) {
            if (playerLevelEnvironment[0].listOfBlocksInThePlayingArea[i].blockCounter === playerLevelEnvironment[0].blockCounter) {
                blockAlreadyInserted = true;
            }
        }

        if (blockAlreadyInserted === false) {
            try {
                playerLevelEnvironment[0].listOfBlocksInThePlayingArea.push({
                    blockMap: blockMap[playerLevelEnvironment[0].blockIndex][playerLevelEnvironment[0].rotationIndex][playerLevelEnvironment[0].rotationIndex],
                    blockIndex: playerLevelEnvironment[0].blockIndex,
                    blockX: Math.floor(playerLevelEnvironment[0].xPlayArea / gameLevelEnvironment.pixelSize),
                    blockY: Math.floor(playerLevelEnvironment[0].yPlayArea / gameLevelEnvironment.pixelSize) - 1,
                    blockCounter: playerLevelEnvironment[0].blockCounter,
                    wasChecked: false
                });
            } catch(error) {
            }
        }
    }


    // this function calculates the currentGravityCalculationArea

    function calculateCurrentGravityCalculationArea() {

        let x;
        let y;

        // clear currentGravityCalculationArea
        const numberOfRows = currentGravityCalculationArea.length;
        const numberOfColumns = currentGravityCalculationArea[0].length;
        for (y = 0; y < numberOfRows; y++) {
            for (x = 0; x < numberOfColumns; x++) {
                currentGravityCalculationArea[y][x] = 0;
            }
        }

        // clear the canvas
        const c = document.getElementById("currentGravityCalculationAreaCanvas[0]");
        const ctx = c.getContext("2d");
        ctx.clearRect(0, 0, c.width, c.height);

        // go thru the blocks one by one in playerLevelEnvironment[0].listOfBlocksInThePlayingArea
        let isRectangleFilled;
        for (let i = 0; i < playerLevelEnvironment[0].listOfBlocksInThePlayingArea.length; i++) {
            const blockMapNumberOfRows = Object.keys(playerLevelEnvironment[0].listOfBlocksInThePlayingArea[i].blockMap).length;
            const blockMapNumberOfColumns = Object.keys(playerLevelEnvironment[0].listOfBlocksInThePlayingArea[i].blockMap[0]).length;
            for (y = 0; y < blockMapNumberOfRows; y++) {
                for (x = 0; x < blockMapNumberOfColumns; x++) {
                    isRectangleFilled = playerLevelEnvironment[0].listOfBlocksInThePlayingArea[i].blockMap[y][x];
                    if (isRectangleFilled === 1) {
                        // copy the map of the block to currentGravityCalculationArea
                        const yOnGravityCalculationArea = playerLevelEnvironment[0].listOfBlocksInThePlayingArea[i].blockY + y;
                        const xOnGravityCalculationArea = playerLevelEnvironment[0].listOfBlocksInThePlayingArea[i].blockX + x;
                        let colorOnGravityCalculationArea = playerLevelEnvironment[0].listOfBlocksInThePlayingArea[i].blockIndex + 1;
                        currentGravityCalculationArea[yOnGravityCalculationArea][xOnGravityCalculationArea] = colorOnGravityCalculationArea;
                    }
                }
            }
        }
    }


    // this function modifies blocks in the playerLevelEnvironment[0].listOfBlocksInThePlayingArea in case there was a full line

    function modifyListOfBlocksInThePlayingAreaBecauseOfFullLine(fullLineIndex) {

        let newBlockMap;
        let x;
        let y;

        // go thru the blocks one by one in playerLevelEnvironment[0].listOfBlocksInThePlayingArea
        // (we iterate backwards, so when we remove an item reindexing the array will not break the loop)
        let blockIsAffected;
        let isRectangleFilled;
        let lineAffected;
        let thereWerePixelsAboveTheCut;
        let thereWerePixelsUnderTheCut;
        for (let i = playerLevelEnvironment[0].listOfBlocksInThePlayingArea.length - 1; i >= 0; i--) {
            blockIsAffected = false;
            playerLevelEnvironment[0].listOfBlocksInThePlayingArea[i].wasChecked = true;
            const blockMapNumberOfRows = Object.keys(playerLevelEnvironment[0].listOfBlocksInThePlayingArea[i].blockMap).length;
            const blockMapNumberOfColumns = Object.keys(playerLevelEnvironment[0].listOfBlocksInThePlayingArea[i].blockMap[0]).length;
            for (y = 0; y < blockMapNumberOfRows; y++) {
                for (x = 0; x < blockMapNumberOfColumns; x++) {
                    isRectangleFilled = playerLevelEnvironment[0].listOfBlocksInThePlayingArea[i].blockMap[y][x];
                    if (isRectangleFilled === 1) {
                        if (fullLineIndex === (playerLevelEnvironment[0].listOfBlocksInThePlayingArea[i].blockY + y)) {
                            // the y coordinate of the pixel matches the full line row number
                            blockIsAffected = true;
                            lineAffected = y;
                        }
                    }
                }
                if (blockIsAffected === true) {
                    break;
                }
            }
            if (blockIsAffected === true) {
                thereWerePixelsAboveTheCut = false;
                for (y = 0; y < lineAffected; y++) {
                    for (x = 0; x < blockMapNumberOfColumns; x++) {
                        isRectangleFilled = playerLevelEnvironment[0].listOfBlocksInThePlayingArea[i].blockMap[y][x];
                        if (isRectangleFilled === 1) {
                            thereWerePixelsAboveTheCut = true;
                        }
                    }
                }
                if (thereWerePixelsAboveTheCut === true) {
                    newBlockMap = [];
                    for (y = 0; y < lineAffected; y++) {
                        newBlockMap[y] = [];
                        for (x = 0; x < blockMapNumberOfColumns; x++) {
                            newBlockMap[y][x] = 0;
                        }
                    }
                    playerLevelEnvironment[0].listOfBlocksInThePlayingArea.push({
                        blockMap: newBlockMap,
                        blockIndex: playerLevelEnvironment[0].listOfBlocksInThePlayingArea[i].blockIndex,
                        blockX: playerLevelEnvironment[0].listOfBlocksInThePlayingArea[i].blockX,
                        blockY: playerLevelEnvironment[0].listOfBlocksInThePlayingArea[i].blockY,
                        blockCounter: playerLevelEnvironment[0].listOfBlocksInThePlayingArea[i].blockCounter
                    });
                    for (y = 0; y < lineAffected; y++) {
                        for (x = 0; x < blockMapNumberOfColumns; x++) {
                            playerLevelEnvironment[0].listOfBlocksInThePlayingArea[playerLevelEnvironment[0].listOfBlocksInThePlayingArea.length - 1].blockMap[y][x] = playerLevelEnvironment[0].listOfBlocksInThePlayingArea[i].blockMap[y][x];
                        }
                    }
                }
                thereWerePixelsUnderTheCut = false;
                for (y = lineAffected + 1; y < blockMapNumberOfRows; y++) {
                    for (x = 0; x < blockMapNumberOfColumns; x++) {
                        isRectangleFilled = playerLevelEnvironment[0].listOfBlocksInThePlayingArea[i].blockMap[y][x];
                        if (isRectangleFilled === 1) {
                            thereWerePixelsUnderTheCut = true;
                        }
                    }
                }
                if (thereWerePixelsUnderTheCut === true) {
                    newBlockMap = [];
                    for (y = lineAffected + 1; y < blockMapNumberOfRows; y++) {
                        newBlockMap[y - (lineAffected + 1)] = [];
                        for (x = 0; x < blockMapNumberOfColumns; x++) {
                            newBlockMap[y - (lineAffected + 1)][x] = 0;
                        }
                    }
                    playerLevelEnvironment[0].listOfBlocksInThePlayingArea.push({
                        blockMap: newBlockMap,
                        blockIndex: playerLevelEnvironment[0].listOfBlocksInThePlayingArea[i].blockIndex,
                        blockX: playerLevelEnvironment[0].listOfBlocksInThePlayingArea[i].blockX,
                        blockY: playerLevelEnvironment[0].listOfBlocksInThePlayingArea[i].blockY + lineAffected + 1,
                        blockCounter: playerLevelEnvironment[0].listOfBlocksInThePlayingArea[i].blockCounter
                    });
                    for (y = lineAffected + 1; y < blockMapNumberOfRows; y++) {
                        for (x = 0; x < blockMapNumberOfColumns; x++) {
                            playerLevelEnvironment[0].listOfBlocksInThePlayingArea[playerLevelEnvironment[0].listOfBlocksInThePlayingArea.length - 1].blockMap[y - (lineAffected + 1)][x] = playerLevelEnvironment[0].listOfBlocksInThePlayingArea[i].blockMap[y][x];
                        }
                    }
                }
                // remove the old item from the list
                playerLevelEnvironment[0].listOfBlocksInThePlayingArea.splice(i, 1);
            }
        }
    }


    // this function checks if any of the blocks can fall down

    function checkIfAnyBlockCanFallDown() {

        let blockMapNumberOfColumns;
        let blockMapNumberOfRows;
        let x;
        let y;
        let thereWasMovementInThisRound = false;
        playerLevelEnvironment[0].listOfBlocksThatCanBeMoved = [];

        // let's iterate thru all the blocks we have in playerLevelEnvironment[0].listOfBlocksInThePlayingArea
        let isRectangleFilled;
        for (let i = 0; i < playerLevelEnvironment[0].listOfBlocksInThePlayingArea.length; i++) {

            // clear currentGravityCalculationArea
            let numberOfRows = currentGravityCalculationArea.length;
            let numberOfColumns = currentGravityCalculationArea[0].length;
            for (y = 0; y < numberOfRows; y++) {
                for (x = 0; x < numberOfColumns; x++) {
                    currentGravityCalculationArea[y][x] = 0;
                }
            }

            // calculate currentGravityCalculationArea, without the current block

            // go thru the blocks one by one in playerLevelEnvironment[0].listOfBlocksInThePlayingArea
            // draw every block except the one we calculate now
            for (let k = 0; k < playerLevelEnvironment[0].listOfBlocksInThePlayingArea.length; k++) {
                if (k !== i) {
                    blockMapNumberOfRows = Object.keys(playerLevelEnvironment[0].listOfBlocksInThePlayingArea[k].blockMap).length;
                    blockMapNumberOfColumns = Object.keys(playerLevelEnvironment[0].listOfBlocksInThePlayingArea[k].blockMap[0]).length;
                    for (y = 0; y < blockMapNumberOfRows; y++) {
                        for (x = 0; x < blockMapNumberOfColumns; x++) {
                            isRectangleFilled = playerLevelEnvironment[0].listOfBlocksInThePlayingArea[k].blockMap[y][x];
                            if (isRectangleFilled === 1) {
                                const yOnGravityCalculationArea = playerLevelEnvironment[0].listOfBlocksInThePlayingArea[k].blockY + y;
                                const xOnGravityCalculationArea = playerLevelEnvironment[0].listOfBlocksInThePlayingArea[k].blockX + x;
                                const colorOnGravityCalculationArea = playerLevelEnvironment[0].listOfBlocksInThePlayingArea[k].blockIndex + 1;
                                currentGravityCalculationArea[yOnGravityCalculationArea][xOnGravityCalculationArea] = colorOnGravityCalculationArea;
                            }
                        }
                    }
                }
            }

            // let's try to move the block downwards and look for overlap

            numberOfRows = currentGravityCalculationArea.length;
            numberOfColumns = currentGravityCalculationArea[0].length;
            for (y = 0; y < numberOfRows; y++) {
                let line = '';
                for (x = 0; x < numberOfColumns; x++) {
                    line = line + currentGravityCalculationArea[y][x];
                }
            }

            let blockCanBeMoved = true;
            const yModifier = 0;
            numberOfRows = currentGravityCalculationArea.length;
            blockMapNumberOfRows = Object.keys(playerLevelEnvironment[0].listOfBlocksInThePlayingArea[i].blockMap).length;
            blockMapNumberOfColumns = Object.keys(playerLevelEnvironment[0].listOfBlocksInThePlayingArea[i].blockMap[0]).length;

            for (y = 0; y < blockMapNumberOfRows; y++) {
                for (x = 0; x < blockMapNumberOfColumns; x++) {
                    isRectangleFilled = playerLevelEnvironment[0].listOfBlocksInThePlayingArea[i].blockMap[y][x];
                    if (isRectangleFilled === 1) {
                        const yOnCalculationArea = playerLevelEnvironment[0].listOfBlocksInThePlayingArea[i].blockY + y + yModifier + 1;
                        const xOnCalculationArea = playerLevelEnvironment[0].listOfBlocksInThePlayingArea[i].blockX + x;
                        if (yOnCalculationArea > (numberOfRows - 2)) {
                            // block reached the bottom
                            blockCanBeMoved = false;
                            break;
                        }
                        if (currentGravityCalculationArea[yOnCalculationArea][xOnCalculationArea] !== 0) {
                            // block collided with another block
                            blockCanBeMoved = false;
                        }
                        if (blockCanBeMoved === true) {
                            // no problem
                        }
                    }
                }
            }
            if (blockCanBeMoved === true) {
                playerLevelEnvironment[0].listOfBlocksThatCanBeMoved.push(i);
                thereWasMovementInThisRound = true;
            } else {
                // block could not be moved
            }
        }

        calculateCurrentGravityCalculationArea();

        return thereWasMovementInThisRound;
    }


    // this function copies the currentGravityCalculationArea to currentCalculationArea

    function copyCurrentGravityCalculationAreaToCurrentCalculationArea() {
        const numberOfRows = currentGravityCalculationArea.length;
        const numberOfColumns = currentGravityCalculationArea[0].length;
        for (let y = 0; y < numberOfRows; y++) {
            for (let x = 0; x < numberOfColumns; x++) {
                currentCalculationArea[y][x] = currentGravityCalculationArea[y][x];
            }
        }
    }


    // this function draws the currentGravityCalculationField with falling blocks

    function drawPlayAreaWithFallingBlocks() {

        // clear the canvas
        const c = document.getElementById("playAreaCanvas[0]");
        const ctx = c.getContext("2d");
        ctx.clearRect(0, 0, c.width, c.height);

        // go thru the blocks one by one in playerLevelEnvironment[0].listOfBlocksInThePlayingArea
        let yModifierInPixels;
        for (let i = 0; i < playerLevelEnvironment[0].listOfBlocksInThePlayingArea.length; i++) {

            const xModifierInSquares = playerLevelEnvironment[0].listOfBlocksInThePlayingArea[i].blockX;
            const yModifierInSquares = playerLevelEnvironment[0].listOfBlocksInThePlayingArea[i].blockY + 1;
            const drawEmptyLines = true;
            const blockMapToDraw = playerLevelEnvironment[0].listOfBlocksInThePlayingArea[i].blockMap;
            const blockToDrawColor = colorRelated.getBlockColor(playerLevelEnvironment[0].listOfBlocksInThePlayingArea[i].blockIndex);
            if (playerLevelEnvironment[0].listOfBlocksThatCanBeMoved.includes(i)) {
                yModifierInPixels = playerLevelEnvironment[0].gravityAnimationYModifier;
            } else {
                yModifierInPixels = 0;
            }
            drawBlock.drawBlock(ctx, blockMapToDraw, blockToDrawColor, xModifierInSquares, yModifierInSquares, yModifierInPixels, drawEmptyLines, playerLevelEnvironment[0].playAreaMode, playerLevelEnvironment[0].fullLines, playerLevelEnvironment[0].gameEndFadeAnimationCounter, gameLevelEnvironment.gameEndFadeAnimationLength, playerLevelEnvironment[0].fullLineFadeAnimationCounter, gameLevelEnvironment.fullLineFadeAnimationLength);
        }
    }


    // this function does the "blockFallingAnimation" routine

    function blockFallingRoutine() {

        // check if we have full lines, if we have them, remove them
        checkFullLineInCurrentCalculationArea();

        // if we need to set a new block, save the old one and set a new one
        if (playerLevelEnvironment[0].selectANewBlockNextFrame === true) {

            // save old one
            saveDoneBlock();

            // select a new one
            blockGenerator.selectANewBlock();
            playerLevelEnvironment[0].selectANewBlockNextFrame = false;
        }

        // let's move the current block down

        // y previously in the calculationArea
        let previousYCalculationArea = Math.floor(playerLevelEnvironment[0].yPlayArea / gameLevelEnvironment.pixelSize);
        // y in the playArea
        playerLevelEnvironment[0].yPlayArea = playerLevelEnvironment[0].yPlayArea + playerLevelEnvironment[0].fallingSpeed;
        // y now in the calculationArea
        let currentYCalculationArea = Math.floor(playerLevelEnvironment[0].yPlayArea / gameLevelEnvironment.pixelSize);
        // do we need to move down the block in the calculationArea
        if (previousYCalculationArea !== currentYCalculationArea) {
            // yes, try to do the move in calculationArea
            moveBlockInCalculationArea('moveDown');
        } else {
            // no, just recalculate calculationArea
            moveBlockInCalculationArea('');
        }

        // if the current block will be replaced next frame, don't draw the playArea
        if (playerLevelEnvironment[0].selectANewBlockNextFrame === false) {
            // draw the pixel perfect playArea
            drawPlayAreaWithFallingBlock();
        }

        // draw next blocks
        drawNextBlocksArea();

        // draw currentGravityCalculationArea
        calculateCurrentGravityCalculationArea();
    }


    // this function does the "fullLineRemoveAnimation" routine

    function fullLineRemoveRoutine() {
        drawPlayArea();
        if (animateFullLines() === true) {
            hideFullLines(playerLevelEnvironment[0].fullLines);

            // check if any block can fall down
            const isThereABlockThatCanBeMoved = checkIfAnyBlockCanFallDown();
            if (isThereABlockThatCanBeMoved === true) {
                playerLevelEnvironment[0].playAreaMode = 'gravityAnimation';
            } else {
                playerLevelEnvironment[0].playAreaMode = 'blockFallingAnimation';
            }
        }
    }


    // this function does the "gravityAnimation" routine

    function gravityAnimationRoutine() {

        playerLevelEnvironment[0].gravityAnimationYModifier = playerLevelEnvironment[0].gravityAnimationYModifier + gameLevelEnvironment.gravityAnimationFallingSpeed;
        if (playerLevelEnvironment[0].gravityAnimationYModifier < gameLevelEnvironment.pixelSize) {
            drawPlayAreaWithFallingBlocks();
        } else {
            for (let i = 0; i < playerLevelEnvironment[0].listOfBlocksThatCanBeMoved.length; i++) {
                playerLevelEnvironment[0].listOfBlocksInThePlayingArea[playerLevelEnvironment[0].listOfBlocksThatCanBeMoved[i]].blockY++;
            }
            calculateCurrentGravityCalculationArea();
            copyCurrentGravityCalculationAreaToCurrentCalculationArea();

            playerLevelEnvironment[0].gravityAnimationYModifier = 0;

            const isThereABlockThatCanBeMoved = checkIfAnyBlockCanFallDown();
            if (isThereABlockThatCanBeMoved === true) {
                playerLevelEnvironment[0].playAreaMode = 'gravityAnimation';
            } else {
                playerLevelEnvironment[0].playAreaMode = 'blockFallingAnimation';
            }

        }

    }


    // this function does the "gameEndAnimation" routine

    function gameEndAnimationRoutine() {

        // no more moves
        document.onkeydown = null;

        // draw the fading play area
        drawPlayArea();

        // draw next blocks, so they fade too
        drawNextBlocksArea();

        // increase opacity
        playerLevelEnvironment[0].gameEndFadeAnimationCounter--;

        // check if everything has faded out properly
        if (playerLevelEnvironment[0].gameEndFadeAnimationCounter === 20) {

            playerLevelEnvironment[0].gameEndFadeAnimationCounter = gameLevelEnvironment.gameEndFadeAnimationLength;

            statRelated.displayGameEndStats(playerLevelEnvironment[0].blockCounter);

            // stop the game loop
            gameLevelEnvironment.stopTheGameLoop = true;

            // say "game over" in the chat
            if (!replayingAGame) {
                chat.sayGameOver();
            } else {
                chat.sayReplayOver();
            }

            // if this is not a replay
            if (!replayingAGame) {
                // save game data to the server
                recordGame.saveGameToServer();
            }

        } else {
            //
        }

    }


    // this is the game loop, it runs every frame

    function gameLoop() {

        if (replayingAGame) {
            checkPlayerInputFromRecording();
        }

        switch (playerLevelEnvironment[0].playAreaMode) {
            case 'blockFallingAnimation':
                blockFallingRoutine();
                break;
            case 'fullLineRemoveAnimation':
                fullLineRemoveRoutine();
                break;
            case 'gravityAnimation':
                gravityAnimationRoutine();
                break;
            case 'gameEndFadeOutAnimation':
                gameEndAnimationRoutine();
        }

        // increase playerLevelEnvironment[0].frameNumber
        playerLevelEnvironment[0].frameNumber++;

        // let's restart the game loop in the next frame
        if (!gameLevelEnvironment.stopTheGameLoop) {
            requestAnimationFrame(gameLoop);
        }

    }


// we start everything here

// the checkKeyboardInput() function will take care of the keyboard interactions
document.onkeydown = checkKeyboardInput;

// let's generate the first 3 blocks
playerLevelEnvironment[0].blockIndex = blockGenerator.selectABlockRandomly();
playerLevelEnvironment[0].nextBlocks.unshift(playerLevelEnvironment[0].blockIndex);
playerLevelEnvironment[0].blockIndex = blockGenerator.selectABlockRandomly();
playerLevelEnvironment[0].nextBlocks.unshift(playerLevelEnvironment[0].blockIndex);
playerLevelEnvironment[0].blockIndex = blockGenerator.selectABlockRandomly();
playerLevelEnvironment[0].nextBlocks.unshift(playerLevelEnvironment[0].blockIndex);

try {
    if(replayingAGame) {
        console.log("we are replaying a game");
    }
} catch(err) {
    replayingAGame = false;
}

// if there are preloaded blocks from the server, load them
if (replayingAGame) {
    gameLevelEnvironment.allBlocks = preloadedGameBlocks;
    // announce in the chatbox that we are replaying a saved game
    chat.sayReplayStarted();
} else {
    // ...otherwise let's create all the blocks for this game
    blockGenerator.generateAllBlocks();
    // announce in the chatbox that the game has started
    chat.sayGameStarted();
}

// set playerLevelEnvironment[0].playAreaMode
playerLevelEnvironment[0].playAreaMode = 'blockFallingAnimation';

// record game start time
statRelated.setGameStartTime();

// start the game loop
requestAnimationFrame(gameLoop);