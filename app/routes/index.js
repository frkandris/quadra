const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Counter = require('../models/Counter.model');
const gameRecording = require('../models/GameRecording.model');
const nconf = require('nconf');

const dbURL = nconf.get('database:MONGODB_URL');
mongoose.connect(dbURL, {useNewUrlParser: true, useUnifiedTopology: true}).then(
    () => { /** ready to use */
    },
    err => {
        console.log(err); /** handle initial connection error */
    }
);

function numberWithCommas(x) {
    const parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}


/* GET welcome page. */
router.get('/', function (req, res) {
     res.render('index', {
         app_version: process.env.npm_package_version
     });
});


/* GET game page. */
router.get('/game', function (req, res) {
    increaseGamePlayedCounter();
    res.render('game');
});


/* GET multiplayergame page. */
router.get('/game/:roomId', function (req, res) {

    increaseGamePlayedCounter();

    const roomId = Number(req.params.roomId);
    res.render('game', {
        roomId: roomId
    });
});


/* Increase the linesCleared counter */
router.get('/increase-linesCleared-counter/:numberOfLinesCleared', function (req, res) {
    const numberOfLinesCleared = Number(req.params.numberOfLinesCleared);
    if (typeof numberOfLinesCleared != "number") {
        console.log('increase-linesCleared-counter | error | not a number received from the client');
    } else if (numberOfLinesCleared > 30) {
        console.log('increase-linesCleared-counter | error | number is greater than 30 received from the client');
    } else {
        Counter.findOneAndUpdate(
            {
                counterName: 'linesCleared'
            },
            {
                $inc: {
                    counterValue: numberOfLinesCleared
                }
            },
            {
                upsert: true,
                new: true
            },
            function (err, counter) {
                if (err) {
                    console.log('increase-linesCleared-counter | error | could not increase the counter', counter);
                    res.status(400).send('error increasing counter', err);
                } else {
                    console.log('increase-linesCleared-counter | log | counter increased by ' + numberOfLinesCleared);
                    res.sendStatus(200);
                }
            });
    }
});


/* Save a gameString to the DB based on client request, probably at the end of the game */
router.post('/save-game-status/', function (req, res) {

    let newGameRecording = new gameRecording();
    newGameRecording.gameString = req.body.gameString;
    newGameRecording.gameBlocks = req.body.gameBlocks;
    newGameRecording.playerName = req.body.playerName;
    newGameRecording.gameLevel = req.body.gameLevel;
    newGameRecording.points = req.body.points;
    newGameRecording.gameDate = new Date();

    // console.log(req.body.gameString);

    newGameRecording.save(function (err, gameRecording) {
        if (err) {
            console.log("problem", err);
            res.sendStatus(400);
        } else {
            console.log("game saved", gameRecording._id);
            res.sendStatus(200);
        }
    })
});


/* Replay a game. */
router.get('/replay-game/:id', function (req, res) {
    const id = req.params.id;

    gameRecording.findOne({
        _id: id
    }, function (err, gameRecording) {
        if (err) {
            console.log("problem", err);
            res.sendStatus(400);
        } else {
            res.render('game', {
                gameBlocks: gameRecording.gameBlocks,
                gameString: gameRecording.gameString,
            });
        }
    });
});


/* Leaderboard. */
router.get('/leaderboard/', function (req, res) {

    gameRecording.find().sort({points: -1}).limit(20).exec(function(err, games) {
        if (err) {
            console.log("problem", err);
            res.sendStatus(400);
        } else {
            for (let i = 0; i < games.length; i++) {
                games[i].index = i + 1;
                games[i].points_formatted = numberWithCommas(games[i].points);
            }
            res.render('leaderboard', {
                games: games
            });
        }
    });

});


/* GET about page. */
router.get('/about', function (req, res) {

    Promise.all([
        Counter.find({counterName: 'linesCleared'}),
        Counter.find({counterName: 'gamesPlayed'})
    ]).then(([linesCleared, gamesPlayed]) => {
        let numberOfGamesPlayed;
        let numberOfLinesCleared;
        if (linesCleared[0]) {
            numberOfLinesCleared = linesCleared[0].counterValue;
        } else {
            numberOfLinesCleared = 1;
        }
        if (gamesPlayed[0]) {
            numberOfGamesPlayed = gamesPlayed[0].counterValue;
        } else {
            numberOfGamesPlayed = 1;
        }
        res.render('about', {
            numberOfLinesCleared: numberWithCommas(numberOfLinesCleared),
            numberOfGamesPlayed: numberWithCommas(numberOfGamesPlayed),
            app_version: process.env.npm_package_version
        });
    });
});


function increaseGamePlayedCounter() {

    // increase gamesPlayed
    Counter.findOneAndUpdate(
        {
            counterName: 'gamesPlayed'
        },
        {
            $inc: {
                counterValue: 1
            }
        },
        {
            upsert: true,
            new: true
        },
        function (err, counter) {
            if (err) {
                console.log('game | error | could not increase gamesPlayed counter', counter);
            } else {
                // success
            }
        }
    );
}

module.exports = router;
