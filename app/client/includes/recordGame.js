const gameLevelEnvironment = require('./gameLevelEnvironment');

const numberOfPlayers = 2;
let playerLevelEnvironment = [];
for (let i = 0; i < numberOfPlayers; i++) {
    playerLevelEnvironment[i] = require('./playerLevelEnvironment');
}

const axios = require('axios');


function saveGameEvent(frameNumber, eventName, eventValue) {
    playerLevelEnvironment[0].logOfEvents.push({
        frameNumber: frameNumber,
        eventName: eventName,
        eventValue: eventValue
    });
    // console.log(frameNumber, eventName, eventValue)
}

function saveGameToServer() {

    const params = {
        gameBlocks: gameLevelEnvironment.allBlocks,
        gameString: playerLevelEnvironment[0].logOfEvents,
        playerName: playerLevelEnvironment[0].playerName,
        gameLevel: playerLevelEnvironment[0].gameLevel,
        points: playerLevelEnvironment[0].points
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