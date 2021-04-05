/**
 * This is a class file for the Board object. It holds all the necessary data for a game including the game board, which player's turn it is, each players positions, etc.
 * The Object is used by:
 *  1. Initializing a game with the 'newGame()' function. If it's a standard game, then no arguments are required, otherwise inputed values should follow the guidelines.
 *  2. Once initialized the game is run by giving it the 'moveLeft()' and 'moveRight()' functions to move the players, and the 'kickBall()' function to kick the balls.
 *      The legitamacy of these calls, based on which player's turn it is, should be determined by the holder of the object. The object only makes distinctions for legal moves.
 *          Ex: If the 'moveLeft()' function is called by the blue player, but it's red turn, the holder of the object should not call the 'moveLeft()' function.
 *  3. After each 'kickDown()' call, a gameMessage will be returned:
 *      [kicked: false, ""]
 *          If there wasn't a move made, then kicked is false.
 *      [kicked: true, ["message", code]]
 *          If a move is made, then kicked is true. An additional message, and corresponding code will be given with it.
 *              code == 0 means neither player can move.
 *              code == 1 means only red can still move.
 *              code == 2 means only blue can still move.
 *              code == 3 means both players can still move.
 *  4. The holder of the object should continue the game until neither player can move.
 *  5. When code '0' is returned, then no more moves can be made. The results may be obtained by calling the function 'finalPoints()'. The results will be returned as follows:
 *      [winner: "Red", bluePoints, redPoints]
 *          Red won the game.
 *      [winner: "Blue", bluePoints, redPoints]
 *          Blue won the game.
 *      [winner: "None", bluePoints, redPoints]
 *          The game was a tie.
 *  6. The appropriate winner screen should be displayed, along with each player's point total.
 * 
 * @summary This is a class file for the Board object. It holds the gameboard, player's positions, and player's points.
 * 
 * @todo    Row, and Column pairs should be made into a coordinate, or position object.
 *          The 'ballObject' needs to have it's own file, and be a proper object.
 */

 const blankBlock = 0,
    redBall = 1,
    blueBall = 2,
    bothBalls = 3,
    grayBlock = 4,
    arrowBlockLeft = 5,
    arrowBlockRight = 6,
    pointBlock = 7,
    wormholeBlock = 8;

class Board {
    constructor() {
        this.gameBoard;         // The 2D-array gameboard.
        this.redTurn;           // Is it red's turn right now.
        this.active;            // Is a turn being played out right now.
        this.redPos;            // Red's column.
        this.bluePos;           // Blue's column.
        this.wormholeArray;     // An array to keep track of all wormholes, and their positions.
        this.redTotal;          // Point variable for red.
        this.blueTotal;         // Point variable for blue.
        this.redMoves;          // Avaiable moves for red T/F.
        this.blueMoves;         // Avaiable moves for blue T/F.
        this.pointBlockValue;   // The value of each point block.
    }

