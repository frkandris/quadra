const gameLevelEnvironment = require('./gameLevelEnvironment');

const numberOfPlayers = 2;
let playerLevelEnvironment = [];
for (let i = 0; i < numberOfPlayers; i++) {
    playerLevelEnvironment[i] = require('./playerLevelEnvironment');
}
const currentPlayer = 0;

const statRelated = require('./statRelated');
const blockMap = require('./blockMap');
const calculationAreaDefinitions = require('./calculationAreaDefinitions');


// this function returns the index of a randomly selected block

function selectABlockRandomly() {
    let numberOfBlocks = Object.keys(blockMap).length;
    return Math.floor(Math.random() * numberOfBlocks);
}


// this function sets the next new block
// (gets the new one from the playerLevelEnvironment[currentPlayer].nextBlocks,
// adds a new random block to playerLevelEnvironment[currentPlayer].nextBlocks,
// sets coordinates of the new block)

function selectANewBlock(){

    // get a random new block
    // const newBlock = selectABlockRandomly();
    const allBlocksPointer = (playerLevelEnvironment[currentPlayer].blockCounter + 1) % gameLevelEnvironment.numberOfBlocksInAllBlocks;
    const currentBlock = gameLevelEnvironment.allBlocks[allBlocksPointer];

    // add new item to the beginning of the array
    // playerLevelEnvironment[currentPlayer].nextBlocks.unshift(newBlock);

    // let currentBlock = playerLevelEnvironment[currentPlayer].nextBlocks.slice(-1).pop(); // get the last item
    // playerLevelEnvironment[currentPlayer].nextBlocks.splice(-1,1); // remove the last item

    // set the current block
    playerLevelEnvironment[currentPlayer].blockIndex = currentBlock;
    playerLevelEnvironment[currentPlayer].rotationIndex = 0;
    playerLevelEnvironment[currentPlayer].xPlayArea = (gameLevelEnvironment.playAreaWidth / 2) - (2 * gameLevelEnvironment.pixelSize);
    playerLevelEnvironment[currentPlayer].yPlayArea = 0;

    playerLevelEnvironment[currentPlayer].moveCanBeDone = checkIfBlockOverlapsAnythingOnACalculationArea();
    if (playerLevelEnvironment[currentPlayer].moveCanBeDone === false) {
        playerLevelEnvironment[currentPlayer].playAreaMode = 'gameEndFadeOutAnimation';
        statRelated.setGameEndTime();
    }

    playerLevelEnvironment[currentPlayer].blockCounter++;
}


// this function checks if a block overlaps anything on a calculation area

function checkIfBlockOverlapsAnythingOnACalculationArea() {

    let moveCanBeDone = true;

    const blockMapNumberOfRows = Object.keys(blockMap[playerLevelEnvironment[currentPlayer].blockIndex][playerLevelEnvironment[currentPlayer].rotationIndex][playerLevelEnvironment[currentPlayer].rotationIndex]).length;
    const blockMapNumberOfColumns = Object.keys(blockMap[playerLevelEnvironment[currentPlayer].blockIndex][playerLevelEnvironment[currentPlayer].rotationIndex][playerLevelEnvironment[currentPlayer].rotationIndex][0]).length;

    let isRectangleFilled;
    for (let y = 0; y < blockMapNumberOfRows; y++) {
        for (let x = 0; x < blockMapNumberOfColumns; x++) {
            isRectangleFilled = blockMap[playerLevelEnvironment[currentPlayer].blockIndex][playerLevelEnvironment[currentPlayer].rotationIndex][playerLevelEnvironment[currentPlayer].rotationIndex][y][x];
            if (isRectangleFilled === 1) {
                const yOnCalculationArea = Math.floor(playerLevelEnvironment[currentPlayer].yPlayArea / gameLevelEnvironment.pixelSize) + y;
                const xOnCalculationArea = Math.floor(playerLevelEnvironment[currentPlayer].xPlayArea / gameLevelEnvironment.pixelSize) + x;
                if (calculationAreaDefinitions.currentCalculationArea[yOnCalculationArea][xOnCalculationArea] !== 0) {
                    // move can not be done, as the block in the new position would overlap with something
                    moveCanBeDone = false;
                }
            }
        }
    }

    return moveCanBeDone;
}


// this function generates all blocks that we'll use during the game

function generateAllBlocks() {
    for (let i = 0; i < gameLevelEnvironment.numberOfBlocksInAllBlocks; i++) {
        let nextPiece = selectABlockRandomly();
        gameLevelEnvironment.allBlocks.push(nextPiece);
    }
}

module.exports = {
    selectANewBlock,
    selectABlockRandomly,
    generateAllBlocks
};