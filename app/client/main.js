const gameLevelEnvironment = require('./includes/gameLevelEnvironment');

const numberOfPlayers = 2;
let playerLevelEnvironment = [];
let calculationAreaDefinitions = [];
let currentCalculationArea = [];
let tempCalculationArea = [];
let currentGravityCalculationArea = [];
let previousCalculationArea = [];
for (let i = 0; i < numberOfPlayers; i++) {
    playerLevelEnvironment[i] = require('./includes/playerLevelEnvironment');

    calculationAreaDefinitions[i] = require('./includes/calculationAreaDefinitions');
    currentCalculationArea[i] = calculationAreaDefinitions[i].currentCalculationArea;
    tempCalculationArea[i] = calculationAreaDefinitions[i].tempCalculationArea;
    currentGravityCalculationArea[i] = calculationAreaDefinitions[i].currentGravityCalculationArea;
    previousCalculationArea[i] = calculationAreaDefinitions[i].previousCalculationArea;
}

const currentPlayer = 0;

const blockMap = require('./includes/blockMap');
const colorRelated = require('./includes/colorRelated');
const statRelated = require('./includes/statRelated');
const drawBlock = require('./includes/drawBlock');
const chat = require('./includes/chat');
const recordGame = require('./includes/recordGame');
const blockGenerator = require('./includes/blockGenerator');

const socket = io();

if (multiplayer === true) {
    socket.on('serverEvent', function(serverEventValueOfOtherPlayer, serverEventDetailsOfOtherPlayer, roomIdOfOtherPlayer, playerIdOfOtherPlayer, listOfBlocksInThePlayingAreaOfOtherPlayer){
        console.log('serverEvent', serverEventValueOfOtherPlayer, serverEventDetailsOfOtherPlayer, roomIdOfOtherPlayer, playerIdOfOtherPlayer);
        
        // if this is an event from another player, who is in the same room
        if ( (playerIdOfOtherPlayer !== playerLevelEnvironment[currentPlayer].playerId) && (roomIdOfOtherPlayer === roomId) ) {

            // if any of the other players started the game, let's start our game too
            if (serverEventValueOfOtherPlayer === 'gameStarted') {
                playerLevelEnvironment[currentPlayer].playAreaMode = 'gameStartingCountDownAnimation';
            }

            // if we received a cleared fuzzyLine from the other player, add it to our puffer
            if (serverEventValueOfOtherPlayer === 'clearedLine') {
                playerLevelEnvironment[currentPlayer].fuzzyLinesPuffer.push(serverEventDetailsOfOtherPlayer);
            }

            // draw the canvas of the other player
            drawSecondPlayerArea(listOfBlocksInThePlayingAreaOfOtherPlayer);
        }

    });
}