    /** The increments determine the level of frequency: none, low, normal, and high for each row.
     * @param   {Number}    grays       Blocks frequency for gray block from -4 to 2 in increments of 2.
     * @param   {Number}    arrows      Blocks frequency for arrow blocks from -6 to 3 in increments of 3.
     * @param   {Number}    points      Blocks frequency for point blocks from -2 to 1 in increments of 1.
     * @param   {Number}    pointValue  The value of each point block from 1 to 99.
     * @param   {Boolean}   wormholes   Whether or not there can be wormholes.
     * @param   {Number}    rows        The number of rows the final gameboard will have.
     * @param   {Number}    columns     The number of columns the final gameboard will have.
    */
    newGame (rows = 18, columns = 27, grays = 0, arrows = 0, points = 0, pointValue = 10, wormholes = true) {
        // Make a new gameboard. There are a minimum of 5 rows, and maximum of 18 rows. There are a minimum of 6 cols, and a maximum of 27 columns.
        this.newBoard(rows < 5 ? 5 : (rows > 18 ? 18 : rows), columns < 6 ? 6 : (columns > 27 ? 27 : columns));

        // Reset the standard variables
        this.resetVars(wormholes, pointValue);

        // Set up the first row, which contains both player's balls.
        for (let y = 0; y < this.getNumColumns(); y++) this.setBoardSquare(0, y, bothBalls);

        // These are arrays for randomly rolling blocks. The default is empty for the 'none' frequency.
        let grayBlocks = [], arrowBlocks = [], pointBlocks = [];
        // This sets up arrays for randomness on the board using the given parameters. Each array will be used once per row.
        if (grays != -4) grayBlocks = [0 + grays, 1 + grays, 2 + grays, 3 + grays, 4 + grays];
        if (arrows != -6) arrowBlocks = [3 + arrows, 4 + arrows, 5 + arrows, 6 + arrows];
        if (points != -2) pointBlocks = [0 + points, 1 + points, 2 + points];

        /* Fills each row of the board with blocks, starting with grayBlock, then arrowBlock, pointsBlock, and wormholeBlock.
            *      Row '0' is for the palyer's balls.
            *      Row '1' remains empty to give at least one player a chance to kick a ball from each column.
            *      Row 'getNumRows()-1' is to remain blank.
            */
        for (let row = 2; row < this.getNumRows() - 1; row++) {
            // The 'freeSpaces' variable is used to make the adding process in the event of a filled row faster.
            let freeSpaces = this.getNumColumns();
            // Add gray blocks first.
            freeSpaces = this.addBlocks(freeSpaces, row, grayBlocks, grayBlock);
            // Add arrow blocks next.
            freeSpaces = this.addBlocks(freeSpaces, row, arrowBlocks, arrowBlockLeft);
            // Add point blocks last.
            freeSpaces = this.addBlocks(freeSpaces, row, pointBlocks, pointBlock);
            /* Add wormhole blocks if used. Should be about 3 wormholes per board on the standard board.
                This also means that wormhole probability is based on number of rows, and not total size. */
            if (wormholes) this.addBlocks(freeSpaces, row, [0, 0, 0, 0, 0, 1], wormholeBlock);
        }
        this.checkWormhole();
    }

    /** This makes a new blank board the size rows by columns
     * @param   {Number}    rows    The number of rows the gameboard will have.
     * @param   {Number}    columns The number of columns the gameboard will have.
     */
    newBoard (rows, columns) {
        // This sets up the game board as a 2D array of the inputed size.
        this.gameBoard = new Array(rows);
        for (let x = 0; x < rows; x++)
            this.gameBoard[x] = new Array(columns);
        /* The entire board is made to have blankBlocks. This is too make sure that everything is 0 just in case. 
            Now that the board has been initialized we can use the functions, instead of the 'rows', and 'columns' parameters. */
        for (let x = 0; x < this.getNumRows(); x++)
            for (let y = 0; y < this.getNumColumns(); y++)
                this.setBoardSquare(x, y, blankBlock);
    }

    /** This function resets all object variables besides the board. The wormholeArray can be omitted by calling this function with false. 
     * Note: This doesn't remove the wormholes from the board.
     * @todo    Use this for a rematch option.
     * @param   {Boolean}   wormholes   If true, the womrholes array is reset as well.
     * @param   {Number}    pointValue  The value that point blocks will have, from 1 to 99.
     */
    resetVars (wormholes = true, pointValue = 10) {
        // New game variable initilization.
        this.redTurn = true;                        // Red goes first.
        this.active = false;                        // A turn isn't happening now.
        this.setRedPos(0);                          // Standard starting position.
        this.setBluePos(0);                         // Standard starting position.
        this.pointBlockValue = pointValue;          // The value of each point block.
        this.wormholeArray = [];                    // An array to keep track of all wormholes, and their positions.
        this.setRedPoints(0);                       // Red starts with 0 points.
        this.setBluePoints(0);                      // Blue starts with 0 points.
        this.redMoves = true;                       // Red has available moves.
        this.blueMoves = true;                      // Blue has available moves.
    }

