/**
 * This file is the client file for the game. It holds a copy of the gameboard for online games, and makes a clientBoard object for local games.
 * It handles the keypresses, and reacts appropriately.
 *      If the games is local, all changes are made to the stored board.
 *      If it's an online game, then intended changes are sent to the server.
 * This file also constructs all the displayed HMTL when a new game board is available, and player sounds for movese made.
 * 
 * @summary This is the client file for the game.
 */
var localGame;      // Is this a local, or online game.
var gB;             // The gameBoard. A copy for online games, the real deal for local games.
var walkSound = document.createElement("audio");
walkSound.src = "./assets/sound/click.wav";         // The sound for walking from side to side by using 'a', and 'd'.
var kickSound = document.createElement("audio");
kickSound.src = "./assets/sound/kick.wav";          // The sound for kicking the ball down by using 's'.


var socket;         // For online games.

/** This sets up appropraite reactions for key presses depeneding on the game setup.
 */
document.addEventListener("keypress", function (event) {
    // This hides the game messages after each keypress. Ex: 'Red has no more moves.'
    $("#gameMessage").hide();
    // Catch for making sure the board exists.
    if (gB != null) {
        // For the A/a keys, move the character left.
        if (event.key == "A" || event.key == "a") {
            // If it's a localgame, the changes are made directly to the board. Otherwise inform the server of a wanted change.
            if (localGame) {
                // The character moves left.
                if (gB.moveLeft()) {
                    // Play the appropriate sound.
                    walkSound.play();
                    // Show the change.
                    printBoardObj(gB.copyBoard());
                }
            } else {
                walkSound.play();
                socket.emit("left", {});
            }
            // For the D/d keys, move the character right.
        } else if (event.key == "D" || event.key == "d") {
            // If it's a localgame, the changes are made directly to the board. Otherwise inform the server of a wanted change.
            if (localGame) {
                // The character moves right.
                if (gB.moveRight()) {
                    // Play the appropriate sound.
                    walkSound.play();
                    // Show the change.
                    printBoardObj(gB.copyBoard());
                }
            } else {
                walkSound.play();
                socket.emit("right", {});
            }
            walkSound.play();
            // For the S/s keys, kick the ball down.
        } else if (event.key == "S" || event.key == "s") {
            // If it's a localgame, the changes are made directly to the board. Otherwise inform the server of a wanted change.
            if (localGame) {
                let retMessage = gB.kickBall();
                // The character was able to kick a ball down.
                if (retMessage[0]) {
                    // Play the appropriate sound.
                    kickSound.play();
                    // Show the change.
                    printBoardObj(gB.copyBoard());
                    // If there's a mesage, display it.
                    if (retMessage[1][0] != "") gameMessage(retMessage[1][0]);
                    // The game is over. No more moves are available.
                    if (retMessage[1][1] == 0) {
                        // Get  the results.
                        let results = gB.finalPoints();
                        // Exit the game, clear the board, etc.
                        exitGame();
                        // Show the winner(s).
                        endGameScreen(results);
                    }
                }
            } else {
                kickSound.play();
                socket.emit("down", {});
            }
        }
    }
});

/** Setup for a custom, local game.
 */
function customSetup() {
    // This isn't an online game.
    localGame = true;
    // Grab the number of desired rows, columns, grays, arrows, points, and the T/F status of wormholes.
    let rows = parseInt($('#numberRows').val()),
        cols = parseInt($('#numberCols').val()),
        grays = parseThis('nGrays'),
        arrows = parseThis('nArrows'),
        points = parseThis('nPoints'),
        wormholes = $('#worholesYN').prop('checked');
    // Make a new board object.
    gB = new Board();
    // Custom game setup.
    gB.newGame(rows, cols, grays, arrows, points, 10, wormholes);
    // Print the initial board.
    printBoardObj(gB.copyBoard());
}

/** Setup for a normal, local game.
*/
function normalSetup() {
    // This isn't an online game.
    localGame = true;
    // Make a new board object.
    gB = new Board();
    // Initialization for a standard game.
    gB.newGame();
    // Print the initial board.
    printBoardObj(gB.copyBoard());
}

/** Setup for an online game.
*/
function onlineSetup() {
    // This is an online game.
    localGame = false;
    // Socket io is need for an online gmae.
    socket = io();
    // A message was recieved from the server. Display it.
    socket.on("whisper", function (dataFromServer) {
        gameMessage(dataFromServer);
    });
    // The game has ended properly. Close the socket, and show the results screen.
    socket.on("gameOver", function (endGame) {
        exitGame();
        endGameScreen(endGame);
    });
    // The other player left the game. Close the socket, return to game select, and inform player.
    socket.on("playerDC", function () {
        // Close the socket.
        exitGame();
        // Show the game type selection screen.
        reveal("#selectGame");
        // Tell the player that the other player left.
        alert("The other player disconnected.");
    });
    // The sever has sent an updated board to the client. Display it.
    socket.on("boardUpdate", function (boardFromServer) {
        gB = boardFromServer;
        printBoardObj(gB);
    });
}

/** Gets the value from a radio with the name 'string'.
 * 
 * @param   {String}    string  The name of the radio being accessed.
 * @returns {Number}            The value of the radio with the given name.
 */
function parseThis(string) {
    return parseInt($('input[name=' + string + ']:checked').val());
}

/** Nullifies the game board, and closes the socket if it was an online game. Displayed points are also reset.
 */
function exitGame() {
    // Nullify the game board.
    if (gB != null) {
        gB = null;
    }
    // Clear the board visually.
    $("#pictureBoard").html("");
    if (!localGame) {
        if (socket.readyState === socket.OPEN) socket.close();
    }
    resetPoints();
}