function sendGameEvent(eventValue, eventDetails = 0) {
    if (multiplayer === true) {
        socket.emit(
            'clientEvent', 
            eventValue, 
            eventDetails,
            roomId,
            playerLevelEnvironment[currentPlayer].playerId, 
            playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea
        );
    }
}

    // this function gets called if there was a keyboard event

    function checkKeyboardInput(event) {

        // if we wait to start the game, check SPACE
        if (playerLevelEnvironment[currentPlayer].playAreaMode == 'waitingForSomeoneToStartTheGame') {
            switch (event.key) {
                case ' ':
                    playerLevelEnvironment[currentPlayer].playAreaMode = 'gameStartingCountDownAnimation';
                    sendGameEvent('gameStarted');
                    chat.sayGameStartsInSeconds(playerLevelEnvironment[currentPlayer].gameStartingCountDownCounter);
                default: 
                    return;
            }
        } else {

            // if there is no saved game being replayed now, handle inputs from the keyboard
            if(!replayingAGame) {
                switch (event.key) {
                    case 'ArrowUp':
                        recordGame.saveGameEvent(playerLevelEnvironment[currentPlayer].frameNumber, 'keyPressed', 'rotateRight');
                        sendGameEvent('rotateRight');
                        handlePlayerInput('rotateRight');
                        break;
                    case 'ArrowDown':
                        recordGame.saveGameEvent(playerLevelEnvironment[currentPlayer].frameNumber, 'keyPressed', 'rotateLeft');
                        sendGameEvent('rotateLeft');
                        handlePlayerInput('rotateLeft');
                        break;
                    case 'ArrowLeft':
                        recordGame.saveGameEvent(playerLevelEnvironment[currentPlayer].frameNumber, 'keyPressed', 'moveLeft');
                        sendGameEvent('moveLeft');
                        handlePlayerInput('moveLeft');
                        break;
                    case 'ArrowRight':
                        recordGame.saveGameEvent(playerLevelEnvironment[currentPlayer].frameNumber, 'keyPressed', 'moveRight');
                        sendGameEvent('moveRight');
                        handlePlayerInput('moveRight');
                        break;
                    case ' ':
                        recordGame.saveGameEvent(playerLevelEnvironment[currentPlayer].frameNumber, 'keyPressed', 'instantDrop');
                        sendGameEvent('instantDrop');
                        handlePlayerInput('instantDrop');
                        break;
                    default:
                        return;
                }
            }
        }
        event.preventDefault();
    }


    // this function feeds the handlePlayerInput function with keyboard actions from the recording

    function checkPlayerInputFromRecording() {
        for (let i = 0; i < preloadedGameString.length; i++) {
            if (preloadedGameString[i].frameNumber === playerLevelEnvironment[currentPlayer].frameNumber) {
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
                while (playerLevelEnvironment[currentPlayer].moveCanBeDone === true) {
                    playerLevelEnvironment[currentPlayer].yPlayArea = playerLevelEnvironment[currentPlayer].yPlayArea + gameLevelEnvironment.pixelSize;
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

        let numberOfRotations = Object.keys(blockMap[playerLevelEnvironment[currentPlayer].blockIndex]).length;

        if (direction === 'moveDown') {
            // calculationArea modifications
            yCalculationAreaModifier = -1;
        }
        if (direction === 'moveLeft') {
            // calculationArea modifications
            xCalculationAreaModifier = 1;
            // playArea modifications
            playerLevelEnvironment[currentPlayer].xPlayArea = playerLevelEnvironment[currentPlayer].xPlayArea - gameLevelEnvironment.pixelSize;
        }
        if (direction === 'moveRight') {
            // calculationArea modifications
            xCalculationAreaModifier = -1;
            // playArea modifications
            playerLevelEnvironment[currentPlayer].xPlayArea = playerLevelEnvironment[currentPlayer].xPlayArea + gameLevelEnvironment.pixelSize;
        }
        if (direction === 'rotateLeft') {
            // calculationArea modifications
            playerLevelEnvironment[currentPlayer].rotationIndex++;
            if (playerLevelEnvironment[currentPlayer].rotationIndex === numberOfRotations) {
                playerLevelEnvironment[currentPlayer].rotationIndex = 0;
            }
            rotationModifier = -1;
        }
        if (direction === 'rotateRight') {
            // calculationArea modifications
            playerLevelEnvironment[currentPlayer].rotationIndex--;
            if (playerLevelEnvironment[currentPlayer].rotationIndex < 0) {
                playerLevelEnvironment[currentPlayer].rotationIndex = numberOfRotations - 1;
            }
            rotationModifier = 1;
        }
        if (direction === "") {
            // do nothing
        }

        // test if we can make the move

        playerLevelEnvironment[currentPlayer].moveCanBeDone = true;

        // 1.0. copy currentCalculationArea to tempCalculationArea

        const numberOfRows = currentCalculationArea[currentPlayer].length;
        const numberOfColumns = currentCalculationArea[currentPlayer][0].length;
        for (let y = 0; y < numberOfRows; y++) {
            for (let x = 0; x < numberOfColumns; x++) {
                tempCalculationArea[currentPlayer][y][x] = currentCalculationArea[currentPlayer][y][x];
            }
        }

        // 1.1. remove blockMap from tempCalculationArea

        playerLevelEnvironment[currentPlayer].rotationIndex += rotationModifier;
        if (playerLevelEnvironment[currentPlayer].rotationIndex < 0) {
            playerLevelEnvironment[currentPlayer].rotationIndex = numberOfRotations - 1;
        }
        if (playerLevelEnvironment[currentPlayer].rotationIndex === numberOfRotations) {
            playerLevelEnvironment[currentPlayer].rotationIndex = 0;
        }

        let blockMapNumberOfRows = Object.keys(blockMap[playerLevelEnvironment[currentPlayer].blockIndex][playerLevelEnvironment[currentPlayer].rotationIndex][playerLevelEnvironment[currentPlayer].rotationIndex]).length;
        let blockMapNumberOfColumns = Object.keys(blockMap[playerLevelEnvironment[currentPlayer].blockIndex][playerLevelEnvironment[currentPlayer].rotationIndex][playerLevelEnvironment[currentPlayer].rotationIndex][0]).length;
        for (y = 0; y < blockMapNumberOfRows; y++) {
            for (x = 0; x < blockMapNumberOfColumns; x++) {
                isRectangleFilled = blockMap[playerLevelEnvironment[currentPlayer].blockIndex][playerLevelEnvironment[currentPlayer].rotationIndex][playerLevelEnvironment[currentPlayer].rotationIndex][y][x];
                if (isRectangleFilled === 1) {
                    yOnCalculationArea = Math.floor(playerLevelEnvironment[currentPlayer].yPlayArea / gameLevelEnvironment.pixelSize) + y + yCalculationAreaModifier;
                    xOnCalculationArea = Math.floor(playerLevelEnvironment[currentPlayer].xPlayArea / gameLevelEnvironment.pixelSize) + x + xCalculationAreaModifier;
                    tempCalculationArea[currentPlayer][yOnCalculationArea][xOnCalculationArea] = 0;
                }
            }
        }

        // 1.2. test if we could add the block to tempCalculationArea without overlap or any other problems

        playerLevelEnvironment[currentPlayer].rotationIndex -= rotationModifier;
        if (playerLevelEnvironment[currentPlayer].rotationIndex < 0) {
            playerLevelEnvironment[currentPlayer].rotationIndex = numberOfRotations - 1;
        }
        if (playerLevelEnvironment[currentPlayer].rotationIndex === numberOfRotations) {
            playerLevelEnvironment[currentPlayer].rotationIndex = 0;
        }
        blockMapNumberOfRows = Object.keys(blockMap[playerLevelEnvironment[currentPlayer].blockIndex][playerLevelEnvironment[currentPlayer].rotationIndex][playerLevelEnvironment[currentPlayer].rotationIndex]).length;
        blockMapNumberOfColumns = Object.keys(blockMap[playerLevelEnvironment[currentPlayer].blockIndex][playerLevelEnvironment[currentPlayer].rotationIndex][playerLevelEnvironment[currentPlayer].rotationIndex][0]).length;

        for (y = 0; y < blockMapNumberOfRows; y++) {
            for (x = 0; x < blockMapNumberOfColumns; x++) {
                isRectangleFilled = blockMap[playerLevelEnvironment[currentPlayer].blockIndex][playerLevelEnvironment[currentPlayer].rotationIndex][playerLevelEnvironment[currentPlayer].rotationIndex][y][x];
                if (isRectangleFilled === 1) {
                    yOnCalculationArea = Math.floor(playerLevelEnvironment[currentPlayer].yPlayArea / gameLevelEnvironment.pixelSize) + y;
                    xOnCalculationArea = Math.floor(playerLevelEnvironment[currentPlayer].xPlayArea / gameLevelEnvironment.pixelSize) + x;
                    if (yOnCalculationArea > (numberOfRows - 2)) {
                        // block reached the bottom
                        playerLevelEnvironment[currentPlayer].selectANewBlockNextFrame = true;
                        playerLevelEnvironment[currentPlayer].moveCanBeDone = false;
                        playerLevelEnvironment[currentPlayer].playAreaMode = 'processFuzzyLines';
                    }
                    if (tempCalculationArea[currentPlayer][yOnCalculationArea][xOnCalculationArea] !== 0) {
                        // move can not be done, as the block in the new position would overlap with something
                        playerLevelEnvironment[currentPlayer].moveCanBeDone = false;
                    }
                }
            }
        }

        if (playerLevelEnvironment[currentPlayer].moveCanBeDone === true) {

            // 1.3. move can be done - remove blockMap from currentCalculationArea

            playerLevelEnvironment[currentPlayer].rotationIndex += rotationModifier;
            if (playerLevelEnvironment[currentPlayer].rotationIndex < 0) {
                playerLevelEnvironment[currentPlayer].rotationIndex = numberOfRotations - 1;
            }
            if (playerLevelEnvironment[currentPlayer].rotationIndex === numberOfRotations) {
                playerLevelEnvironment[currentPlayer].rotationIndex = 0;
            }
            blockMapNumberOfRows = Object.keys(blockMap[playerLevelEnvironment[currentPlayer].blockIndex][playerLevelEnvironment[currentPlayer].rotationIndex][playerLevelEnvironment[currentPlayer].rotationIndex]).length;
            blockMapNumberOfColumns = Object.keys(blockMap[playerLevelEnvironment[currentPlayer].blockIndex][playerLevelEnvironment[currentPlayer].rotationIndex][playerLevelEnvironment[currentPlayer].rotationIndex][0]).length;

            for (y = 0; y < blockMapNumberOfRows; y++) {
                for (x = 0; x < blockMapNumberOfColumns; x++) {
                    isRectangleFilled = blockMap[playerLevelEnvironment[currentPlayer].blockIndex][playerLevelEnvironment[currentPlayer].rotationIndex][playerLevelEnvironment[currentPlayer].rotationIndex][y][x];
                    if (isRectangleFilled === 1) {
                        yOnCalculationArea = Math.floor(playerLevelEnvironment[currentPlayer].yPlayArea / gameLevelEnvironment.pixelSize) + y + yCalculationAreaModifier;
                        xOnCalculationArea = Math.floor(playerLevelEnvironment[currentPlayer].xPlayArea / gameLevelEnvironment.pixelSize) + x + xCalculationAreaModifier;
                        currentCalculationArea[currentPlayer][yOnCalculationArea][xOnCalculationArea] = 0;
                    }
                }
            }

            // 1.4. add blockMap to currentCalculationArea

            playerLevelEnvironment[currentPlayer].rotationIndex -= rotationModifier;
            if (playerLevelEnvironment[currentPlayer].rotationIndex < 0) {
                playerLevelEnvironment[currentPlayer].rotationIndex = numberOfRotations - 1;
            }
            if (playerLevelEnvironment[currentPlayer].rotationIndex === numberOfRotations) {
                playerLevelEnvironment[currentPlayer].rotationIndex = 0;
            }
            blockMapNumberOfRows = Object.keys(blockMap[playerLevelEnvironment[currentPlayer].blockIndex][playerLevelEnvironment[currentPlayer].rotationIndex][playerLevelEnvironment[currentPlayer].rotationIndex]).length;
            blockMapNumberOfColumns = Object.keys(blockMap[playerLevelEnvironment[currentPlayer].blockIndex][playerLevelEnvironment[currentPlayer].rotationIndex][playerLevelEnvironment[currentPlayer].rotationIndex][0]).length;
            for (y = 0; y < blockMapNumberOfRows; y++) {
                for (x = 0; x < blockMapNumberOfColumns; x++) {
                    isRectangleFilled = blockMap[playerLevelEnvironment[currentPlayer].blockIndex][playerLevelEnvironment[currentPlayer].rotationIndex][playerLevelEnvironment[currentPlayer].rotationIndex][y][x];
                    if (isRectangleFilled === 1) {
                        yOnCalculationArea = Math.floor(playerLevelEnvironment[currentPlayer].yPlayArea / gameLevelEnvironment.pixelSize) + y;
                        xOnCalculationArea = Math.floor(playerLevelEnvironment[currentPlayer].xPlayArea / gameLevelEnvironment.pixelSize) + x;
                        currentCalculationArea[currentPlayer][yOnCalculationArea][xOnCalculationArea] = playerLevelEnvironment[currentPlayer].blockIndex+1;
                    }
                }
            }
        } // if (playerLevelEnvironment[currentPlayer].moveCanBeDone === true)

        else {
            // move can not be done

            if (direction === 'moveDown') {
                playerLevelEnvironment[currentPlayer].selectANewBlockNextFrame = true;
                playerLevelEnvironment[currentPlayer].playAreaMode = 'processFuzzyLines';
            }
            if (direction === 'moveLeft') {
                playerLevelEnvironment[currentPlayer].xPlayArea = playerLevelEnvironment[currentPlayer].xPlayArea + gameLevelEnvironment.pixelSize;
            }
            if (direction === 'moveRight') {
                playerLevelEnvironment[currentPlayer].xPlayArea = playerLevelEnvironment[currentPlayer].xPlayArea - gameLevelEnvironment.pixelSize;
            }
            if (direction === 'rotateLeft') {
                playerLevelEnvironment[currentPlayer].rotationIndex--;
                if (playerLevelEnvironment[currentPlayer].rotationIndex < 0) {
                    playerLevelEnvironment[currentPlayer].rotationIndex = numberOfRotations - 1;
                }
            }
            if (direction === 'rotateRight') {
                playerLevelEnvironment[currentPlayer].rotationIndex++;
                if (playerLevelEnvironment[currentPlayer].rotationIndex === numberOfRotations) {
                    playerLevelEnvironment[currentPlayer].rotationIndex = 0;
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

        const numberOfRows = currentCalculationArea[currentPlayer].length;
        const numberOfColumns = currentCalculationArea[currentPlayer][0].length;
        for (y = 0; y < numberOfRows; y++) {
            for (x = 0; x < numberOfColumns; x++) {
                tempCalculationArea[currentPlayer][y][x] = currentCalculationArea[currentPlayer][y][x];
            }
        }

        // remove current falling block from tempCalculationArea

        const blockMapNumberOfRows = Object.keys(blockMap[playerLevelEnvironment[currentPlayer].blockIndex][playerLevelEnvironment[currentPlayer].rotationIndex][playerLevelEnvironment[currentPlayer].rotationIndex]).length;
        const blockMapNumberOfColumns = Object.keys(blockMap[playerLevelEnvironment[currentPlayer].blockIndex][playerLevelEnvironment[currentPlayer].rotationIndex][playerLevelEnvironment[currentPlayer].rotationIndex][0]).length;
        let isRectangleFilled;
        for (y = 0; y < blockMapNumberOfRows; y++) {
            for (x = 0; x < blockMapNumberOfColumns; x++) {
                isRectangleFilled = blockMap[playerLevelEnvironment[currentPlayer].blockIndex][playerLevelEnvironment[currentPlayer].rotationIndex][playerLevelEnvironment[currentPlayer].rotationIndex][y][x];
                if (isRectangleFilled === 1) {
                    const yOnCalculationArea = Math.floor(playerLevelEnvironment[currentPlayer].yPlayArea / gameLevelEnvironment.pixelSize) + y;
                    const xOnCalculationArea = Math.floor(playerLevelEnvironment[currentPlayer].xPlayArea / gameLevelEnvironment.pixelSize) + x;
                    tempCalculationArea[currentPlayer][yOnCalculationArea][xOnCalculationArea] = 0;
                }
            }
        }

        drawAllBlocksToPlayArea(ctx, playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea);

        // draw a the shadow of the moving block

        drawShadow();

        // draw pixel perfect moving block

        const xModifierInSquares = playerLevelEnvironment[currentPlayer].xPlayArea / gameLevelEnvironment.pixelSize;
        const yModifierInSquares = playerLevelEnvironment[currentPlayer].yPlayArea / gameLevelEnvironment.pixelSize;
        const yModifierInPixels = 0;
        const blockToDrawIndex = playerLevelEnvironment[currentPlayer].blockIndex;
        const blockToDrawRotation = playerLevelEnvironment[currentPlayer].rotationIndex;
        const drawEmptyLines = true;
        const blockMapToDraw = blockMap[blockToDrawIndex][blockToDrawRotation][blockToDrawRotation];
        const blockToDrawColor = colorRelated.getBlockColor(blockToDrawIndex);
        drawBlock.drawBlock(ctx, blockMapToDraw, blockToDrawColor, xModifierInSquares, yModifierInSquares, yModifierInPixels, drawEmptyLines, playerLevelEnvironment[currentPlayer].playAreaMode, playerLevelEnvironment[currentPlayer].fullLines, playerLevelEnvironment[currentPlayer].gameEndFadeAnimationCounter, gameLevelEnvironment.gameEndFadeAnimationLength, playerLevelEnvironment[currentPlayer].fullLineFadeAnimationCounter, gameLevelEnvironment.fullLineFadeAnimationLength);

    }


    // this function clears and draws all blocks one by one to the playArea

    function drawAllBlocksToPlayArea(ctx, blockList) {

        // go thru the blocks one by one in blockList
        for (let i = 0; i < blockList.length; i++) {

            // draw the block
            const xModifierInSquares = blockList[i].blockX;
            const yModifierInSquares = blockList[i].blockY + 1;
            const yModifierInPixels = 0;
            const drawEmptyLines = true;
            const blockMapToDraw = blockList[i].blockMap;
            const blockToDrawColor = colorRelated.getBlockColor(blockList[i].blockIndex);
            drawBlock.drawBlock(ctx, blockMapToDraw, blockToDrawColor, xModifierInSquares, yModifierInSquares, yModifierInPixels, drawEmptyLines, playerLevelEnvironment[currentPlayer].playAreaMode, playerLevelEnvironment[currentPlayer].fullLines, playerLevelEnvironment[currentPlayer].gameEndFadeAnimationCounter, gameLevelEnvironment.gameEndFadeAnimationLength, playerLevelEnvironment[currentPlayer].fullLineFadeAnimationCounter, gameLevelEnvironment.fullLineFadeAnimationLength);

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
        drawAllBlocksToPlayArea(ctx, playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea);

    }


    // this function draws another players playArea

    function drawSecondPlayerArea(listOfBlocksInThePlayingArea) {

        // get the canvas
        const c = document.getElementById("playAreaCanvas[1]");
        const ctx = c.getContext("2d");

        // clear the canvas
        ctx.clearRect(0, 0, c.width, c.height);

        if (listOfBlocksInThePlayingArea.length > 0) {
            drawAllBlocksToPlayArea(ctx, listOfBlocksInThePlayingArea);
        }

    }


    // this function checks if we have full lines in the calculationArea and removes them

    function checkFullLineInCurrentCalculationArea(){

        playerLevelEnvironment[currentPlayer].fullLines = [];
        let fullLineFound = false;

        const numberOfRows = currentCalculationArea[currentPlayer].length;
        const numberOfColumns = currentCalculationArea[currentPlayer][0].length;

        // let's check all rows for full lines
        let numberOfFilledRectanglesInRow;
        let isRectangleFilled;
        for (let i = 0; i < numberOfRows; i++) {
            numberOfFilledRectanglesInRow = 0;
            for (let j = 0; j < numberOfColumns; j++) {
                isRectangleFilled = currentCalculationArea[currentPlayer][i][j];
                if (isRectangleFilled > 0) {
                    numberOfFilledRectanglesInRow++;
                }
            }
            if (numberOfFilledRectanglesInRow === numberOfColumns) {
                // we've found a full line in row i
                fullLineFound = true;
                playerLevelEnvironment[currentPlayer].fullLines.push(i);
                // send the previous state of this line to the other players
                const fuzzyLine = previousCalculationArea[currentPlayer][i];
                sendGameEvent('clearedLine', fuzzyLine);
            }
        }
        if (fullLineFound === true) {
            playerLevelEnvironment[currentPlayer].playAreaMode = 'fullLineRemoveAnimation';
            let numberOfNewLinesCleared = playerLevelEnvironment[currentPlayer].fullLines.length;
            let numberOfLinesCleared = statRelated.increaseNumberOfLinesCleared(numberOfNewLinesCleared);
            let pointsReceived = statRelated.calculatePointsReceived(numberOfNewLinesCleared, playerLevelEnvironment[currentPlayer].gameLevel);
            playerLevelEnvironment[currentPlayer].points += pointsReceived;

            chat.sayPointsReceived(pointsReceived, numberOfNewLinesCleared);

            // there is no level increase in multiplayer
            if (!multiplayer) {
                if (
                    Math.round(numberOfLinesCleared / gameLevelEnvironment.numberOfLinesNeedsToBeClearedToIncreaseGameSpeed) !==
                    Math.round((numberOfLinesCleared-numberOfNewLinesCleared) / gameLevelEnvironment.numberOfLinesNeedsToBeClearedToIncreaseGameSpeed)
                ) {
                    playerLevelEnvironment[currentPlayer].gameLevel++;
                    playerLevelEnvironment[currentPlayer].fallingSpeed = playerLevelEnvironment[currentPlayer].fallingSpeed + 0.5;
                    chat.sayLevelIncreased(playerLevelEnvironment[currentPlayer].gameLevel);
                }
            }
        }
    }


    // this function animates the full lines, until they are non-visible

    function animateFullLines() {

        playerLevelEnvironment[currentPlayer].fullLineFadeAnimationCounter--;

        if (playerLevelEnvironment[currentPlayer].fullLineFadeAnimationCounter === 0) {
            playerLevelEnvironment[currentPlayer].fullLineFadeAnimationCounter = gameLevelEnvironment.fullLineFadeAnimationLength;
            return true;
        } else {
            return false;
        }
    }


    // this function removes the full lines

    function hideFullLines(fullLines) {

        const numberOfColumns = currentCalculationArea[currentPlayer][0].length;

        let fullLine;
        for (let p = 0; p < fullLines.length; p++) {

            let l;
            fullLine = fullLines[p];

            // remove it
            for (l = 0; l < numberOfColumns; l++) {
                currentCalculationArea[currentPlayer][fullLine][l] = 0;
                currentCalculationArea[currentPlayer][0][l] = 0;
            }
            // move everything above the line 1 row down
            for (let k = fullLine; k > 0; k--) {
                for (l = 0; l < numberOfColumns; l++) {
                    currentCalculationArea[currentPlayer][k][l] = currentCalculationArea[currentPlayer][k - 1][l];
                }
            }

            // modify playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea because of full line
            modifyListOfBlocksInThePlayingAreaBecauseOfFullLine(fullLine);
        }

        playerLevelEnvironment[currentPlayer].playAreaMode = 'gravityAnimation';

    }


    // this function draws a shadow of the block

    function drawShadow() {

        // let's try to move the block downwards and look for overlap

        const numberOfRows = currentCalculationArea[currentPlayer].length;
        let shadowCanBeMoved;
        let yModifier = 0;
        let isRectangleFilled;
        do {
            shadowCanBeMoved = true;
            const blockMapNumberOfRows = Object.keys(blockMap[playerLevelEnvironment[currentPlayer].blockIndex][playerLevelEnvironment[currentPlayer].rotationIndex][playerLevelEnvironment[currentPlayer].rotationIndex]).length;
            const blockMapNumberOfColumns = Object.keys(blockMap[playerLevelEnvironment[currentPlayer].blockIndex][playerLevelEnvironment[currentPlayer].rotationIndex][playerLevelEnvironment[currentPlayer].rotationIndex][0]).length;
            for (let y = 0; y < blockMapNumberOfRows; y++) {
                for (let x = 0; x < blockMapNumberOfColumns; x++) {
                    isRectangleFilled = blockMap[playerLevelEnvironment[currentPlayer].blockIndex][playerLevelEnvironment[currentPlayer].rotationIndex][playerLevelEnvironment[currentPlayer].rotationIndex][y][x];
                    if (isRectangleFilled === 1) {
                        const yOnCalculationArea = Math.floor(playerLevelEnvironment[currentPlayer].yPlayArea / gameLevelEnvironment.pixelSize) + y + yModifier;
                        const xOnCalculationArea = Math.floor(playerLevelEnvironment[currentPlayer].xPlayArea / gameLevelEnvironment.pixelSize) + x;
                        if (yOnCalculationArea > (numberOfRows - 2)) {
                            shadowCanBeMoved = false;
                        }
                        if (tempCalculationArea[currentPlayer][yOnCalculationArea][xOnCalculationArea] !== 0) {
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

        const xModifierInSquares = Math.floor(playerLevelEnvironment[currentPlayer].xPlayArea / gameLevelEnvironment.pixelSize);
        const yModifierInSquares = Math.floor(playerLevelEnvironment[currentPlayer].yPlayArea / gameLevelEnvironment.pixelSize) + yModifier - 1;
        const yModifierInPixels = 0;
        const blockToDrawIndex = playerLevelEnvironment[currentPlayer].blockIndex;
        const blockToDrawRotation = playerLevelEnvironment[currentPlayer].rotationIndex;
        const drawEmptyLines = true;
        const blockMapToDraw = blockMap[blockToDrawIndex][blockToDrawRotation][blockToDrawRotation];
        const blockToDrawColor = colorRelated.getBlockColor('shadow');
        drawBlock.drawBlock(ctx, blockMapToDraw, blockToDrawColor, xModifierInSquares, yModifierInSquares, yModifierInPixels, drawEmptyLines, playerLevelEnvironment[currentPlayer].playAreaMode, playerLevelEnvironment[currentPlayer].fullLines, playerLevelEnvironment[currentPlayer].gameEndFadeAnimationCounter, gameLevelEnvironment.gameEndFadeAnimationLength, playerLevelEnvironment[currentPlayer].fullLineFadeAnimationCounter, gameLevelEnvironment.fullLineFadeAnimationLength);

    }


    // this function draws the next blocks to the nextBlocksAreaCanvas

    function drawNextBlocksArea() {

        // let's draw the block
        const c = document.getElementById("nextBlocksAreaCanvas[0]");
        const ctx = c.getContext("2d");
        ctx.clearRect(0, 0, c.width, c.height);

        for (let i = 0; i < gameLevelEnvironment.numberOfBlocksDisplayedInTheNextBlocksArea; i++) {
            const allBlockPointer = (playerLevelEnvironment[currentPlayer].blockCounter + i + 1) % gameLevelEnvironment.numberOfBlocksInAllBlocks;
            const blockToDrawIndex = gameLevelEnvironment.allBlocks[allBlockPointer];
            const blockToDrawRotation = 0;
            const xModifierInSquares = ((gameLevelEnvironment.numberOfBlocksDisplayedInTheNextBlocksArea - 1) * 5) - (i * 5);
            const yModifierInSquares = 0;
            const yModifierInPixels = 0;
            const drawEmptyLines = false;
            const blockMapToDraw = blockMap[blockToDrawIndex][blockToDrawRotation][blockToDrawRotation];
            const blockToDrawColor = colorRelated.getBlockColor(blockToDrawIndex);
            drawBlock.drawBlock(ctx, blockMapToDraw, blockToDrawColor, xModifierInSquares, yModifierInSquares, yModifierInPixels, drawEmptyLines, playerLevelEnvironment[currentPlayer].playAreaMode, playerLevelEnvironment[currentPlayer].fullLines, playerLevelEnvironment[currentPlayer].gameEndFadeAnimationCounter, gameLevelEnvironment.gameEndFadeAnimationLength, playerLevelEnvironment[currentPlayer].fullLineFadeAnimationCounter, gameLevelEnvironment.fullLineFadeAnimationLength);
        }
    }


    // this function saves the block that has completed its journey to playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea

    function saveDoneBlock() {

        let blockAlreadyInserted = false;
        for (let i = 0; i < playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea.length; i++) {
            if (playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea[i].blockCounter === playerLevelEnvironment[currentPlayer].blockCounter) {
                blockAlreadyInserted = true;
            }
        }

        if (blockAlreadyInserted === false) {
            try {
                playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea.push({
                    blockMap: blockMap[playerLevelEnvironment[currentPlayer].blockIndex][playerLevelEnvironment[currentPlayer].rotationIndex][playerLevelEnvironment[currentPlayer].rotationIndex],
                    blockIndex: playerLevelEnvironment[currentPlayer].blockIndex,
                    blockX: Math.floor(playerLevelEnvironment[currentPlayer].xPlayArea / gameLevelEnvironment.pixelSize),
                    blockY: Math.floor(playerLevelEnvironment[currentPlayer].yPlayArea / gameLevelEnvironment.pixelSize) - 1,
                    blockCounter: playerLevelEnvironment[currentPlayer].blockCounter,
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
        const numberOfRows = currentGravityCalculationArea[currentPlayer].length;
        const numberOfColumns = currentGravityCalculationArea[currentPlayer][0].length;
        for (y = 0; y < numberOfRows; y++) {
            for (x = 0; x < numberOfColumns; x++) {
                currentGravityCalculationArea[currentPlayer][y][x] = 0;
            }
        }

        // go thru the blocks one by one in playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea
        let isRectangleFilled;
        for (let i = 0; i < playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea.length; i++) {
            const blockMapNumberOfRows = Object.keys(playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea[i].blockMap).length;
            const blockMapNumberOfColumns = Object.keys(playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea[i].blockMap[0]).length;
            for (y = 0; y < blockMapNumberOfRows; y++) {
                for (x = 0; x < blockMapNumberOfColumns; x++) {
                    isRectangleFilled = playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea[i].blockMap[y][x];
                    if (isRectangleFilled === 1) {
                        // copy the map of the block to currentGravityCalculationArea
                        const yOnGravityCalculationArea = playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea[i].blockY + y;
                        const xOnGravityCalculationArea = playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea[i].blockX + x;
                        let colorOnGravityCalculationArea = playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea[i].blockIndex + 1;
                        currentGravityCalculationArea[currentPlayer][yOnGravityCalculationArea][xOnGravityCalculationArea] = colorOnGravityCalculationArea;
                    }
                }
            }
        }
    }


    // this function modifies blocks in the playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea in case there was a full line

    function modifyListOfBlocksInThePlayingAreaBecauseOfFullLine(fullLineIndex) {

        let newBlockMap;
        let x;
        let y;

        // go thru the blocks one by one in playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea
        // (we iterate backwards, so when we remove an item reindexing the array will not break the loop)
        let blockIsAffected;
        let isRectangleFilled;
        let lineAffected;
        let thereWerePixelsAboveTheCut;
        let thereWerePixelsUnderTheCut;
        for (let i = playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea.length - 1; i >= 0; i--) {
            blockIsAffected = false;
            playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea[i].wasChecked = true;
            const blockMapNumberOfRows = Object.keys(playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea[i].blockMap).length;
            const blockMapNumberOfColumns = Object.keys(playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea[i].blockMap[0]).length;
            for (y = 0; y < blockMapNumberOfRows; y++) {
                for (x = 0; x < blockMapNumberOfColumns; x++) {
                    isRectangleFilled = playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea[i].blockMap[y][x];
                    if (isRectangleFilled === 1) {
                        if (fullLineIndex === (playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea[i].blockY + y)) {
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
                        isRectangleFilled = playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea[i].blockMap[y][x];
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
                    playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea.push({
                        blockMap: newBlockMap,
                        blockIndex: playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea[i].blockIndex,
                        blockX: playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea[i].blockX,
                        blockY: playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea[i].blockY,
                        blockCounter: playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea[i].blockCounter
                    });
                    for (y = 0; y < lineAffected; y++) {
                        for (x = 0; x < blockMapNumberOfColumns; x++) {
                            playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea[playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea.length - 1].blockMap[y][x] = playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea[i].blockMap[y][x];
                        }
                    }
                }
                thereWerePixelsUnderTheCut = false;
                for (y = lineAffected + 1; y < blockMapNumberOfRows; y++) {
                    for (x = 0; x < blockMapNumberOfColumns; x++) {
                        isRectangleFilled = playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea[i].blockMap[y][x];
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
                    playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea.push({
                        blockMap: newBlockMap,
                        blockIndex: playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea[i].blockIndex,
                        blockX: playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea[i].blockX,
                        blockY: playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea[i].blockY + lineAffected + 1,
                        blockCounter: playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea[i].blockCounter
                    });
                    for (y = lineAffected + 1; y < blockMapNumberOfRows; y++) {
                        for (x = 0; x < blockMapNumberOfColumns; x++) {
                            playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea[playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea.length - 1].blockMap[y - (lineAffected + 1)][x] = playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea[i].blockMap[y][x];
                        }
                    }
                }
                // remove the old item from the list
                playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea.splice(i, 1);
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
        playerLevelEnvironment[currentPlayer].listOfBlocksThatCanBeMoved = [];

        // let's iterate thru all the blocks we have in playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea
        let isRectangleFilled;
        for (let i = 0; i < playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea.length; i++) {

            // clear currentGravityCalculationArea
            let numberOfRows = currentGravityCalculationArea[currentPlayer].length;
            let numberOfColumns = currentGravityCalculationArea[currentPlayer][0].length;
            for (y = 0; y < numberOfRows; y++) {
                for (x = 0; x < numberOfColumns; x++) {
                    currentGravityCalculationArea[currentPlayer][y][x] = 0;
                }
            }

            // calculate currentGravityCalculationArea, without the current block

            // go thru the blocks one by one in playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea
            // draw every block except the one we calculate now
            for (let k = 0; k < playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea.length; k++) {
                if (k !== i) {
                    blockMapNumberOfRows = Object.keys(playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea[k].blockMap).length;
                    blockMapNumberOfColumns = Object.keys(playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea[k].blockMap[0]).length;
                    for (y = 0; y < blockMapNumberOfRows; y++) {
                        for (x = 0; x < blockMapNumberOfColumns; x++) {
                            isRectangleFilled = playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea[k].blockMap[y][x];
                            if (isRectangleFilled === 1) {
                                const yOnGravityCalculationArea = playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea[k].blockY + y;
                                const xOnGravityCalculationArea = playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea[k].blockX + x;
                                const colorOnGravityCalculationArea = playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea[k].blockIndex + 1;
                                currentGravityCalculationArea[currentPlayer][yOnGravityCalculationArea][xOnGravityCalculationArea] = colorOnGravityCalculationArea;
                            }
                        }
                    }
                }
            }

            // let's try to move the block downwards and look for overlap

            numberOfRows = currentGravityCalculationArea[currentPlayer].length;
            numberOfColumns = currentGravityCalculationArea[currentPlayer][0].length;
            for (y = 0; y < numberOfRows; y++) {
                let line = '';
                for (x = 0; x < numberOfColumns; x++) {
                    line = line + currentGravityCalculationArea[currentPlayer][y][x];
                }
            }

            let blockCanBeMoved = true;
            const yModifier = 0;
            numberOfRows = currentGravityCalculationArea[currentPlayer].length;
            blockMapNumberOfRows = Object.keys(playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea[i].blockMap).length;
            blockMapNumberOfColumns = Object.keys(playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea[i].blockMap[0]).length;

            for (y = 0; y < blockMapNumberOfRows; y++) {
                for (x = 0; x < blockMapNumberOfColumns; x++) {
                    isRectangleFilled = playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea[i].blockMap[y][x];
                    if (isRectangleFilled === 1) {
                        const yOnCalculationArea = playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea[i].blockY + y + yModifier + 1;
                        const xOnCalculationArea = playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea[i].blockX + x;
                        if (yOnCalculationArea > (numberOfRows - 2)) {
                            // block reached the bottom
                            blockCanBeMoved = false;
                            break;
                        }
                        if (currentGravityCalculationArea[currentPlayer][yOnCalculationArea][xOnCalculationArea] !== 0) {
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
                playerLevelEnvironment[currentPlayer].listOfBlocksThatCanBeMoved.push(i);
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
        const numberOfRows = currentGravityCalculationArea[currentPlayer].length;
        const numberOfColumns = currentGravityCalculationArea[currentPlayer][0].length;
        for (let y = 0; y < numberOfRows; y++) {
            for (let x = 0; x < numberOfColumns; x++) {
                currentCalculationArea[currentPlayer][y][x] = currentGravityCalculationArea[currentPlayer][y][x];
            }
        }
    }

    // this function copies the currentCalculationArea to previousCalculationArea
    function copyCurrentCalculationAreaToPreviousCalculationArea() {
        const numberOfRows = currentCalculationArea[currentPlayer].length;
        const numberOfColumns = currentCalculationArea[currentPlayer][0].length;
        for (let y = 0; y < numberOfRows; y++) {
            for (let x = 0; x < numberOfColumns; x++) {
                previousCalculationArea[currentPlayer][y][x] = currentCalculationArea[currentPlayer][y][x];
            }
        }
    }


    // this function draws the currentGravityCalculationField with falling blocks

    function drawPlayAreaWithFallingBlocks() {

        // clear the canvas
        const c = document.getElementById("playAreaCanvas[0]");
        const ctx = c.getContext("2d");
        ctx.clearRect(0, 0, c.width, c.height);

        // go thru the blocks one by one in playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea
        let yModifierInPixels;
        for (let i = 0; i < playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea.length; i++) {

            const xModifierInSquares = playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea[i].blockX;
            const yModifierInSquares = playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea[i].blockY + 1;
            const drawEmptyLines = true;
            const blockMapToDraw = playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea[i].blockMap;
            const blockToDrawColor = colorRelated.getBlockColor(playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea[i].blockIndex);
            if (playerLevelEnvironment[currentPlayer].listOfBlocksThatCanBeMoved.includes(i)) {
                yModifierInPixels = playerLevelEnvironment[currentPlayer].gravityAnimationYModifier;
            } else {
                yModifierInPixels = 0;
            }
            drawBlock.drawBlock(ctx, blockMapToDraw, blockToDrawColor, xModifierInSquares, yModifierInSquares, yModifierInPixels, drawEmptyLines, playerLevelEnvironment[currentPlayer].playAreaMode, playerLevelEnvironment[currentPlayer].fullLines, playerLevelEnvironment[currentPlayer].gameEndFadeAnimationCounter, gameLevelEnvironment.gameEndFadeAnimationLength, playerLevelEnvironment[currentPlayer].fullLineFadeAnimationCounter, gameLevelEnvironment.fullLineFadeAnimationLength);
        }
    }


    // this function does the "blockFallingAnimation" routine

    function blockFallingRoutine() {

        // check if we have full lines, if we have them, remove them
        checkFullLineInCurrentCalculationArea();

        // if we need to set a new block, save the old one and set a new one
        if (playerLevelEnvironment[currentPlayer].selectANewBlockNextFrame === true) {

            // save old one
            saveDoneBlock();

            // select a new one
            blockGenerator.selectANewBlock();
            playerLevelEnvironment[currentPlayer].selectANewBlockNextFrame = false;
        }

        // save current state, so we could use it when we need the pattern of the cleared lines
        copyCurrentCalculationAreaToPreviousCalculationArea();

        // let's move the current block down

        // y previously in the calculationArea
        let previousYCalculationArea = Math.floor(playerLevelEnvironment[currentPlayer].yPlayArea / gameLevelEnvironment.pixelSize);
        // y in the playArea
        playerLevelEnvironment[currentPlayer].yPlayArea = playerLevelEnvironment[currentPlayer].yPlayArea + playerLevelEnvironment[currentPlayer].fallingSpeed;
        // y now in the calculationArea
        let currentYCalculationArea = Math.floor(playerLevelEnvironment[currentPlayer].yPlayArea / gameLevelEnvironment.pixelSize);
        // do we need to move down the block in the calculationArea
        if (previousYCalculationArea !== currentYCalculationArea) {
            // yes, try to do the move in calculationArea
            moveBlockInCalculationArea('moveDown');
        } else {
            // no, just recalculate calculationArea
            moveBlockInCalculationArea('');
        }

        // if the current block will be replaced next frame, don't draw the playArea
        if (playerLevelEnvironment[currentPlayer].selectANewBlockNextFrame === false) {
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
            hideFullLines(playerLevelEnvironment[currentPlayer].fullLines);

            // check if any block can fall down
            const isThereABlockThatCanBeMoved = checkIfAnyBlockCanFallDown();
            if (isThereABlockThatCanBeMoved === true) {
                playerLevelEnvironment[currentPlayer].playAreaMode = 'gravityAnimation';
            } else {
                playerLevelEnvironment[currentPlayer].playAreaMode = 'blockFallingAnimation';
            }
        }
    }


    // this function does the "gravityAnimation" routine

    function gravityAnimationRoutine() {

        playerLevelEnvironment[currentPlayer].gravityAnimationYModifier = playerLevelEnvironment[currentPlayer].gravityAnimationYModifier + gameLevelEnvironment.gravityAnimationFallingSpeed;
        if (playerLevelEnvironment[currentPlayer].gravityAnimationYModifier < gameLevelEnvironment.pixelSize) {
            drawPlayAreaWithFallingBlocks();
        } else {
            for (let i = 0; i < playerLevelEnvironment[currentPlayer].listOfBlocksThatCanBeMoved.length; i++) {
                playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea[playerLevelEnvironment[currentPlayer].listOfBlocksThatCanBeMoved[i]].blockY++;
            }
            calculateCurrentGravityCalculationArea();
            copyCurrentGravityCalculationAreaToCurrentCalculationArea();

            playerLevelEnvironment[currentPlayer].gravityAnimationYModifier = 0;

            const isThereABlockThatCanBeMoved = checkIfAnyBlockCanFallDown();
            if (isThereABlockThatCanBeMoved === true) {
                playerLevelEnvironment[currentPlayer].playAreaMode = 'gravityAnimation';
            } else {
                playerLevelEnvironment[currentPlayer].playAreaMode = 'blockFallingAnimation';
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
        playerLevelEnvironment[currentPlayer].gameEndFadeAnimationCounter--;

        // check if everything has faded out properly
        if (playerLevelEnvironment[currentPlayer].gameEndFadeAnimationCounter === 20) {

            playerLevelEnvironment[currentPlayer].gameEndFadeAnimationCounter = gameLevelEnvironment.gameEndFadeAnimationLength;

            statRelated.displayGameEndStats(playerLevelEnvironment[currentPlayer].blockCounter);

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


    // this function does the gameStartingCountDownAnimation Routine

    function gameStartingCountDownAnimationRoutine() {

        // no keyboard input
        document.onkeydown = null;

        // decrease framecounter
        playerLevelEnvironment[currentPlayer].gameStartingCountDownFrameCounter--;

        if (playerLevelEnvironment[currentPlayer].gameStartingCountDownFrameCounter === 0) {

            // reset framecounter
            playerLevelEnvironment[currentPlayer].gameStartingCountDownFrameCounter = gameLevelEnvironment.gameStartingCountDownFrameCounterInitialValue;

            // decrease counter
            playerLevelEnvironment[currentPlayer].gameStartingCountDownCounter--;

            if (playerLevelEnvironment[currentPlayer].gameStartingCountDownCounter === 0) {
                // reset counter
                playerLevelEnvironment[currentPlayer].gameStartingCountDownCounter = gameLevelEnvironment.gameStartingCountDownCounterInitialValue;
                // start game
                playerLevelEnvironment[currentPlayer].playAreaMode = 'blockFallingAnimation';
                // say game started
                chat.sayGameStarted(playerLevelEnvironment[currentPlayer].gameStartingCountDownCounter);
                // restore keyboard watcher
                document.onkeydown = checkKeyboardInput;
            } else {
                chat.sayGameStartsInSeconds(playerLevelEnvironment[currentPlayer].gameStartingCountDownCounter);
            }

        }
    }


    // this function adds fuzzy lines from the opponents to the bottom of the playing area
    // FIXME

    function addFuzzyLinesToBottomOfThePlayingArea(fuzzyLines) {

        const numberOfRows = currentCalculationArea[currentPlayer].length;

        for (let q = 0; q < fuzzyLines.length; q++) {

            // move all blocks upwards
            for (let k = 0; k < playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea.length; k++) {
                playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea[k].blockY--;
            }

            let fuzzyLine = fuzzyLines[q];
            for (let p = 0; p < fuzzyLine.length; p++) {
                if (fuzzyLine[p] !== 0) {
                    fuzzyLine[p] = 1;
                }
            }

            playerLevelEnvironment[currentPlayer].blockCounter++;

            playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea.push({
                blockMap: [fuzzyLine],
                blockIndex: 1,
                blockX: 0,
                blockY: numberOfRows - 2,
                blockCounter: playerLevelEnvironment[currentPlayer].blockCounter
            });

            console.log(playerLevelEnvironment[currentPlayer].listOfBlocksInThePlayingArea);
            calculateCurrentGravityCalculationArea();
            copyCurrentGravityCalculationAreaToCurrentCalculationArea();
        }


        playerLevelEnvironment[currentPlayer].fuzzyLinesPuffer = [];
    }


    // this function does the processFuzzyLines Routine

    function processFuzzyLinesRoutine() {
        console.log("processFuzzyLines");

        addFuzzyLinesToBottomOfThePlayingArea(playerLevelEnvironment[currentPlayer].fuzzyLinesPuffer);

        playerLevelEnvironment[currentPlayer].playAreaMode = 'blockFallingAnimation';
    }


    // this is the game loop, it runs every frame

    function gameLoop() {

        if (replayingAGame) {
            checkPlayerInputFromRecording();
        }

        switch (playerLevelEnvironment[currentPlayer].playAreaMode) {
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
            case 'waitingForSomeoneToStartTheGame':
                // do nothing
                break;
            case 'gameStartingCountDownAnimation':
                gameStartingCountDownAnimationRoutine();
                break;
            case 'processFuzzyLines':
                processFuzzyLinesRoutine();
        }

        // increase playerLevelEnvironment[currentPlayer].frameNumber
        playerLevelEnvironment[currentPlayer].frameNumber++;

        // send an update to the server every x frames
        if(playerLevelEnvironment[currentPlayer].frameNumber % gameLevelEnvironment.frequencyOfServerUpdatesInFrames == 0) {
            sendGameEvent('update');
        }

        // let's restart the game loop in the next frame
        if (!gameLevelEnvironment.stopTheGameLoop) {
            requestAnimationFrame(gameLoop);
        }

    }


// we start everything here

// the checkKeyboardInput() function will take care of the keyboard interactions
document.onkeydown = checkKeyboardInput;

// let's generate the first 3 blocks
playerLevelEnvironment[currentPlayer].blockIndex = blockGenerator.selectABlockRandomly();
playerLevelEnvironment[currentPlayer].nextBlocks.unshift(playerLevelEnvironment[currentPlayer].blockIndex);
playerLevelEnvironment[currentPlayer].blockIndex = blockGenerator.selectABlockRandomly();
playerLevelEnvironment[currentPlayer].nextBlocks.unshift(playerLevelEnvironment[currentPlayer].blockIndex);
playerLevelEnvironment[currentPlayer].blockIndex = blockGenerator.selectABlockRandomly();
playerLevelEnvironment[currentPlayer].nextBlocks.unshift(playerLevelEnvironment[currentPlayer].blockIndex);

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
    // announce in the chatbox that the game has inicialized
    chat.sayGameInicialized();
}

// set playerLevelEnvironment[currentPlayer].playAreaMode
playerLevelEnvironment[currentPlayer].playAreaMode = 'waitingForSomeoneToStartTheGame';

// record game start time
statRelated.setGameStartTime();

// start the game loop
requestAnimationFrame(gameLoop);