    /** A function that adds blocks to a row of the board given the parameters.
     * @param   {Number}    freeSpots   The number of columns that are free.
     * @param   {Number}    row         The row that blocks are being added too.
     * @param   {Array}     blockArray  The random number array for the block currently being added.
     * @param   {Number}    blockID     The value of the block that's being added. Arrow direction is determined randomly so only arrowBlockLeft is needed.
     * @return  {Number}                The number of freespaces left in the row.
    */
    addBlocks (freeSpots, row, blockArray, blockID) {
        // Tracking the number of blocks to go into a row.
        for (let numBlocks = 0; numBlocks < blockArray[this.rando(blockArray.length)]; numBlocks++) {
            // Potential column for a block.
            let column = this.rando(this.getNumColumns());
            // If it's empty, and there are free spots, find them.
            while (freeSpots > 0 && this.getBoardSquare(row, column) != blankBlock) column = this.rando(this.getNumColumns());
            // If there are empty spaces, add blocks.
            if (freeSpots) {
                if (blockID == arrowBlockLeft) {
                    // Arrows are either right or left determined randomly.
                    this.setBoardSquare(row, column, this.rando(2) + arrowBlockLeft);
                    freeSpots--;
                } else if (blockID == wormholeBlock) {
                    this.addWormholeBlock(row, column);
                    freeSpots--;
                } else {
                    this.setBoardSquare(row, column, blockID);
                    freeSpots--;
                }
            } else
                break;
        }
        return freeSpots;
    }

    /** This function makes sure that there isn't just one wormhole on the board.
     * If there is, it attempts to add another to the board, if it can't, the solo wormholeBlock is removed.
     */
    checkWormhole () {
        // If only 1, then add another.
        if (this.getNumWormholes() == 1) {
            // Randomly selects a row. As in add blocks, the first two rows are for the balls, and a blank row respectively. The last row is to remain blank.
            let row = this.rando(this.getNumRows() - 3) + 2;
            // Randomly selects a column.
            let column = this.rando(this.getNumColumns());
            let loopcount = 0;
            // Gives 200 chances for a wormhole to be placed.
            while (this.getBoardSquare(row,column) != blankBlock && loopcount < 200) {
                row = this.rando(this.getNumRows() - 3) + 2;
                column = this.rando(this.getNumColumns());
                loopcount++;
            }
            if (loopcount < 200) {
                this.addWormholeBlock(row, column);
            } else {
                // No empty spot was found, so the wormhole will be eliminated.
                this.setBoardSquare(this.wormholeArray[0].row, this.wormholeArray[0].column, blankBlock);
                this.wormholeArray = [];
            }
        }
    }

    /** Move active player left as able. Returns true if the move was made, and false if it wasn't.
     * @return  {Boolean}   True if a move was made, and false if it wasn't.
     * @todo                This active check shouldn't be here.
    */
    moveLeft () {
        if (!this.active) {
            if (this.isRedTurn() && this.getRedPos() > 0) {
                this.redPos--;
                return true;
            } else if (!this.isRedTurn() && this.getBluePos() > 0) {
                this.bluePos--;
                return true;
            }
        }
        return false;
    }

    /** Move active player right as able. Returns true if the move was made, and false if it wasn't.
     * @return  {Boolean}   True if a move was made, and false if it wasn't.
     * @todo                This active check shouldn't be here.
    */
    moveRight () {
        if (!this.active) {
            if (this.isRedTurn() && this.getRedPos() < this.getNumColumns() - 1) {
                this.redPos++;
                return true;
            } else if (!this.isRedTurn() && this.getBluePos() < this.getNumColumns() - 1) {
                this.bluePos++;
                return true;
            }
        }
        return false;
    }

