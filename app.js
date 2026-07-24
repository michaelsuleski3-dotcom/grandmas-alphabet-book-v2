/* =====================================================
   Grandma's Alphabet Book
   Version 2.1.6
   ===================================================== */

"use strict";

const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const coverScreen =
    document.getElementById("cover-screen");

const openBookButton =
    document.getElementById("open-book");

const letterTabs =
    document.getElementById("letter-tabs");

const currentLetterHeading =
    document.getElementById("current-letter");

const editor =
    document.getElementById("editor");

let currentLetter = "A";
let saveTimer = null;
let openingFinished = false;

/* =====================================================
   STORAGE
   ===================================================== */

function getStorageKey(letter) {
    return `grandmas-alphabet-book-v2-${letter}`;
}

function loadLetter(letter) {
    try {
        return (
            localStorage.getItem(
                getStorageKey(letter)
            ) || ""
        );
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
        const button =
            document.createElement("button");

        button.type = "button";
        button.className = "letter-tab";
        button.textContent = letter;
        button.dataset.letter = letter;

        button.setAttribute(
            "aria-label",
            `Open letter ${letter}`
        );

        button.addEventListener(
            "click",
            () => {
                openLetter(letter);
            }
        );

        letterTabs.appendChild(button);
    });
}

function updateActiveTab() {
    const tabs =
        document.querySelectorAll(
            ".letter-tab"
        );

    tabs.forEach((tab) => {
        const isActive =
            tab.dataset.letter ===
            currentLetter;

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

    currentLetterHeading.textContent =
        letter;

    editor.innerHTML =
        loadLetter(letter);

    updateActiveTab();
}

/* =====================================================
   OPEN THE BOOK
   ===================================================== */

function finishOpeningBook() {
    if (openingFinished) {
        return;
    }

    openingFinished = true;

    document.body.classList.remove(
        "book-opening"
    );

    document.body.classList.add(
        "book-open"
    );

    openLetter(currentLetter);
    editor.focus();

    openBookButton.disabled = false;
}

function openBook() {
    if (
        document.body.classList.contains(
            "book-opening"
        )
    ) {
        return;
    }

    openingFinished = false;
    openBookButton.disabled = true;

    /*
    Both the page and the animation appear during
    the same browser frame. This avoids the old pause.
    */

    document.body.classList.add(
        "book-opening"
    );

    const coverStage =
        document.querySelector(
            ".cover-stage"
        );

    coverStage.addEventListener(
        "animationend",
        finishOpeningBook,
        { once: true }
    );

    /*
    Backup for browsers that fail to report
    animationend.
    */

    window.setTimeout(() => {
        finishOpeningBook();
    }, 1350);
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