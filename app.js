/* =====================================================
   Grandma's Alphabet Book
   Version 2.2.0
   ===================================================== */

"use strict";

const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const coverScreen =
    document.getElementById("cover-screen");

const bookScreen =
    document.getElementById("book-screen");

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
   ALPHABET TABS
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

        if (isActive) {
            tab.setAttribute(
                "aria-current",
                "page"
            );
        } else {
            tab.removeAttribute(
                "aria-current"
            );
        }
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

function openBook() {
    /*
    Always begin on page A.
    */

    currentLetter = "A";

    coverScreen.classList.add("hidden");
    bookScreen.classList.remove("hidden");

    openLetter("A");

    /*
    Do not automatically open the keyboard on phones.
    The user can tap the writing area when ready.
    */
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
openLetter("A");