    /** This method determines if there's a ball to kick. If yes, lock moves, and pass down the torch. If not, it returns false.
     * @returns An array with the following properties:
    *       [0] - True or False signifying if a move was made.
    *       [1][0] - A special message.
    *       [1][1] - A numeric representation of the message.
    *           0 means neither player can move.
    *           1 means only the red player can still move.
    *           2 means only the blue player can still move.
    *           3 means both players can still move.
     */
    kickBall () {
        let kicked = false;
        // Make sure no turn is happening.
        if (!this.active) {
            // This checks if the player has a ball of their color to move.
            if ((this.isRedTurn() && (this.getBoardSquare(0, this.getRedPos()) == bothBalls || this.getBoardSquare(0, this.getRedPos()) == redBall))
                || (!this.isRedTurn() && (this.getBoardSquare(0, this.getBluePos()) == bothBalls || this.getBoardSquare(0, this.getBluePos()) == blueBall))) {
                // This makes sure that there is room for the ball to go.
                this.active = true;
                if (this.isRedTurn()) {
                    kicked = this.kickBall2(this.getRedPos());
                } else if (!this.isRedTurn()) {
                    kicked = this.kickBall2(this.getBluePos());
                }
                // Check if the game is over, and which players still have moves to make.
                let gameMessage = this.gameOver();
                // If a player made a move, and the other player has available moves change turns.
                if ((this.isRedTurn() && this.blueMoves) || (!this.isRedTurn() && this.redMoves))
                    this.changeTurn(kicked);
                // Other turns may be made.
                this.active = false;
                return [kicked, gameMessage];
            } else {
                // There is no appropriate ball to be kicked.
                return [kicked, ""];
            }
        } else {
            // Turn in progress.
            return [kicked, ""];
        }
    }

    /** This function checks to see whether or not a given column has a blankBlock in the 2nd row. If there is, it passes the torch to have the ball begins falling; otherwise it returns false.
     * @param   {Number}    col     The number to check for a column.
     * @returns {Boolean}           True or false if ball moved.
    */
    kickBall2 (col) {
        if (this.getBoardSquare(1, col) != blankBlock) return false;
        return this.freeFall(0, col);
    }

    /** This method makes a ball object, and determines what the apporpriate action is for the ball. When movement concludes, it adds the number of points to the approriate players' points.
     * @ret True or flase if the ball moves. 
    */
    freeFall (row, column) {
        let moved = false;
        /** A ball object.
         * @typedef     {Object}    ballObject
         * @property    {Number}    row         The row the ball is currently on.
         * @property    {Number}    column      The column the ball is currently on.
         * @property    {Number}    color       The value of the ball falling is either redBall or blueBall. If the ball is on the 'home row' the owner is determined by redTurn.
         * @property    {Boolean}   canMove     The still has further to move. (This is only for arrow blocks.) 
         * @property    {Number}    startingRow Used to detemine the amount to be added to a players points.
         */
        let ballObject = {
            "row": row, "column": column, "color": row > 0 ? this.getBoardSquare(row, column) : this.isRedTurn() ? redBall : blueBall,
            "canMove": true, "startingRow": row
        };
        // While the ball is in free to move, the ball needs to move. The action is detemined by what's below the ball.
        while (ballObject.canMove && ballObject.row < this.getNumRows() - 1) {
            if (this.getBoardSquare(ballObject.row + 1, ballObject.column) == blankBlock) {
                this.rollDown(ballObject);
            } else if (this.getBoardSquare(ballObject.row + 1, ballObject.column) == arrowBlockRight) {
                this.rollRight(ballObject);
            } else if (this.getBoardSquare(ballObject.row + 1, ballObject.column) == arrowBlockLeft) {
                this.rollLeft(ballObject);
            } else if (this.getBoardSquare(ballObject.row + 1, ballObject.column) == pointBlock) {
                this.addPointBlock();
                this.rollDown(ballObject);
            } else if (this.getBoardSquare(ballObject.row + 1, ballObject.column) == wormholeBlock) {
                this.teleport(ballObject);
            } else {
                break;
            }
            moved = true;
        }
        // Making it to the last row is worth 2x the normal number of points.
        if (ballObject.row >= this.getNumRows() - 2) {
            this.setBoardSquare(ballObject.row, ballObject.column, blankBlock);
            // This sets the row to exactly what is wanted just in case the row is somehow beyond the bounds of the board or not on the second to last row.
            ballObject.row = (this.getNumRows() - 3) * 2;
        }
        // Players gain 2 points for each row moved.
        if (ballObject.color == redBall)
            this.addRedPoints((ballObject.row - ballObject.startingRow) * 2);
        else
            this.addBluePoints((ballObject.row - ballObject.startingRow) * 2);
        return moved;
    }

