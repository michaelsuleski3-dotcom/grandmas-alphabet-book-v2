/* =====================================================
   Grandma's Alphabet Book
   Version 2.1.2
   ===================================================== */

"use strict";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const coverScreen = document.getElementById("cover-screen");
const bookScreen = document.getElementById("book-screen");
const openBookButton = document.getElementById("open-book");
const letterTabs = document.getElementById("letter-tabs");
const currentLetterHeading = document.getElementById("current-letter");
const editor = document.getElementById("editor");

let currentLetter = "A";
let saveTimer = null;

/* ---------- Storage ---------- */

function getStorageKey(letter) {
    return `grandmas-alphabet-book-v2-${letter}`;
}

function loadLetter(letter) {
    try {
        return localStorage.getItem(getStorageKey(letter)) || "";
    } catch (error) {
        console.error("Unable to load saved information:", error);
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
        console.error("Unable to save information:", error);
    }
}

function scheduleSave() {
    window.clearTimeout(saveTimer);

    saveTimer = window.setTimeout(() => {
        saveCurrentLetter();
    }, 250);
}

/* ---------- Letter Tabs ---------- */

function createLetterTabs() {
    letterTabs.innerHTML = "";

    alphabet.forEach((letter) => {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "letter-tab";
        button.textContent = letter;
        button.dataset.letter = letter;
        button.setAttribute("aria-label", `Open letter ${letter}`);

        button.addEventListener("click", () => {
            openLetter(letter);
        });

        letterTabs.appendChild(button);
    });
}

function updateActiveTab() {
    const tabs = document.querySelectorAll(".letter-tab");

    tabs.forEach((tab) => {
        const isActive = tab.dataset.letter === currentLetter;

        tab.classList.toggle("active", isActive);
        tab.setAttribute("aria-current", isActive ? "page" : "false");
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

/* ---------- Open the Book ---------- */

function openBook() {
    openBookButton.disabled = true;

    /*
    Reveal the cream paper first so it appears behind the cover
    while the cover moves away.
    */
    bookScreen.classList.remove("hidden");

    /*
    Allow the browser to display the book screen before beginning
    the animation.
    */
    window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
            coverScreen.classList.add("opening");
        });
    });

    window.setTimeout(() => {
        coverScreen.classList.add("hidden");
        coverScreen.classList.remove("opening");

        openLetter(currentLetter);
        editor.focus();

        openBookButton.disabled = false;
    }, 650);
}

/* ---------- Events ---------- */

openBookButton.addEventListener("click", openBook);

editor.addEventListener("input", scheduleSave);

window.addEventListener("beforeunload", () => {
    saveCurrentLetter();
});

document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        saveCurrentLetter();
    }
});

/* ---------- Start the App ---------- */

createLetterTabs();
openLetter(currentLetter);