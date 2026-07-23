/* =====================================================
   Grandma's Alphabet Book
   Version 2.0.0
   ===================================================== */

const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const coverScreen = document.getElementById("cover-screen");
const bookScreen = document.getElementById("book-screen");
const openBookButton = document.getElementById("open-book");
const letterTabs = document.getElementById("letter-tabs");
const currentLetterHeading = document.getElementById("current-letter");
const editor = document.getElementById("editor");

let currentLetter = "A";

const savedNotes = JSON.parse(
    localStorage.getItem("grandmasAlphabetBookV2") || "{}"
);

letters.forEach((letter) => {
    if (savedNotes[letter] === undefined) {
        savedNotes[letter] = "";
    }
});

function saveNotes() {
    savedNotes[currentLetter] = editor.innerHTML;

    localStorage.setItem(
        "grandmasAlphabetBookV2",
        JSON.stringify(savedNotes)
    );
}

function openLetter(letter) {
    saveNotes();

    currentLetter = letter;
    currentLetterHeading.textContent = letter;
    editor.innerHTML = savedNotes[letter] || "";

    document.querySelectorAll(".letter-tab").forEach((button) => {
        button.classList.toggle(
            "active",
            button.dataset.letter === letter
        );
    });

    editor.focus();
}

function createLetterTabs() {
    letters.forEach((letter) => {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "letter-tab";
        button.dataset.letter = letter;
        button.textContent = letter;

        button.addEventListener("click", () => {
            openLetter(letter);
        });

        letterTabs.appendChild(button);
    });
}

oopenBookButton.addEventListener("click", () => {
    openBookButton.disabled = true;

    bookScreen.classList.remove("hidden");
    coverScreen.classList.add("opening");

    window.setTimeout(() => {
        coverScreen.classList.add("hidden");
        coverScreen.classList.remove("opening");
        openLetter(currentLetter);
        openBookButton.disabled = false;
    }, 800);
});

editor.addEventListener("input", saveNotes);

window.addEventListener("beforeunload", saveNotes);

createLetterTabs();
openLetter("A");