    /** A Ball needs to move down.
     *  @param   {ballObject}    ball    A ball that needs to move down.
    */
    rollDown (ball) {
        // If this is in the home row, place the other ball color there.
        if (this.getBoardSquare(ball.row, ball.column) == bothBalls) {
            if (this.isRedTurn()) {
                this.setBoardSquare(ball.row, ball.column, blueBall);
            } else {
                this.setBoardSquare(ball.row, ball.column, redBall);
            }
        } else {
            // Remove the old ball from the board.
            this.setBoardSquare(ball.row, ball.column, blankBlock);
        }
        // Make the ball fall by incrementing the row.
        ball.row += 1;
        // Add the new ball to the board.
        this.setBoardSquare(ball.row, ball.column, ball.color);
    }

    /** A Ball needs to move left.
     * @param   {ballObject}    ball    A ball that needs to move left.
    */
    rollLeft (ball) {
        // If there's a point block to the right add the points, and remove the block.
        if (ball.column > 0 && this.getBoardSquare(ball.row, ball.column - 1) == pointBlock) {
            this.addPointBlock();
            this.setBoardSquare(ball.row, ball.column - 1, blankBlock);
        }
        // If the space to the left is either empty, or is a wormholeBlock, then further moves can occur.
        if (ball.column > 0 && ((this.getBoardSquare(ball.row, ball.column - 1) == blankBlock) || (this.getBoardSquare(ball.row, ball.column - 1) == wormholeBlock))) {
            // Remove the old ball from the board.
            this.setBoardSquare(ball.row, ball.column, blankBlock);
            // Change the direction of the arrow.
            this.setBoardSquare(ball.row + 1, ball.column, arrowBlockRight);
            // If it's a blankBlock then move the ball.
            if (this.getBoardSquare(ball.row, ball.column - 1) == blankBlock) {
                // Decrement the column the ball is in.
                ball.column -= 1;
                // Add the new ball to the board.
                this.setBoardSquare(ball.row, ball.column, ball.color);
            } else {
                // Teleport the ball.
                this.teleport(ball);
            }
        } else {
            // A solid block, or a ball is to the right. Nothing changes, and the ball cannot move any further.
            ball.canMove = false;
        }
    }

    /** A Ball needs to move right.
     * @param   {ballObject}    ball    A ball that needs to move right.
    */
    rollRight (ball) {
        // If there's a point block to the right add the points, and remove the block.
        if (ball.column < this.getNumColumns() - 1 && this.getBoardSquare(ball.row, ball.column + 1) == pointBlock) {
            this.addPointBlock();
            this.setBoardSquare(ball.row, ball.column + 1, blankBlock);
        }
        // If the space to the right is either empty, or is a wormholeBlock, then further moves can occur.
        if (ball.column < this.getNumColumns() - 1 && ((this.getBoardSquare(ball.row, ball.column + 1) == blankBlock) || (this.getBoardSquare(ball.row, ball.column + 1) == wormholeBlock))) {
            // Remove the old ball from the board.
            this.setBoardSquare(ball.row, ball.column, blankBlock);
            // Change the direction of the arrow.
            this.setBoardSquare(ball.row + 1, ball.column, arrowBlockLeft);
            // If it's a blankBlock then move the ball.
            if (this.getBoardSquare(ball.row, ball.column + 1) == blankBlock) {
                // Increment the column the ball is in.
                ball.column += 1;
                // Add the new ball to the board.
                this.setBoardSquare(ball.row, ball.column, ball.color);
            } else {
                // Teleport the ball.
                this.teleport(ball);
            }
        } else {
            // A solid block, or a ball is to the right. Nothing changes, and the ball cannot move any further.
            ball.canMove = false;
        }
    }

