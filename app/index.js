/** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * MODULE: index.js
 * -----------------------------------------------------------------------------
 * This file is the starting point of the app.
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
/* -------------------------- Module requirements --------------------------- */
const nconf = require('nconf');
const moment = require('moment');
const siteConfig = require('./services/config');

/* --------------------------- JSDOC definitions ---------------------------- */
/* ---------------------------- Module functions ---------------------------- */
/* ------------------------------ Module body ------------------------------- */

/* Init NCONF, make sure that all of our configuration is ready */
siteConfig.initNconf().then(function() {
    console.log("APP | process.env.NODE_ENV is '" + process.env.NODE_ENV + "'");
    console.log("NCONF | env." + nconf.get('app:APP_ENVIRONMENT') + ".json configuration loaded.");
}).then(function() {

    /* Start app */
    const server = require('../app/server').listen(nconf.get('app:APP_PORT'), nconf.get('app:APP_HOST'), function () {
        if (process.env.NODE_ENV === "production") {
            console.log(moment().format('YYYY-MM-DD HH:mm:ss') + " | APP | " + nconf.get('app:APP_NAME') + " is running.");
        } else {
            console.log("APP | " + nconf.get('app:APP_NAME') + " is running on " + nconf.get('app:APP_URL'));
        }
    });
    io = require('socket.io').listen(server);
    io.on('connection', function(socket){
        socket.join('some-room');
        console.log('user connected');
        socket.on('disconnect', function(){
            console.log('user disconnected');
        });
        socket.on('clientEvent', function(clientEventValue, clientEventDetails, roomId, playerId, listOfBlocksInThePlayingArea){
            console.log('clientEvent', clientEventValue, clientEventDetails, roomId, playerId);
            io.to('some-room').emit('serverEvent', clientEventValue, clientEventDetails, roomId, playerId, listOfBlocksInThePlayingArea);
        });
    });
}).catch(function(reason) {
    console.log("APP | FATAL: Error during app loading.", {detailedMessage: reason.stack.substring(0, 512)});
    console.log(moment().format('YYYY-MM-DD HH:mm:ss') + ' | APP | FATAL: Error during app loading.');
});



/* ----------------------------- Module exports ----------------------------- */
