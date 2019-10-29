const numberOfPlayers = 2;
let playerLevelEnvironment = [];
for (let i = 0; i < numberOfPlayers; i++) {
    playerLevelEnvironment[i] = require('./playerLevelEnvironment');
}
const currentPlayer = 0;

const gameStartText = "<span class=text-light>Game started! Good luck " + playerLevelEnvironment[currentPlayer].playerName + "!</span>";
const replayStartText = "<span class=text-light>Replay started!</span>";
const gameOverText = "<span class=text-light>Game over!</span>";
const replayOverText = "<span class=text-light>Replay over!</span>";
const newGameButton = '<a href="/game"><button type="button" class="btn btn-primary">New game</button></a>';
const restartReplayButton = '<button type="button" class="btn btn-primary" onclick="location.reload();">Replay</button></a>';
const goToLeaderBoardButton = '<a href="/leaderboard"><button type="button" class="btn btn-primary">Leaderboard</button></a>';
const separator = "&nbsp;";
const newLine = "<br/>";

// this function adds commas to a number at every thousand

function numberWithCommas(x) {
    const parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}


// this function announces, that the game has started

function sayGameStarted() {
    saySomething(gameStartText);
}


// this function announces, that a replay has started

function sayReplayStarted() {
    saySomething(replayStartText);
}


// this function announces, that the game has ended,
// and displays the restart / home buttons

function sayGameOver() {
    saySomething(newLine + gameOverText);
    saySomething(newLine + newGameButton + separator + goToLeaderBoardButton);
}


// this function announces, that the replay has ended,
// and displays the restart / home buttons

function sayReplayOver() {
    saySomething(newLine + replayOverText);
    saySomething(newLine + restartReplayButton + separator + newGameButton + separator + goToLeaderBoardButton);
}


// this function announces that the game level and speed has been increased

function sayLevelIncreased(gameLevel) {
    saySomething("<span class=text-light>Level#" + gameLevel + "</span> reached, speed increased!");
}


// this function announces that there were points received

function sayPointsReceived(pointsReceived, numberOfNewLinesCleared) {
    if (numberOfNewLinesCleared === 1) {
        saySomething("<span class=text-light>+" + numberWithCommas(pointsReceived) + " points</span> (1 line cleared on level#" + playerLevelEnvironment[currentPlayer].gameLevel + ", " + numberWithCommas(playerLevelEnvironment[currentPlayer].points) + " points overall)");
    } else {
        saySomething("<span class=text-light>+" + numberWithCommas(pointsReceived) + " points</span> (" + numberOfNewLinesCleared + " lines cleared on level#" + playerLevelEnvironment[currentPlayer].gameLevel + ", " + numberWithCommas(playerLevelEnvironment[currentPlayer].points) + " points overall)");
    }
}


// this function displays the game end stats

function sayGameEndStats(numberOfLinesCleared, gameTimeInSeconds, numberOfBlocks, blocksPerMinute) {
    saySomething("<br/><span class=text-light>Game end stats:</span>");
    if (numberOfLinesCleared === 1) {
        saySomething("- <span class=text-light>1 line</span> cleared.");
    } else {
        saySomething("- <span class=text-light>" + numberOfLinesCleared + " lines</span> cleared.");
    }
    saySomething("- <span class=text-light>" + Math.round(gameTimeInSeconds) + " seconds</span> game time.");
    saySomething("- <span class=text-light>" + numberOfBlocks + " blocks</span> served.");
    saySomething("- <span class=text-light>" + blocksPerMinute + " blocks/minute</span> player speed.");
    saySomething("- <span class=text-light>" + numberWithCommas(playerLevelEnvironment[currentPlayer].points) + " points</span> reached.");
    saySomething("- <span class=text-light>Level#" + playerLevelEnvironment[currentPlayer].gameLevel + "</span> reached.")
}


// this function extends the chat-area div with the texts

function saySomething(something) {
    const theDiv = document.getElementById("chat-area");
    theDiv.innerHTML += something + "<br/>";
}


module.exports = {
    sayGameStarted,
    sayReplayStarted,
    sayGameOver,
    sayReplayOver,
    sayLevelIncreased,
    sayPointsReceived,
    sayGameEndStats
};