    /** This function teleports a ball given a ball object.
     * @param   {ballObject}    ball    A ball object to be teleported.
     */
    teleport (ball) {
        // Get a a random wormhole for the ball to teleport to.
        let randomWormholeNumber = this.rando(this.wormholeArray.length);
        let randomWormhole = this.wormholeArray[randomWormholeNumber];
        // The original position of the ball is made blank to prevent duplication.
        if (ball.color == blueBall || ball.color == redBall) this.setBoardSquare(ball.row, ball.column, blankBlock);
        // The ball will be in the new column either way.
        ball.column = randomWormhole.column;
        // If there is room for the ball to go below the portal, then place it there. Otherwise, it will replace the wormhole it came through.
        if (this.getBoardSquare(randomWormhole.row + 1, randomWormhole.column) == blankBlock) {
            ball.row = randomWormhole.row + 1;
            this.setBoardSquare(ball.row, ball.column, ball.color);
        } else {
            // The ball will replace the wormhole as the ball cannot fall. The wormhole needs to be removed.
            ball.row = randomWormhole.row;
            this.setBoardSquare(randomWormhole.row, randomWormhole.column, ball.color);
            this.wormholeArray.splice(randomWormholeNumber, 1);
            // If there's only one wormhole left, remove it.
            if (this.getNumWormholes() == 1) {
                let lastWormhole = this.wormholeArray[0];
                this.setBoardSquare(lastWormhole.row, lastWormhole.column, blankBlock);
                this.wormholeArray = [];
            }
        }
    }

    /** This function checks to see if both players still have available moves to make. If not, it ends the game.
     * @returns A poor method of telling the game state.
     * @todo    Redesign the messaging system.
     */
    gameOver () {
        // If red was able to move previously then check that they are still able to do so.
        if (this.redMoves) {
            this.redMoves = false;
            for (let i = 0; i < this.getNumColumns(); i++) {
                // If the spot below where a redBall is, is empty, then they can still move.
                if (((this.getBoardSquare(0, i) == redBall) || (this.getBoardSquare(0, i) == bothBalls)) &&
                    this.getBoardSquare(1, i) == blankBlock) {
                    this.redMoves = true;
                    break;
                }
            }
        }
        // If blue was able to move previously then check that they are still able to do so.
        if (this.blueMoves) {
            this.blueMoves = false;
            for (let i = 0; i < this.getNumColumns(); i++) {
                // If the spot below where a blueBall is, is empty, then they can still move.
                if (((this.getBoardSquare(0, i) == blueBall) || (this.getBoardSquare(0, i) == bothBalls)) &&
                    this.getBoardSquare(1, i) == blankBlock) {
                    this.blueMoves = true;
                    break;
                }
            }
        }
        /* Along with a message, it will also have a "return code" for easy identification.
            ["message", code]
                code == 0 means neither player can move.
                code == 1 means only red can still move.
                code == 2 means only blue can still move.
                code == 3 means both players can still move.*/
        let badMessageHandling = ["", 3];
        if (this.redMoves && this.blueMoves) {
            return badMessageHandling;
        } else if (!this.redMoves && !this.blueMoves) {
            badMessageHandling = ["Neither player can move. Removing gray blocks.", 0];
        } else if (!this.redMoves) {
            return ["Red cannot move. They get no more moves.", 2];
        } else if (!this.blueMoves) {
            return ["Blue cannot move. They get no more moves.", 1];
        }
        // Neither player can move so all gray blocks need to be removed, and any ball that can fall will fall.
        for (let row = 0; row < this.getNumRows(); row++) {
            for (let column = 0; column < this.getNumColumns(); column++) {
                if (this.getBoardSquare(row, column) == grayBlock) this.setBoardSquare(row, column, blankBlock);
            }
        }
        // Move from the bottom of the board on up, and let all balls that can move, move.
        for (let row = this.getNumRows() - 2; row > 0; row--) {
            for (let column = 0; column < this.getNumColumns(); column++) {
                if (this.getBoardSquare(row + 1, column) == blankBlock
                    && (this.getBoardSquare(row, column) == blueBall
                        || this.getBoardSquare(row, column) == redBall))
                    this.freeFall(row, column);
            }
        }
        return badMessageHandling;
    }

