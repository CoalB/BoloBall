/**
 * The server file for running a 'BoloBall' game.
 * The server matches two players together, and makes a board for them to play. Then it manages moves by only allowing the players to make moves during their turn.
 * It also manages player disconnects, and informs players of gameovers.
 * As of right now the server does this by having an array of 'rooms'. Each room holds one gameBoard, and the 'socket.id' one red player, and one blue player.
 * 
 * @summary The server file for a 'BoloBall' game.
 * @todo    Make 1 tree the players. Have 'socket.id' be the keys, and the boardgame number be the value.
 *          Have another tree for the boardgames. The key would be the board number, and it would hold the room (gameboard object, and the red, and blue players that are in that game).
 *          Room needs to  have it's own object file.
 *          With this redesign, 'topRoom' will never decrease. It will only increment as players are paired up.
 *          To do this, all trees, but espeically the gameboard tree, MUST have great rebalancing as boards are added and removed 
 *              to prevent limbs from being to heavy.
 */

var express = require("express"),
    http = require("http"),
    app = express(),
    server = http.Server(app),                          // To start the server listening.
    socketio = require("socket.io"),                    // Javascript 'Socket.io' package.
    io = socketio(server)                               // For server communication, and functionality.
    const Board = require("./serverBoard");             // The gameboard object.

/** This is the array for all the rooms. Each room that's occupied should contain the following:
 * @typedef     {Object}    room
 * @property    {String}    redPlayer   The socketid of the red player for the game.
 * @property    {String}    bluePlayer  The socketid of the blue player for the game.
 * @property    {Board}     gB          The board object for the game.
*/
var roomArray = [];     // The array of rooms.
var topRoom = 0;        // This keeps track of the highest room.
roomArray[topRoom] = { redPlayer: null, bluePlayer: null, gB: null };

app.use(express.static("pub"));

