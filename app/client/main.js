const gameLevelEnvironment = require('./includes/gameLevelEnvironment');
const playerLevelEnvironment = require('./includes/playerLevelEnvironment');

const blockMap = require('./includes/blockMap');
const colorRelated = require('./includes/colorRelated');

const calculationAreaDefinitions = require('./includes/calculationAreaDefinitions');
const currentCalculationArea = calculationAreaDefinitions.currentCalculationArea;
const tempCalculationArea = calculationAreaDefinitions.tempCalculationArea;
const currentGravityCalculationArea = calculationAreaDefinitions.currentGravityCalculationArea;

const statRelated = require('./includes/statRelated');

const drawBlock = require('./includes/drawBlock');

const chat = require('./includes/chat');

const recordGame = require('./includes/recordGame');

const blockGenerator = require('./includes/blockGenerator');

var socket = io();


function sendGameEvent(eventValue) {
    socket.emit('clientEvent', eventValue, playerLevelEnvironment.playerId);
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
                    recordGame.saveGameEvent(playerLevelEnvironment.frameNumber, 'keyPressed', 'rotateRight');
                    sendGameEvent('rotateRight');
                    handlePlayerInput('rotateRight');
                    break;
                case 'ArrowDown':
                    recordGame.saveGameEvent(playerLevelEnvironment.frameNumber, 'keyPressed', 'rotateLeft');
                    sendGameEvent('rotateLeft');
                    handlePlayerInput('rotateLeft');
                    break;
                case 'ArrowLeft':
                    recordGame.saveGameEvent(playerLevelEnvironment.frameNumber, 'keyPressed', 'moveLeft');
                    sendGameEvent('moveLeft');
                    handlePlayerInput('moveLeft');
                    break;
                case 'ArrowRight':
                    recordGame.saveGameEvent(playerLevelEnvironment.frameNumber, 'keyPressed', 'moveRight');
                    sendGameEvent('moveRight');
                    handlePlayerInput('moveRight');
                    break;
                case ' ':
                    recordGame.saveGameEvent(playerLevelEnvironment.frameNumber, 'keyPressed', 'instantDrop');
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
            if (preloadedGameString[i].frameNumber === playerLevelEnvironment.frameNumber) {
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
                while (playerLevelEnvironment.moveCanBeDone === true) {
                    playerLevelEnvironment.yPlayArea = playerLevelEnvironment.yPlayArea + gameLevelEnvironment.pixelSize;
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

        let numberOfRotations = Object.keys(blockMap[playerLevelEnvironment.blockIndex]).length;

        if (direction === 'moveDown') {
            // calculationArea modifications
            yCalculationAreaModifier = -1;
        }
        if (direction === 'moveLeft') {
            // calculationArea modifications
            xCalculationAreaModifier = 1;
            // playArea modifications
            playerLevelEnvironment.xPlayArea = playerLevelEnvironment.xPlayArea - gameLevelEnvironment.pixelSize;
        }
        if (direction === 'moveRight') {
            // calculationArea modifications
            xCalculationAreaModifier = -1;
            // playArea modifications
            playerLevelEnvironment.xPlayArea = playerLevelEnvironment.xPlayArea + gameLevelEnvironment.pixelSize;
        }
        if (direction === 'rotateLeft') {
            // calculationArea modifications
            playerLevelEnvironment.rotationIndex++;
            if (playerLevelEnvironment.rotationIndex === numberOfRotations) {
                playerLevelEnvironment.rotationIndex = 0;
            }
            rotationModifier = -1;
        }
        if (direction === 'rotateRight') {
            // calculationArea modifications
            playerLevelEnvironment.rotationIndex--;
            if (playerLevelEnvironment.rotationIndex < 0) {
                playerLevelEnvironment.rotationIndex = numberOfRotations - 1;
            }
            rotationModifier = 1;
        }
        if (direction === "") {
            // do nothing
        }

        // test if we can make the move

        playerLevelEnvironment.moveCanBeDone = true;

        // 1.0. copy currentCalculationArea to tempCalculationArea

        const numberOfRows = currentCalculationArea.length;
        const numberOfColumns = currentCalculationArea[0].length;
        for (let y = 0; y < numberOfRows; y++) {
            for (let x = 0; x < numberOfColumns; x++) {
                tempCalculationArea[y][x] = currentCalculationArea[y][x];
            }
        }

        // 1.1. remove blockMap from tempCalculationArea

        playerLevelEnvironment.rotationIndex += rotationModifier;
        if (playerLevelEnvironment.rotationIndex < 0) {
            playerLevelEnvironment.rotationIndex = numberOfRotations - 1;
        }
        if (playerLevelEnvironment.rotationIndex === numberOfRotations) {
            playerLevelEnvironment.rotationIndex = 0;
        }

        let blockMapNumberOfRows = Object.keys(blockMap[playerLevelEnvironment.blockIndex][playerLevelEnvironment.rotationIndex][playerLevelEnvironment.rotationIndex]).length;
        let blockMapNumberOfColumns = Object.keys(blockMap[playerLevelEnvironment.blockIndex][playerLevelEnvironment.rotationIndex][playerLevelEnvironment.rotationIndex][0]).length;
        for (y = 0; y < blockMapNumberOfRows; y++) {
            for (x = 0; x < blockMapNumberOfColumns; x++) {
                isRectangleFilled = blockMap[playerLevelEnvironment.blockIndex][playerLevelEnvironment.rotationIndex][playerLevelEnvironment.rotationIndex][y][x];
                if (isRectangleFilled === 1) {
                    yOnCalculationArea = Math.floor(playerLevelEnvironment.yPlayArea / gameLevelEnvironment.pixelSize) + y + yCalculationAreaModifier;
                    xOnCalculationArea = Math.floor(playerLevelEnvironment.xPlayArea / gameLevelEnvironment.pixelSize) + x + xCalculationAreaModifier;
                    tempCalculationArea[yOnCalculationArea][xOnCalculationArea] = 0;
                }
            }
        }

        // 1.2. test if we could add the block to tempCalculationArea without overlap or any other problems

        playerLevelEnvironment.rotationIndex -= rotationModifier;
        if (playerLevelEnvironment.rotationIndex < 0) {
            playerLevelEnvironment.rotationIndex = numberOfRotations - 1;
        }
        if (playerLevelEnvironment.rotationIndex === numberOfRotations) {
            playerLevelEnvironment.rotationIndex = 0;
        }
        blockMapNumberOfRows = Object.keys(blockMap[playerLevelEnvironment.blockIndex][playerLevelEnvironment.rotationIndex][playerLevelEnvironment.rotationIndex]).length;
        blockMapNumberOfColumns = Object.keys(blockMap[playerLevelEnvironment.blockIndex][playerLevelEnvironment.rotationIndex][playerLevelEnvironment.rotationIndex][0]).length;

        for (y = 0; y < blockMapNumberOfRows; y++) {
            for (x = 0; x < blockMapNumberOfColumns; x++) {
                isRectangleFilled = blockMap[playerLevelEnvironment.blockIndex][playerLevelEnvironment.rotationIndex][playerLevelEnvironment.rotationIndex][y][x];
                if (isRectangleFilled === 1) {
                    yOnCalculationArea = Math.floor(playerLevelEnvironment.yPlayArea / gameLevelEnvironment.pixelSize) + y;
                    xOnCalculationArea = Math.floor(playerLevelEnvironment.xPlayArea / gameLevelEnvironment.pixelSize) + x;
                    if (yOnCalculationArea > (numberOfRows - 2)) {
                        // block reached the bottom
                        playerLevelEnvironment.selectANewBlockNextFrame = true;
                        playerLevelEnvironment.moveCanBeDone = false;
                    }
                    if (tempCalculationArea[yOnCalculationArea][xOnCalculationArea] !== 0) {
                        // move can not be done, as the block in the new position would overlap with something
                        playerLevelEnvironment.moveCanBeDone = false;
                    }
                }
            }
        }

        if (playerLevelEnvironment.moveCanBeDone === true) {

            // 1.3. move can be done - remove blockMap from currentCalculationArea

            playerLevelEnvironment.rotationIndex += rotationModifier;
            if (playerLevelEnvironment.rotationIndex < 0) {
                playerLevelEnvironment.rotationIndex = numberOfRotations - 1;
            }
            if (playerLevelEnvironment.rotationIndex === numberOfRotations) {
                playerLevelEnvironment.rotationIndex = 0;
            }
            blockMapNumberOfRows = Object.keys(blockMap[playerLevelEnvironment.blockIndex][playerLevelEnvironment.rotationIndex][playerLevelEnvironment.rotationIndex]).length;
            blockMapNumberOfColumns = Object.keys(blockMap[playerLevelEnvironment.blockIndex][playerLevelEnvironment.rotationIndex][playerLevelEnvironment.rotationIndex][0]).length;

            for (y = 0; y < blockMapNumberOfRows; y++) {
                for (x = 0; x < blockMapNumberOfColumns; x++) {
                    isRectangleFilled = blockMap[playerLevelEnvironment.blockIndex][playerLevelEnvironment.rotationIndex][playerLevelEnvironment.rotationIndex][y][x];
                    if (isRectangleFilled === 1) {
                        yOnCalculationArea = Math.floor(playerLevelEnvironment.yPlayArea / gameLevelEnvironment.pixelSize) + y + yCalculationAreaModifier;
                        xOnCalculationArea = Math.floor(playerLevelEnvironment.xPlayArea / gameLevelEnvironment.pixelSize) + x + xCalculationAreaModifier;
                        currentCalculationArea[yOnCalculationArea][xOnCalculationArea] = 0;
                    }
                }
            }

            // 1.4. add blockMap to currentCalculationArea

            playerLevelEnvironment.rotationIndex -= rotationModifier;
            if (playerLevelEnvironment.rotationIndex < 0) {
                playerLevelEnvironment.rotationIndex = numberOfRotations - 1;
            }
            if (playerLevelEnvironment.rotationIndex === numberOfRotations) {
                playerLevelEnvironment.rotationIndex = 0;
            }
            blockMapNumberOfRows = Object.keys(blockMap[playerLevelEnvironment.blockIndex][playerLevelEnvironment.rotationIndex][playerLevelEnvironment.rotationIndex]).length;
            blockMapNumberOfColumns = Object.keys(blockMap[playerLevelEnvironment.blockIndex][playerLevelEnvironment.rotationIndex][playerLevelEnvironment.rotationIndex][0]).length;
            for (y = 0; y < blockMapNumberOfRows; y++) {
                for (x = 0; x < blockMapNumberOfColumns; x++) {
                    isRectangleFilled = blockMap[playerLevelEnvironment.blockIndex][playerLevelEnvironment.rotationIndex][playerLevelEnvironment.rotationIndex][y][x];
                    if (isRectangleFilled === 1) {
                        yOnCalculationArea = Math.floor(playerLevelEnvironment.yPlayArea / gameLevelEnvironment.pixelSize) + y;
                        xOnCalculationArea = Math.floor(playerLevelEnvironment.xPlayArea / gameLevelEnvironment.pixelSize) + x;
                        currentCalculationArea[yOnCalculationArea][xOnCalculationArea] = playerLevelEnvironment.blockIndex+1;
                    }
                }
            }
        } // if (playerLevelEnvironment.moveCanBeDone === true)

        else {
            // move can not be done

            if (direction === 'moveDown') {
                playerLevelEnvironment.selectANewBlockNextFrame = true;
            }
            if (direction === 'moveLeft') {
                playerLevelEnvironment.xPlayArea = playerLevelEnvironment.xPlayArea + gameLevelEnvironment.pixelSize;
            }
            if (direction === 'moveRight') {
                playerLevelEnvironment.xPlayArea = playerLevelEnvironment.xPlayArea - gameLevelEnvironment.pixelSize;
            }
            if (direction === 'rotateLeft') {
                playerLevelEnvironment.rotationIndex--;
                if (playerLevelEnvironment.rotationIndex < 0) {
                    playerLevelEnvironment.rotationIndex = numberOfRotations - 1;
                }
            }
            if (direction === 'rotateRight') {
                playerLevelEnvironment.rotationIndex++;
                if (playerLevelEnvironment.rotationIndex === numberOfRotations) {
                    playerLevelEnvironment.rotationIndex = 0;
                }
            }
        }
    }


    // this function draws the playArea, the shadow and the pixel perfect falling block

    function drawPlayAreaWithFallingBlock() {

        let x;
        let y;
        const c = document.getElementById("playAreaCanvas");
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

        const blockMapNumberOfRows = Object.keys(blockMap[playerLevelEnvironment.blockIndex][playerLevelEnvironment.rotationIndex][playerLevelEnvironment.rotationIndex]).length;
        const blockMapNumberOfColumns = Object.keys(blockMap[playerLevelEnvironment.blockIndex][playerLevelEnvironment.rotationIndex][playerLevelEnvironment.rotationIndex][0]).length;
        let isRectangleFilled;
        for (y = 0; y < blockMapNumberOfRows; y++) {
            for (x = 0; x < blockMapNumberOfColumns; x++) {
                isRectangleFilled = blockMap[playerLevelEnvironment.blockIndex][playerLevelEnvironment.rotationIndex][playerLevelEnvironment.rotationIndex][y][x];
                if (isRectangleFilled === 1) {
                    const yOnCalculationArea = Math.floor(playerLevelEnvironment.yPlayArea / gameLevelEnvironment.pixelSize) + y;
                    const xOnCalculationArea = Math.floor(playerLevelEnvironment.xPlayArea / gameLevelEnvironment.pixelSize) + x;
                    tempCalculationArea[yOnCalculationArea][xOnCalculationArea] = 0;
                }
            }
        }

        drawAllBlocksToPlayArea(ctx);

        // draw a the shadow of the moving block

        drawShadow();

        // draw pixel perfect moving block

        const xModifierInSquares = playerLevelEnvironment.xPlayArea / gameLevelEnvironment.pixelSize;
        const yModifierInSquares = playerLevelEnvironment.yPlayArea / gameLevelEnvironment.pixelSize;
        const yModifierInPixels = 0;
        const blockToDrawIndex = playerLevelEnvironment.blockIndex;
        const blockToDrawRotation = playerLevelEnvironment.rotationIndex;
        const drawEmptyLines = true;
        const blockMapToDraw = blockMap[blockToDrawIndex][blockToDrawRotation][blockToDrawRotation];
        const blockToDrawColor = colorRelated.getBlockColor(blockToDrawIndex);
        drawBlock.drawBlock(ctx, blockMapToDraw, blockToDrawColor, xModifierInSquares, yModifierInSquares, yModifierInPixels, drawEmptyLines, playerLevelEnvironment.playAreaMode, playerLevelEnvironment.fullLines, playerLevelEnvironment.gameEndFadeAnimationCounter, gameLevelEnvironment.gameEndFadeAnimationLength, playerLevelEnvironment.fullLineFadeAnimationCounter, gameLevelEnvironment.fullLineFadeAnimationLength);

    }


    // this function draws all blocks one by one to the playArea

    function drawAllBlocksToPlayArea(ctx) {

        // go thru the blocks one by one in playerLevelEnvironment.listOfBlocksInThePlayingArea
        for (let i = 0; i < playerLevelEnvironment.listOfBlocksInThePlayingArea.length; i++) {

            // draw the block
            const xModifierInSquares = playerLevelEnvironment.listOfBlocksInThePlayingArea[i].blockX;
            const yModifierInSquares = playerLevelEnvironment.listOfBlocksInThePlayingArea[i].blockY + 1;
            const yModifierInPixels = 0;
            const drawEmptyLines = true;
            const blockMapToDraw = playerLevelEnvironment.listOfBlocksInThePlayingArea[i].blockMap;
            const blockToDrawColor = colorRelated.getBlockColor(playerLevelEnvironment.listOfBlocksInThePlayingArea[i].blockIndex);
            drawBlock.drawBlock(ctx, blockMapToDraw, blockToDrawColor, xModifierInSquares, yModifierInSquares, yModifierInPixels, drawEmptyLines, playerLevelEnvironment.playAreaMode, playerLevelEnvironment.fullLines, playerLevelEnvironment.gameEndFadeAnimationCounter, gameLevelEnvironment.gameEndFadeAnimationLength, playerLevelEnvironment.fullLineFadeAnimationCounter, gameLevelEnvironment.fullLineFadeAnimationLength);

        }
    }


    // this function draws the play area, sometimes with opacity

    function drawPlayArea() {

        // get the canvas
        const c = document.getElementById("playAreaCanvas");
        const ctx = c.getContext("2d");

        // clear the canvas
        ctx.clearRect(0, 0, c.width, c.height);

        // draw the canvas
        drawAllBlocksToPlayArea(ctx);

    }


    // this function checks if we have full lines in the calculationArea and removes them

    function checkFullLineInCurrentCalculationArea(){

        playerLevelEnvironment.fullLines = [];
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
                playerLevelEnvironment.fullLines.push(i);
            }
        }
        if (fullLineFound === true) {
            playerLevelEnvironment.playAreaMode = 'fullLineRemoveAnimation';
            let numberOfNewLinesCleared = playerLevelEnvironment.fullLines.length;
            let numberOfLinesCleared = statRelated.increaseNumberOfLinesCleared(numberOfNewLinesCleared);
            let pointsReceived = statRelated.calculatePointsReceived(numberOfNewLinesCleared, playerLevelEnvironment.gameLevel);
            playerLevelEnvironment.points += pointsReceived;

            chat.sayPointsReceived(pointsReceived, numberOfNewLinesCleared);
            if (
                Math.round(numberOfLinesCleared / gameLevelEnvironment.numberOfLinesNeedsToBeClearedToIncreaseGameSpeed) !==
                Math.round((numberOfLinesCleared-numberOfNewLinesCleared) / gameLevelEnvironment.numberOfLinesNeedsToBeClearedToIncreaseGameSpeed)
            ) {
                playerLevelEnvironment.gameLevel++;
                playerLevelEnvironment.fallingSpeed = playerLevelEnvironment.fallingSpeed + 0.5;
                chat.sayLevelIncreased(playerLevelEnvironment.gameLevel);
            }
        }
    }


    // this function animates the full lines, until they are non-visible

    function animateFullLines() {

        playerLevelEnvironment.fullLineFadeAnimationCounter--;

        if (playerLevelEnvironment.fullLineFadeAnimationCounter === 0) {
            playerLevelEnvironment.fullLineFadeAnimationCounter = gameLevelEnvironment.fullLineFadeAnimationLength;
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

            // modify playerLevelEnvironment.listOfBlocksInThePlayingArea because of full line
            modifyListOfBlocksInThePlayingAreaBecauseOfFullLine(fullLine);
        }

        playerLevelEnvironment.playAreaMode = 'gravityAnimation';

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
            const blockMapNumberOfRows = Object.keys(blockMap[playerLevelEnvironment.blockIndex][playerLevelEnvironment.rotationIndex][playerLevelEnvironment.rotationIndex]).length;
            const blockMapNumberOfColumns = Object.keys(blockMap[playerLevelEnvironment.blockIndex][playerLevelEnvironment.rotationIndex][playerLevelEnvironment.rotationIndex][0]).length;
            for (let y = 0; y < blockMapNumberOfRows; y++) {
                for (let x = 0; x < blockMapNumberOfColumns; x++) {
                    isRectangleFilled = blockMap[playerLevelEnvironment.blockIndex][playerLevelEnvironment.rotationIndex][playerLevelEnvironment.rotationIndex][y][x];
                    if (isRectangleFilled === 1) {
                        const yOnCalculationArea = Math.floor(playerLevelEnvironment.yPlayArea / gameLevelEnvironment.pixelSize) + y + yModifier;
                        const xOnCalculationArea = Math.floor(playerLevelEnvironment.xPlayArea / gameLevelEnvironment.pixelSize) + x;
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
        const c = document.getElementById("playAreaCanvas");
        const ctx = c.getContext("2d");

        const xModifierInSquares = Math.floor(playerLevelEnvironment.xPlayArea / gameLevelEnvironment.pixelSize);
        const yModifierInSquares = Math.floor(playerLevelEnvironment.yPlayArea / gameLevelEnvironment.pixelSize) + yModifier - 1;
        const yModifierInPixels = 0;
        const blockToDrawIndex = playerLevelEnvironment.blockIndex;
        const blockToDrawRotation = playerLevelEnvironment.rotationIndex;
        const drawEmptyLines = true;
        const blockMapToDraw = blockMap[blockToDrawIndex][blockToDrawRotation][blockToDrawRotation];
        const blockToDrawColor = colorRelated.getBlockColor('shadow');
        drawBlock.drawBlock(ctx, blockMapToDraw, blockToDrawColor, xModifierInSquares, yModifierInSquares, yModifierInPixels, drawEmptyLines, playerLevelEnvironment.playAreaMode, playerLevelEnvironment.fullLines, playerLevelEnvironment.gameEndFadeAnimationCounter, gameLevelEnvironment.gameEndFadeAnimationLength, playerLevelEnvironment.fullLineFadeAnimationCounter, gameLevelEnvironment.fullLineFadeAnimationLength);

    }


    // this function draws the next blocks to the nextBlocksAreaCanvas

    function drawNextBlocksArea() {

        // let's draw the block
        const c = document.getElementById("nextBlocksAreaCanvas");
        const ctx = c.getContext("2d");
        ctx.clearRect(0, 0, c.width, c.height);

        for (let i = 0; i < gameLevelEnvironment.numberOfBlocksDisplayedInTheNextBlocksArea; i++) {
            const allBlockPointer = (playerLevelEnvironment.blockCounter + i + 1) % gameLevelEnvironment.numberOfBlocksInAllBlocks;
            const blockToDrawIndex = gameLevelEnvironment.allBlocks[allBlockPointer];
            const blockToDrawRotation = 0;
            const xModifierInSquares = ((gameLevelEnvironment.numberOfBlocksDisplayedInTheNextBlocksArea - 1) * 5) - (i * 5);
            const yModifierInSquares = 0;
            const yModifierInPixels = 0;
            const drawEmptyLines = false;
            const blockMapToDraw = blockMap[blockToDrawIndex][blockToDrawRotation][blockToDrawRotation];
            const blockToDrawColor = colorRelated.getBlockColor(blockToDrawIndex);
            drawBlock.drawBlock(ctx, blockMapToDraw, blockToDrawColor, xModifierInSquares, yModifierInSquares, yModifierInPixels, drawEmptyLines, playerLevelEnvironment.playAreaMode, playerLevelEnvironment.fullLines, playerLevelEnvironment.gameEndFadeAnimationCounter, gameLevelEnvironment.gameEndFadeAnimationLength, playerLevelEnvironment.fullLineFadeAnimationCounter, gameLevelEnvironment.fullLineFadeAnimationLength);
        }
    }


    // this function saves the block that has completed its journey to playerLevelEnvironment.listOfBlocksInThePlayingArea

    function saveDoneBlock() {

        let blockAlreadyInserted = false;
        for (let i = 0; i < playerLevelEnvironment.listOfBlocksInThePlayingArea.length; i++) {
            if (playerLevelEnvironment.listOfBlocksInThePlayingArea[i].blockCounter === playerLevelEnvironment.blockCounter) {
                blockAlreadyInserted = true;
            }
        }

        if (blockAlreadyInserted === false) {
            try {
                playerLevelEnvironment.listOfBlocksInThePlayingArea.push({
                    blockMap: blockMap[playerLevelEnvironment.blockIndex][playerLevelEnvironment.rotationIndex][playerLevelEnvironment.rotationIndex],
                    blockIndex: playerLevelEnvironment.blockIndex,
                    blockX: Math.floor(playerLevelEnvironment.xPlayArea / gameLevelEnvironment.pixelSize),
                    blockY: Math.floor(playerLevelEnvironment.yPlayArea / gameLevelEnvironment.pixelSize) - 1,
                    blockCounter: playerLevelEnvironment.blockCounter,
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
        const c = document.getElementById("currentGravityCalculationAreaCanvas");
        const ctx = c.getContext("2d");
        ctx.clearRect(0, 0, c.width, c.height);

        // go thru the blocks one by one in playerLevelEnvironment.listOfBlocksInThePlayingArea
        let isRectangleFilled;
        for (let i = 0; i < playerLevelEnvironment.listOfBlocksInThePlayingArea.length; i++) {
            const blockMapNumberOfRows = Object.keys(playerLevelEnvironment.listOfBlocksInThePlayingArea[i].blockMap).length;
            const blockMapNumberOfColumns = Object.keys(playerLevelEnvironment.listOfBlocksInThePlayingArea[i].blockMap[0]).length;
            for (y = 0; y < blockMapNumberOfRows; y++) {
                for (x = 0; x < blockMapNumberOfColumns; x++) {
                    isRectangleFilled = playerLevelEnvironment.listOfBlocksInThePlayingArea[i].blockMap[y][x];
                    if (isRectangleFilled === 1) {
                        // copy the map of the block to currentGravityCalculationArea
                        const yOnGravityCalculationArea = playerLevelEnvironment.listOfBlocksInThePlayingArea[i].blockY + y;
                        const xOnGravityCalculationArea = playerLevelEnvironment.listOfBlocksInThePlayingArea[i].blockX + x;
                        let colorOnGravityCalculationArea = playerLevelEnvironment.listOfBlocksInThePlayingArea[i].blockIndex + 1;
                        currentGravityCalculationArea[yOnGravityCalculationArea][xOnGravityCalculationArea] = colorOnGravityCalculationArea;
                    }
                }
            }
        }
    }


    // this function modifies blocks in the playerLevelEnvironment.listOfBlocksInThePlayingArea in case there was a full line

    function modifyListOfBlocksInThePlayingAreaBecauseOfFullLine(fullLineIndex) {

        let newBlockMap;
        let x;
        let y;

        // go thru the blocks one by one in playerLevelEnvironment.listOfBlocksInThePlayingArea
        // (we iterate backwards, so when we remove an item reindexing the array will not break the loop)
        let blockIsAffected;
        let isRectangleFilled;
        let lineAffected;
        let thereWerePixelsAboveTheCut;
        let thereWerePixelsUnderTheCut;
        for (let i = playerLevelEnvironment.listOfBlocksInThePlayingArea.length - 1; i >= 0; i--) {
            blockIsAffected = false;
            playerLevelEnvironment.listOfBlocksInThePlayingArea[i].wasChecked = true;
            const blockMapNumberOfRows = Object.keys(playerLevelEnvironment.listOfBlocksInThePlayingArea[i].blockMap).length;
            const blockMapNumberOfColumns = Object.keys(playerLevelEnvironment.listOfBlocksInThePlayingArea[i].blockMap[0]).length;
            for (y = 0; y < blockMapNumberOfRows; y++) {
                for (x = 0; x < blockMapNumberOfColumns; x++) {
                    isRectangleFilled = playerLevelEnvironment.listOfBlocksInThePlayingArea[i].blockMap[y][x];
                    if (isRectangleFilled === 1) {
                        if (fullLineIndex === (playerLevelEnvironment.listOfBlocksInThePlayingArea[i].blockY + y)) {
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
                        isRectangleFilled = playerLevelEnvironment.listOfBlocksInThePlayingArea[i].blockMap[y][x];
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
                    playerLevelEnvironment.listOfBlocksInThePlayingArea.push({
                        blockMap: newBlockMap,
                        blockIndex: playerLevelEnvironment.listOfBlocksInThePlayingArea[i].blockIndex,
                        blockX: playerLevelEnvironment.listOfBlocksInThePlayingArea[i].blockX,
                        blockY: playerLevelEnvironment.listOfBlocksInThePlayingArea[i].blockY,
                        blockCounter: playerLevelEnvironment.listOfBlocksInThePlayingArea[i].blockCounter
                    });
                    for (y = 0; y < lineAffected; y++) {
                        for (x = 0; x < blockMapNumberOfColumns; x++) {
                            playerLevelEnvironment.listOfBlocksInThePlayingArea[playerLevelEnvironment.listOfBlocksInThePlayingArea.length - 1].blockMap[y][x] = playerLevelEnvironment.listOfBlocksInThePlayingArea[i].blockMap[y][x];
                        }
                    }
                }
                thereWerePixelsUnderTheCut = false;
                for (y = lineAffected + 1; y < blockMapNumberOfRows; y++) {
                    for (x = 0; x < blockMapNumberOfColumns; x++) {
                        isRectangleFilled = playerLevelEnvironment.listOfBlocksInThePlayingArea[i].blockMap[y][x];
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
                    playerLevelEnvironment.listOfBlocksInThePlayingArea.push({
                        blockMap: newBlockMap,
                        blockIndex: playerLevelEnvironment.listOfBlocksInThePlayingArea[i].blockIndex,
                        blockX: playerLevelEnvironment.listOfBlocksInThePlayingArea[i].blockX,
                        blockY: playerLevelEnvironment.listOfBlocksInThePlayingArea[i].blockY + lineAffected + 1,
                        blockCounter: playerLevelEnvironment.listOfBlocksInThePlayingArea[i].blockCounter
                    });
                    for (y = lineAffected + 1; y < blockMapNumberOfRows; y++) {
                        for (x = 0; x < blockMapNumberOfColumns; x++) {
                            playerLevelEnvironment.listOfBlocksInThePlayingArea[playerLevelEnvironment.listOfBlocksInThePlayingArea.length - 1].blockMap[y - (lineAffected + 1)][x] = playerLevelEnvironment.listOfBlocksInThePlayingArea[i].blockMap[y][x];
                        }
                    }
                }
                // remove the old item from the list
                playerLevelEnvironment.listOfBlocksInThePlayingArea.splice(i, 1);
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
        playerLevelEnvironment.listOfBlocksThatCanBeMoved = [];

        // let's iterate thru all the blocks we have in playerLevelEnvironment.listOfBlocksInThePlayingArea
        let isRectangleFilled;
        for (let i = 0; i < playerLevelEnvironment.listOfBlocksInThePlayingArea.length; i++) {

            // clear currentGravityCalculationArea
            let numberOfRows = currentGravityCalculationArea.length;
            let numberOfColumns = currentGravityCalculationArea[0].length;
            for (y = 0; y < numberOfRows; y++) {
                for (x = 0; x < numberOfColumns; x++) {
                    currentGravityCalculationArea[y][x] = 0;
                }
            }

            // calculate currentGravityCalculationArea, without the current block

            // go thru the blocks one by one in playerLevelEnvironment.listOfBlocksInThePlayingArea
            // draw every block except the one we calculate now
            for (let k = 0; k < playerLevelEnvironment.listOfBlocksInThePlayingArea.length; k++) {
                if (k !== i) {
                    blockMapNumberOfRows = Object.keys(playerLevelEnvironment.listOfBlocksInThePlayingArea[k].blockMap).length;
                    blockMapNumberOfColumns = Object.keys(playerLevelEnvironment.listOfBlocksInThePlayingArea[k].blockMap[0]).length;
                    for (y = 0; y < blockMapNumberOfRows; y++) {
                        for (x = 0; x < blockMapNumberOfColumns; x++) {
                            isRectangleFilled = playerLevelEnvironment.listOfBlocksInThePlayingArea[k].blockMap[y][x];
                            if (isRectangleFilled === 1) {
                                const yOnGravityCalculationArea = playerLevelEnvironment.listOfBlocksInThePlayingArea[k].blockY + y;
                                const xOnGravityCalculationArea = playerLevelEnvironment.listOfBlocksInThePlayingArea[k].blockX + x;
                                const colorOnGravityCalculationArea = playerLevelEnvironment.listOfBlocksInThePlayingArea[k].blockIndex + 1;
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
            blockMapNumberOfRows = Object.keys(playerLevelEnvironment.listOfBlocksInThePlayingArea[i].blockMap).length;
            blockMapNumberOfColumns = Object.keys(playerLevelEnvironment.listOfBlocksInThePlayingArea[i].blockMap[0]).length;

            for (y = 0; y < blockMapNumberOfRows; y++) {
                for (x = 0; x < blockMapNumberOfColumns; x++) {
                    isRectangleFilled = playerLevelEnvironment.listOfBlocksInThePlayingArea[i].blockMap[y][x];
                    if (isRectangleFilled === 1) {
                        const yOnCalculationArea = playerLevelEnvironment.listOfBlocksInThePlayingArea[i].blockY + y + yModifier + 1;
                        const xOnCalculationArea = playerLevelEnvironment.listOfBlocksInThePlayingArea[i].blockX + x;
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
                playerLevelEnvironment.listOfBlocksThatCanBeMoved.push(i);
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
        const c = document.getElementById("playAreaCanvas");
        const ctx = c.getContext("2d");
        ctx.clearRect(0, 0, c.width, c.height);

        // go thru the blocks one by one in playerLevelEnvironment.listOfBlocksInThePlayingArea
        let yModifierInPixels;
        for (let i = 0; i < playerLevelEnvironment.listOfBlocksInThePlayingArea.length; i++) {

            const xModifierInSquares = playerLevelEnvironment.listOfBlocksInThePlayingArea[i].blockX;
            const yModifierInSquares = playerLevelEnvironment.listOfBlocksInThePlayingArea[i].blockY + 1;
            const drawEmptyLines = true;
            const blockMapToDraw = playerLevelEnvironment.listOfBlocksInThePlayingArea[i].blockMap;
            const blockToDrawColor = colorRelated.getBlockColor(playerLevelEnvironment.listOfBlocksInThePlayingArea[i].blockIndex);
            if (playerLevelEnvironment.listOfBlocksThatCanBeMoved.includes(i)) {
                yModifierInPixels = playerLevelEnvironment.gravityAnimationYModifier;
            } else {
                yModifierInPixels = 0;
            }
            drawBlock.drawBlock(ctx, blockMapToDraw, blockToDrawColor, xModifierInSquares, yModifierInSquares, yModifierInPixels, drawEmptyLines, playerLevelEnvironment.playAreaMode, playerLevelEnvironment.fullLines, playerLevelEnvironment.gameEndFadeAnimationCounter, gameLevelEnvironment.gameEndFadeAnimationLength, playerLevelEnvironment.fullLineFadeAnimationCounter, gameLevelEnvironment.fullLineFadeAnimationLength);
        }
    }


    // this function does the "blockFallingAnimation" routine

    function blockFallingRoutine() {

        // check if we have full lines, if we have them, remove them
        checkFullLineInCurrentCalculationArea();

        // if we need to set a new block, save the old one and set a new one
        if (playerLevelEnvironment.selectANewBlockNextFrame === true) {

            // save old one
            saveDoneBlock();

            // select a new one
            blockGenerator.selectANewBlock();
            playerLevelEnvironment.selectANewBlockNextFrame = false;
        }

        // let's move the current block down

        // y previously in the calculationArea
        let previousYCalculationArea = Math.floor(playerLevelEnvironment.yPlayArea / gameLevelEnvironment.pixelSize);
        // y in the playArea
        playerLevelEnvironment.yPlayArea = playerLevelEnvironment.yPlayArea + playerLevelEnvironment.fallingSpeed;
        // y now in the calculationArea
        let currentYCalculationArea = Math.floor(playerLevelEnvironment.yPlayArea / gameLevelEnvironment.pixelSize);
        // do we need to move down the block in the calculationArea
        if (previousYCalculationArea !== currentYCalculationArea) {
            // yes, try to do the move in calculationArea
            moveBlockInCalculationArea('moveDown');
        } else {
            // no, just recalculate calculationArea
            moveBlockInCalculationArea('');
        }

        // if the current block will be replaced next frame, don't draw the playArea
        if (playerLevelEnvironment.selectANewBlockNextFrame === false) {
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
            hideFullLines(playerLevelEnvironment.fullLines);

            // check if any block can fall down
            const isThereABlockThatCanBeMoved = checkIfAnyBlockCanFallDown();
            if (isThereABlockThatCanBeMoved === true) {
                playerLevelEnvironment.playAreaMode = 'gravityAnimation';
            } else {
                playerLevelEnvironment.playAreaMode = 'blockFallingAnimation';
            }
        }
    }


    // this function does the "gravityAnimation" routine

    function gravityAnimationRoutine() {

        playerLevelEnvironment.gravityAnimationYModifier = playerLevelEnvironment.gravityAnimationYModifier + gameLevelEnvironment.gravityAnimationFallingSpeed;
        if (playerLevelEnvironment.gravityAnimationYModifier < gameLevelEnvironment.pixelSize) {
            drawPlayAreaWithFallingBlocks();
        } else {
            for (let i = 0; i < playerLevelEnvironment.listOfBlocksThatCanBeMoved.length; i++) {
                playerLevelEnvironment.listOfBlocksInThePlayingArea[playerLevelEnvironment.listOfBlocksThatCanBeMoved[i]].blockY++;
            }
            calculateCurrentGravityCalculationArea();
            copyCurrentGravityCalculationAreaToCurrentCalculationArea();

            playerLevelEnvironment.gravityAnimationYModifier = 0;

            const isThereABlockThatCanBeMoved = checkIfAnyBlockCanFallDown();
            if (isThereABlockThatCanBeMoved === true) {
                playerLevelEnvironment.playAreaMode = 'gravityAnimation';
            } else {
                playerLevelEnvironment.playAreaMode = 'blockFallingAnimation';
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
        playerLevelEnvironment.gameEndFadeAnimationCounter--;

        // check if everything has faded out properly
        if (playerLevelEnvironment.gameEndFadeAnimationCounter === 20) {

            playerLevelEnvironment.gameEndFadeAnimationCounter = gameLevelEnvironment.gameEndFadeAnimationLength;

            statRelated.displayGameEndStats(playerLevelEnvironment.blockCounter);

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

        switch (playerLevelEnvironment.playAreaMode) {
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

        // increase playerLevelEnvironment.frameNumber
        playerLevelEnvironment.frameNumber++;

        // let's restart the game loop in the next frame
        if (!gameLevelEnvironment.stopTheGameLoop) {
            requestAnimationFrame(gameLoop);
        }

    }


// we start everything here

// the checkKeyboardInput() function will take care of the keyboard interactions
document.onkeydown = checkKeyboardInput;

// let's generate the first 3 blocks
playerLevelEnvironment.blockIndex = blockGenerator.selectABlockRandomly();
playerLevelEnvironment.nextBlocks.unshift(playerLevelEnvironment.blockIndex);
playerLevelEnvironment.blockIndex = blockGenerator.selectABlockRandomly();
playerLevelEnvironment.nextBlocks.unshift(playerLevelEnvironment.blockIndex);
playerLevelEnvironment.blockIndex = blockGenerator.selectABlockRandomly();
playerLevelEnvironment.nextBlocks.unshift(playerLevelEnvironment.blockIndex);

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

// set playerLevelEnvironment.playAreaMode
playerLevelEnvironment.playAreaMode = 'blockFallingAnimation';

// record game start time
statRelated.setGameStartTime();

// start the game loop
requestAnimationFrame(gameLoop);