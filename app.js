/* =====================================================
   Grandma's Alphabet Book
   Version 2.1.5
   ===================================================== */

"use strict";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const coverScreen = document.getElementById("cover-screen");
const bookScreen = document.getElementById("book-screen");
const openBookButton = document.getElementById("open-book");
const letterTabs = document.getElementById("letter-tabs");
const currentLetterHeading =
    document.getElementById("current-letter");
const editor = document.getElementById("editor");

let currentLetter = "A";
let saveTimer = null;

/* =====================================================
   STORAGE
   ===================================================== */

function getStorageKey(letter) {
    return `grandmas-alphabet-book-v2-${letter}`;
}

function loadLetter(letter) {
    try {
        return localStorage.getItem(
            getStorageKey(letter)
        ) || "";
    } catch (error) {
        console.error(
            "Unable to load saved information:",
            error
        );

        return "";
    }
}

function saveCurrentLetter() {
    try {
        localStorage.setItem(
            getStorageKey(currentLetter),
            editor.innerHTML
        );
    } catch (error) {
        console.error(
            "Unable to save information:",
            error
        );
    }
}

function scheduleSave() {
    window.clearTimeout(saveTimer);

    saveTimer = window.setTimeout(() => {
        saveCurrentLetter();
    }, 250);
}

/* =====================================================
   LETTER TABS
   ===================================================== */

function createLetterTabs() {
    letterTabs.innerHTML = "";

    alphabet.forEach((letter) => {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "letter-tab";
        button.textContent = letter;
        button.dataset.letter = letter;

        button.setAttribute(
            "aria-label",
            `Open letter ${letter}`
        );

        button.addEventListener("click", () => {
            openLetter(letter);
        });

        letterTabs.appendChild(button);
    });
}

function updateActiveTab() {
    const tabs =
        document.querySelectorAll(".letter-tab");

    tabs.forEach((tab) => {
        const isActive =
            tab.dataset.letter === currentLetter;

        tab.classList.toggle(
            "active",
            isActive
        );

        tab.setAttribute(
            "aria-current",
            isActive ? "page" : "false"
        );
    });
}

function openLetter(letter) {
    if (!alphabet.includes(letter)) {
        return;
    }

    saveCurrentLetter();

    currentLetter = letter;
    currentLetterHeading.textContent = letter;
    editor.innerHTML = loadLetter(letter);

    updateActiveTab();
}

/* =====================================================
   OPEN THE BOOK
   ===================================================== */

function finishOpeningBook() {
    coverScreen.classList.add("hidden");
    coverScreen.classList.remove("opening");

    openLetter(currentLetter);
    editor.focus();

    openBookButton.disabled = false;
}

function openBook() {
    openBookButton.disabled = true;

    /*
    Display the cream page underneath the cover.
    */
    bookScreen.classList.remove("hidden");

    /*
    Force the browser to lay out the revealed page immediately.
    This removes the hesitation caused by two animation frames.
    */
    void bookScreen.offsetWidth;

    /*
    Start the hinged cover animation immediately.
    */
    coverScreen.classList.add("opening");

    /*
    Use the real animation ending rather than relying only
    on a timer. This makes the transition feel smoother.
    */
    const cover = coverScreen.querySelector(".cover");

    cover.addEventListener(
        "animationend",
        finishOpeningBook,
        { once: true }
    );

    /*
    Backup in case a browser does not report animationend.
    */
    window.setTimeout(() => {
        if (!coverScreen.classList.contains("hidden")) {
            finishOpeningBook();
        }
    }, 1200);
}

/* =====================================================
   EVENTS
   ===================================================== */

openBookButton.addEventListener(
    "click",
    openBook
);

editor.addEventListener(
    "input",
    scheduleSave
);

window.addEventListener(
    "beforeunload",
    saveCurrentLetter
);

document.addEventListener(
    "visibilitychange",
    () => {
        if (document.hidden) {
            saveCurrentLetter();
        }
    }
);

/* =====================================================
   START THE APP
   ===================================================== */

createLetterTabs();
openLetter(currentLetter);