io.on("connection", function (socket) {
    /** Someone disconnected.
     * 1. Find their id.
     * 2. Tell the opponent they left.
     * 3. Adjust room array accordingly. */
    socket.on("disconnect", function () {
        roomArray.forEach(function (item, index) {
            if (item.redPlayer == socket.id || item.bluePlayer == socket.id) {
                // Disconnect the other player, and give them a message.
                if (item.redPlayer == socket.id)
                    io.to(item.bluePlayer).emit("playerDC");
                else
                    io.to(item.redPlayer).emit("playerDC");
                // Remove the room.
                roomArray.splice(index, 1);
                // This prevents topRoom from going negative with a redplayer connecting, and leaving before an opponent is found.
                if (topRoom > 0) topRoom--;
                // If those players where the topRoom, then made a new room.
                if (topRoom == 0) roomArray[topRoom] = { redPlayer: null, bluePlayer: null, gB: null };
            }
        });
        // Print in red 'Someone disconnected:' along with their socket.id.
        print("\x1b[31mSomeone disconnected:\x1b[0m " + socket.id);
        // Print in blue the number of filled rooms.
        print("\x1b[36mFilled rooms: " + topRoom + "\x1b[0m");
    });

    /** Someone pressed left.
     * Find the player's room, and move left if it's their turn.
     */
    socket.on("left", function () {
        roomArray.forEach(function (item, index) {
            // If the gameboard exists, then there is a game.
            if (item.gB != null) {
                let redTurn = item.gB.isRedTurn();
                // If it's their turn, and their game, then make the move.
                if ((item.redPlayer == socket.id && redTurn) || 
                    (item.bluePlayer == socket.id && !redTurn)) {
                    // Move the character left on the board.
                    item.gB.moveLeft();
                    // Update each player's board.
                    gameBoardUpdate(item);
                }
            }
        });
    });

    /** Someone pressed right.
     * Find the player's room, and move right if it's their turn.
     */
    socket.on("right", function () {
        // If the gameboard exists, then there is a game.
        roomArray.forEach(function (item, index) {
            if (item.gB != null) {
                let redTurn = item.gB.isRedTurn();
                // If it's their turn, and their game, then make the move.
                if ((item.redPlayer == socket.id && redTurn) ||
                    (item.bluePlayer == socket.id && !redTurn)) {
                    // Move the character right on the board.
                    item.gB.moveRight();
                    // Update each player's board.
                    gameBoardUpdate(item);
                }
            }
        });
    });

    /** Someone pressed down.
     * Find the player's room, and kick down if it's their turn.
     */
    socket.on("down", function () {
        roomArray.forEach(function (item, index) {
            // If the gameboard exists, then there is a game.
            if (item.gB != null) {
                let redTurn = item.gB.isRedTurn();
                // If it's their turn, and their game, then make the move.
                if ((item.redPlayer == socket.id && redTurn) ||
                    (item.bluePlayer == socket.id && !redTurn)) {
                    /** retMessage
                     *  [0] - True or False signifying if a move was made.
                     *  [1][0] - A special message.
                     *  [1][1] - A numeric representation of the message.
                     *      0 means neither player can move.
                     *      1 means only the red player can still move.
                     *      2 means only the blue player can still move.
                     *      3 means both players can still move.
                     */
                    let retMessage = item.gB.kickBall();
                    if (retMessage[0]) {
                        // Update each player's board.
                        gameBoardUpdate(item);
                        // If there's a mesage, send it to each player.
                        if (retMessage[1][0] != "") gameMessage(item, retMessage[1][0]);
                        // If the game is over, inform each player.
                        if (retMessage[1][1] == 0) gameOverWrapup(item);
                    }
                }
            }
        });
    });

    if (roomArray[topRoom].redPlayer == null) {
        // Add a red player.
        roomArray[topRoom].redPlayer = socket.id;
        // Let the red player know they're waiting.
        io.to(socket.id).emit("whisper", "Waiting for 2nd player.");
        // Print their id in red highlights.
        print("Adding Red Player with id: \x1b[41m" + socket.id + "\x1b[0m");
    } else if (roomArray[topRoom].bluePlayer == null) {
        // Add a blue player.
        roomArray[topRoom].bluePlayer = socket.id;
        // Print their id in blue highlights.
        print("Adding Blue Player with id: \x1b[46m" + socket.id + "\x1b[0m");
    }

    // The topRoom is full, so the players can start a new game.
    if (roomArray[topRoom].redPlayer && roomArray[topRoom].bluePlayer) {
        // This starts a standard game.
        roomArray[topRoom].gB = new Board();
        roomArray[topRoom].gB.newGame();
        // Send both players a copy of the board
        gameBoardUpdate(roomArray[topRoom]);
        // Send a message to each saying which team they're on.
        io.to(roomArray[topRoom].redPlayer).emit("whisper", "You are the Red Player.");
        io.to(roomArray[topRoom].bluePlayer).emit("whisper", "You are the Blue Player.");
    }
    // The current topRoom is full so a new one needs to be made.
    if (roomArray[topRoom].redPlayer != null && roomArray[topRoom].bluePlayer != null) {
        // Bump up the topRoom, and made an empty room.
        roomArray[++topRoom] = { redPlayer: null, bluePlayer: null, gB: null };
        // Status tracking.
        print("\x1b[35mMaking new room.\x1b[0m");
    }
    print("\x1b[36mFilled rooms: " + topRoom + "\x1b[0m");
});

/** Send one message to both clients of a room.
 * @param   {room}      item    The room that the message is being sent to.
 * @param   {String}    message The message being sent to both clients.
 */ 
function gameMessage(item, message) {
    // Send red the messasge.
    io.to(item.redPlayer).emit("whisper", message);
    // Send blue the message.
    io.to(item.bluePlayer).emit("whisper", message);
}

/** Give a copy of the current gameboard to to both the clients in a room.
 * @param   {room}      item   The room to be updated.
 */
function gameBoardUpdate(item) {
    // Make sure there is a gameboard to send.
    if (item.gB != null) {
        // Grab the copy.
        let retBoard = item.gB.copyBoard();
        // Send the board update to red.
        io.to(item.redPlayer).emit("boardUpdate", retBoard);
        // Send the board update to blue.
        io.to(item.bluePlayer).emit("boardUpdate", retBoard);
    } else {
        print("Error: Attempted to update nonexistant gameboard: ", item);
    }
}

/** Tell both players in a room that the game is over. The final point totals, and the result of those points will be sent to both players.
 * @param   {room}  item    The room the game has ended for.
 */
function gameOverWrapup(item) {
    // Construct a result object.
    let result = item.gB.finalPoints();
    // Tell red the result of the game.
    io.to(item.redPlayer).emit("gameOver", result);
    // Tell blue the result of the game.
    io.to(item.bluePlayer).emit("gameOver", result);
    print("Game over. Red: ", item.redPlayer, " Blue: ", item.bluePlayer);
}

/** Print server side information. */
function print() {
    for (i = 0; i < arguments.length; i++) console.log(arguments[i]);
}

server.listen(80, function () {
    print("Server with socket.io is ready on port 80.");
});