    /** From https://stackoverflow.com/questions/28763257/jsdoc-return-object-structure
     * @typedef     {Object}    winners
     * @property    {String}    winner      The winner of the game. Either "Red", "Blue", or "None".
     * @property    {Number}    bluePoints  A Number with blue's points.
     * @property    {Number}    redPoints   A Number with red's points.
     */
    /** Returns an object with a 'winner', 'bluePoints', and 'redPoints' properties.
     * 
     * @returns {winners}   An object with the winner, and blue's and red's points.
     *      winner:     "Red", "Blue", or "None".
     *      bluePoints: Blue's total number of points.
     *      redPoints:  Red's total number of points.
     */
    finalPoints () {
        // Get red's points.
        let redTotal = this.getRedPoints();
        // Get blue's points.
        let blueTotal = this.getBluePoints();
        // Construct a winners object and return it.
        return { winner: (redTotal > blueTotal ? "Red" : blueTotal > redTotal ? "Blue" : "None"), bluePoints: blueTotal, redPoints: redTotal };
    }

    /** Returns a random number from 0, up to, but excluding, n. 
     * @param   {Number}    n   A number.
     * @return  {Number}        A random number.
    */
    rando (n) {
        return Math.floor(Math.random() * n);
    }

    /** Add points to the current players' points equal to pointBlockValue. */
    addPointBlock () {
        if (this.isRedTurn())
            this.addRedPoints(this.pointBlockValue);
        else
            this.addBluePoints(this.pointBlockValue);
    }

    /** Place a wormhole on the board at position x, y.
     * @param   {Number}    row The row the wormhole will be placed in.
     * @param   {Number}    col The column the wormhole will be placed in.
    */
    addWormholeBlock (row, col) {
        this.wormholeArray.push({ row: row, column: col });
        this.setBoardSquare(row, col, wormholeBlock);
    }

    /** If true, changes the active players turn
     * @param   {Boolean} bool  True or false
    */
    changeTurn (bool) {
        if (bool) this.redTurn = !this.redTurn;
    }

    /** Returns true if it's red's turn, and false if it's blue's turn. 
     * @return  {Boolean}   True for red's turn, false for blue's turn.
    */
    isRedTurn () {
        return this.redTurn;
    }

    /** Returns the width of the board. 
     * @return  {Number}    The number of columns on the board..
    */
    getNumColumns () {
        return this.gameBoard[0].length;
    }

    /** Returns the height of the board.
     * @return  {Number}    The number of rows on the board.
     */
    getNumRows () {
        return this.gameBoard.length;
    }

    /** Returns the number of wormholes. 
     * @return  {Number}    The number of wormholes on the board.
    */
    getNumWormholes () {
        return this.wormholeArray.length;
    }

    /** Returns the value of the gameboard at row, and column.
     * @param   {Number}    row The row the block is on.
     * @param   {Number}    col The column the block is on.
     * @return  {Number}        The value of the block at the position.
    */
    getBoardSquare (row, col) {
        if (row >= 0 && row < this.getNumRows() &&
            col >= 0 && col < this.getNumColumns()) {
            return this.gameBoard[row][col];
        } else {
            print("Attempted to get out of bounds square.", row, col);
            return -1;
        }
    }