/** Displays the end-game-screen, and the point total of each player, and determines a winner from that. It also 
 * 
 * @param   {Object}    endGame Endgame has 3 parts.
 *                          winner:     The winner of the game respresented by: "Red", "Blue", or "None".
 *                          redPoints:  The number of points red had at the end.
 *                          bluePoints: The number of points blue had at the end.
 */
function endGameScreen(endGame) {
    // Show the winner screen.
    reveal("#winnerScreen");
    // Set the points for the determined winner.
    if (endGame.winner == "Red") {
        $("#winnerPoints").html("Red totaled " + endGame.redPoints + " points.");
        $("#loserPoints").html("Blue totaled " + endGame.bluePoints + " points.");
    } else if (endGame.winner == "Blue") {
        $("#winnerPoints").html("Blue totaled " + endGame.bluePoints + " points.");
        $("#loserPoints").html("Red totaled " + endGame.redPoints + " points.");
    } else {
        $("#winnerPoints").html("Both players totaled " + endGame.redPoints + " points.");
        $("#loserPoints").html("");
    }
    // Set the picture to reflect the appropriate winner.
    $("#winnerPic").attr("src", "./assets/img/winner" + endGame.winner + ".png");
}

/** Sets the header for both player's point totals to zero.
*/
function resetPoints() {
    setBluePoints(0);
    setRedPoints(0);
}

/** Sets the header for the blue player's points to n.
 * @param   {Number}    n   The umber of points that wil display for blue's points.
*/
function setBluePoints(n) {
    $("#bluePointHeader").html("Blue Points: " + n);
}

/** Sets the header for the red player's points to n.
 * @param   {Number}    n   The number of points that will display for red's points.
*/
function setRedPoints(n) {
    $("#redPointHeader").html("Red Points: " + n);
}

/** Updates all relevant game information.
 * @param   {boardInfo} JSONObject  The boardInfo of the current gameboard.
*/
function printBoardObj(JSONObject) {
    // Updates both player's points.
    setRedPoints(JSONObject.redPoints);
    setBluePoints(JSONObject.bluePoints);
    // The construction of the gameboard update.
    var HTMLRet = '<tr>';
    // This loop creates the top row with the current player's avatar.
    for (let i = 0; i < JSONObject.numberCols; i++) {
        HTMLRet += '<td><img src="./assets/img/'
        if (JSONObject.redTurn && JSONObject.redPos == i) {
            HTMLRet += 'redPlayer'
        } else if (!JSONObject.redTurn && JSONObject.bluePos == i) {
            HTMLRet += 'bluePlayer'
        } else {
            HTMLRet += 'blackBlock'
        }
        HTMLRet += '.png" class="blockSize"></td>';
    }
    HTMLRet += '</tr>';
    // The following loop compiles the rest of the board.
    for (let row = 0; row < JSONObject.numberRows; row++) {
        HTMLRet += '<tr>';
        for (let col = 0; col < JSONObject.numberCols; col++) {
            let currentBlock = JSONObject.board[row][col];
            HTMLRet += '<td><img src="./assets/img/';
            // The following statements put the correct picture onto the block.
            if (row == 0) {
                if (currentBlock == bothBalls) {
                    if (JSONObject.redTurn) {
                        HTMLRet += 'redBall'
                    } else {
                        HTMLRet += 'blueBall'
                    }
                } else if (JSONObject.redTurn && currentBlock == redBall) {
                    HTMLRet += 'redBall'
                } else if (!JSONObject.redTurn && currentBlock == blueBall) {
                    HTMLRet += 'blueBall'
                } else {
                    HTMLRet += 'openBlock'
                }
            } else if (currentBlock == redBall) {
                HTMLRet += 'redBall'
            } else if (currentBlock == blueBall) {
                HTMLRet += 'blueBall'
            } else if (currentBlock == blankBlock) {
                HTMLRet += 'openBlock'
            } else if (currentBlock == grayBlock) {
                HTMLRet += 'grayBlock'
            } else if (currentBlock == arrowBlockLeft) {
                HTMLRet += 'leftArrow'
            } else if (currentBlock == arrowBlockRight) {
                HTMLRet += 'rightArrow'
            } else if (currentBlock == pointBlock) {
                HTMLRet += 'pointBlock'
            } else if (currentBlock == wormholeBlock) {
                HTMLRet += 'wormholeBlock'
            } else {
                // Something went wrong. Print error information.
                HTMLRet += 'openBlock'
                console.log('UnknownBlock:', currentBlock, 'row:', row, 'col:', col);
            }
            HTMLRet += '.png" class="blockSize">';
            // If the ball is on the field currently, put the number of points it's worth on it.
            if (row == 0) {
                // The first row should only show points on the currently visible balls.
                if (JSONObject.redTurn && currentBlock == redBall || !JSONObject.redTurn && currentBlock == blueBall || currentBlock == bothBalls) {
                    HTMLRet += '<span class="pointsOverlay">' + row * 2 + '</span>';
                }
            } else if (currentBlock == blueBall || currentBlock == redBall) {
                HTMLRet += '<span class="pointsOverlay">' + row * 2 + '</span>';
            }
            HTMLRet += '</td>';
        }
        HTMLRet += '</tr>';
    }
    // Update the board with the new construction.
    $("#pictureBoard").html(HTMLRet);
}

/** Display a message on the screen.
 * @param {String} text The message to be displayed.
 */
function gameMessage(text) {
    $("#gameMessage").html(text);
    $("#gameMessage").show();
}
