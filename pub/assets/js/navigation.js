/**
 * Navigation.js
 * 
 * This file is a script for the local browser to navigate the various menus that it may reasonably reach on its own by navigating the menus available to it.
 * The file accomplishes this by adding click listeners to various class names, and revealing the appropriate divs or sections of the HTML.
 * If further sections are added to the HTMl, they must also be given a '.hide()' call in the 'reveal()' function.
 * 
 * @summary Navigation script for the user to go to various menus.
*/

// Holds the How to Play images.
var htpImgs = ["assets/img/htp_1.gif", "assets/img/htp_2.gif", "assets/img/htp_3.png", "assets/img/htp_4.png",
    "assets/img/htp_5.gif", "assets/img/htp_6.gif", "assets/img/htp_7.gif", "assets/img/htp_8.gif"];
// The 'How to Play' starts at image 1.
var htpPage = 0;

function navigation() {
    // Reveals the 'Credits' section.
    $(".cred").click(function () {
        reveal("#credits");
    });

    // Reveals the 'Gameboard' section, and launches a custom game.
    $(".customGo").click(function () {
        reveal("#theGameProper");
        customSetup();
    });

    // Reveals the 'Custom Game Options' section.
    $(".customOptions").click(function () {
        reveal("#customMenu");
    });

    // Reveals the 'Gameboard' section, and launches a local game.
    $(".locNormal").click(function () {
        reveal("#theGameProper");
        normalSetup();
    });

    // Reveals the 'Main Menu' section.
    $(".main").click(function () {
        reveal("#mainMenu");
    });

    // Reveals the 'Game Selection' section.
    $(".new").click(function () {
        reveal("#selectGame");
    });

    // Reveals the 'Gameboard' section, and launches an online game.
    $(".onlineGo").click(function () {
        reveal("#theGameProper");
        onlineSetup();
    });

    // Reveals the 'Game Selection' section, and leaves the current game. It disconnects as appropriate if it was an online game.
    $(".quitGame").click(function () {
        reveal("#selectGame");
        // Makes sure that you can't send commands if you leave a game.
        exitGame();
    });

    // Reveals the 'How to Play' section.
    $(".rule").click(function () {
        reveal("#htp");
    });

    // Reveals the previous image in the 'How to Play' section.
    $("#htpPrev").click(function () {
        // Prevent out of bounds by checking against zero just in case.
        if (htpPage > 0) htpPage -= 1;
        // Change the picture.
        $("#htp_pic").attr('src', htpImgs[htpPage]);
        // Hide the previous button if this is the first image to help prevent out of bounds.
        if (htpPage == 0) $("#htpPrev").hide();
        // The previous button was pressed so the current picture shouldn't be the last one.
        $("#htpNext").show();
    });

    // Revelas the next image in the 'How to Play' section.
    $("#htpNext").click(function () {
        // Prevent out of bounds by checking against the maximum just in case.
        if (htpPage < htpImgs.length - 1) htpPage += 1;
        // Change the picture.
        $("#htp_pic").attr('src',htpImgs[htpPage]);
        // Hide the next button if this is the last image to help prevent out of bounds.
        if (htpPage == htpImgs.length - 1) $("#htpNext").hide();
        // The next button was pressed so the current picture shouldn't be the first one.
        $("#htpPrev").show();
    });

    // Closes the window.
    $(".exit").click(function () {
        window.close();
    });

    reveal("#mainMenu");
    window.resizeTo(550, 475);
}

/** Hide everything first, and then reveals the id that was given. When adding new HTML sectinos, make sure to hide them.
 * @param   {String}    section The section to be revealed after all sections are hidden.
*/
function reveal(section) {
    $("#credits").hide();
    $("#customMenu").hide();
    $("#gameMessage").hide();
    $("#htp").hide();
    $("#mainMenu").hide();
    $("#selectGame").hide();
    $("#theGameProper").hide();
    $("#winnerScreen").hide();
    $(section).show();
}

// Allow the navigation to function.
$(navigation);