    /** Sets the spot row, col of the board to the block value. 
     * @param   {Number}    row         The row of the block
     * @param   {Number}    col         The column of the block
     * @param   {Number}    blockID     The block being placed there.
    */
    setBoardSquare (row, col, blockID) {
        if (row >= 0 && row < this.getNumRows() &&
            col >= 0 && col < this.getNumColumns()) {
            this.gameBoard[row][col] = blockID;
        } else {
            print("Attempted to set out of bounds square.", row, col, blockID);
        }
    }

    /** Adds the given number of points to blue's total.
     * @param   {Number}    points  The number of points to be added to blue's total.
     */
    addBluePoints (points) {
        this.blueTotal += points;
    }

    /** Returns blue's point total.
     * @return  {Number}    The total number of points blue has.
    */
    getBluePoints () {
        return this.blueTotal;
    }

    /** Sets blue's point total to the given number.
     * @param   {Number}    points  The new point total for blue.
     */
    setBluePoints (points) {
        this.blueTotal = points;
    }

    /** Adds the given number of points to red's total.
     * @param   {Number}    points  The number of points to be added to red's total.
     */
    addRedPoints (points) {
        this.redTotal += points;
    }

    /** Returns red's point total.
     * @return  {Number}    The total number of points red has.
    */
    getRedPoints () {
        return this.redTotal;
    }

    /** Sets red's point total to the given number.
     * @param   {Number}    points  The new point total for red.
     */
    setRedPoints (points) {
        this.redTotal = points;
    }

    /** Returns the column the blue character is at. 
     * @return  {Number} Blue's column.
    */
    getBluePos () {
        return this.bluePos;
    }

    /** Sets the column the blue character is at.
     * @param   {Number}    col The new colum for blue.
     */
    setBluePos (col) {
        this.bluePos = col;
    }

    /** Returns the column the red character is at.
     * @return  {Number} Red's column.
    */
    getRedPos () {
        return this.redPos;
    }

    /** Sets the column the red character is at.
     * @param   {Number}    col The column for red.
     */
    setRedPos (col) {
        this.redPos = col;
    }

    /** From https://stackoverflow.com/questions/28763257/jsdoc-return-object-structure
     * @typedef     {Object}    boardInfo
     * @property    {Array}     board       A copy of the game board
     * @property    {Boolean}   redTurn     A Boolean for whether or not it's red's turn.
     * @property    {Number}    redPoints   A Number with red's points.
     * @property    {Number}    bluePoints  A Number with blue's points.
     * @property    {Number}    numberRows  A Number for how many rows there are on the board.
     * @property    {Number}    numberCols  A Number for how many columns there are on the board.
     * @property    {Number}    bluePos     A Number for blue's column.
     * @property    {Number}    redPos      A Number for red's column.
     * @property    {Number}    pointValue  A number for the value of each point block.
     */
    /** Returns an object with all the information needed for the clients.
     * @return  {boardInfo} Object with various properties to give to clients as board updates.
    */
    copyBoard () {
        let boardObject = {};
        boardObject["board"] = this.gameBoard;
        boardObject["redTurn"] = this.isRedTurn();
        boardObject["redPoints"] = this.getRedPoints();
        boardObject["bluePoints"] = this.getBluePoints();
        boardObject["numberRows"] = this.getNumRows();
        boardObject["numberCols"] = this.getNumColumns();
        boardObject["bluePos"] = this.getBluePos();
        boardObject["redPos"] = this.getRedPos();
        boardObject["pointValue"] = this.pointBlockValue;
        return boardObject;
    }
}
    
/* Print gameboard information. */
function print() {
    for (i = 0; i < arguments.length; i++) console.log(arguments[i]);
}