const gameLevelEnvironment = require('./gameLevelEnvironment');

const numberOfPlayers = 2;
let playerLevelEnvironment = [];
for (let i = 0; i < numberOfPlayers; i++) {
    playerLevelEnvironment[i] = require('./playerLevelEnvironment');
}
const currentPlayer = 0;

const axios = require('axios');


function saveGameEvent(frameNumber, eventName, eventValue) {
    playerLevelEnvironment[currentPlayer].logOfEvents.push({
        frameNumber: frameNumber,
        eventName: eventName,
        eventValue: eventValue
    });
    // console.log(frameNumber, eventName, eventValue)
}

function saveGameToServer() {

    const params = {
        gameBlocks: gameLevelEnvironment.allBlocks,
        gameString: playerLevelEnvironment[currentPlayer].logOfEvents,
        playerName: playerLevelEnvironment[currentPlayer].playerName,
        gameLevel: playerLevelEnvironment[currentPlayer].gameLevel,
        points: playerLevelEnvironment[currentPlayer].points
    };

    // ajax load URL and increase global linesCleared counter
    axios.post('/save-game-status/', params)
        .then(function (response) {
            // handle success
        })
        .catch(function (error) {
            // handle error
            console.log(error);
        })
        .finally(function () {
            // always executed
        });

}

module.exports = {
    saveGameEvent,
    saveGameToServer
};