/* =====================================================
   Grandma's Alphabet Book
   Version 2.4.0 — Vintage Rich Text
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

/* =====================================================
   FORMATTING TOOLBAR ELEMENTS
   ===================================================== */

const formatToolbar =
    document.getElementById("format-toolbar");

const boldButton =
    document.getElementById("bold-button");

const italicButton =
    document.getElementById("italic-button");

const sizeButton =
    document.getElementById("size-button");

const colorButton =
    document.getElementById("color-button");

const sizeMenu =
    document.getElementById("size-menu");

const colorMenu =
    document.getElementById("color-menu");

const currentColorLine =
    document.getElementById("current-color-line");

let currentLetter = "A";
let saveTimer = null;
let savedSelection = null;

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
    hideFormattingToolbar();

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
    currentLetter = "A";

    coverScreen.classList.add("hidden");
    bookScreen.classList.remove("hidden");

    openLetter("A");
}

/* =====================================================
   SELECTION HELPERS
   ===================================================== */

function selectionIsInsideEditor() {
    const selection =
        window.getSelection();

    if (
        !selection ||
        selection.rangeCount === 0 ||
        selection.isCollapsed
    ) {
        return false;
    }

    const range =
        selection.getRangeAt(0);

    const commonContainer =
        range.commonAncestorContainer;

    const element =
        commonContainer.nodeType ===
        Node.ELEMENT_NODE
            ? commonContainer
            : commonContainer.parentElement;

    return (
        element &&
        editor.contains(element)
    );
}

function saveSelection() {
    const selection =
        window.getSelection();

    if (
        !selection ||
        selection.rangeCount === 0
    ) {
        return;
    }

    const range =
        selection.getRangeAt(0);

    const commonContainer =
        range.commonAncestorContainer;

    const element =
        commonContainer.nodeType ===
        Node.ELEMENT_NODE
            ? commonContainer
            : commonContainer.parentElement;

    if (
        element &&
        editor.contains(element)
    ) {
        savedSelection =
            range.cloneRange();
    }
}

function restoreSelection() {
    if (!savedSelection) {
        return false;
    }

    const selection =
        window.getSelection();

    selection.removeAllRanges();
    selection.addRange(savedSelection);

    return true;
}

/* =====================================================
   TOOLBAR DISPLAY
   ===================================================== */

function positionFormattingToolbar() {
    const selection =
        window.getSelection();

    if (
        !selection ||
        selection.rangeCount === 0
    ) {
        return;
    }

    const range =
        selection.getRangeAt(0);

    let rectangle =
        range.getBoundingClientRect();

    if (
        rectangle.width === 0 &&
        rectangle.height === 0
    ) {
        const rectangles =
            range.getClientRects();

        if (rectangles.length > 0) {
            rectangle =
                rectangles[0];
        }
    }

    const toolbarWidth =
        formatToolbar.offsetWidth || 160;

    const screenPadding = 12;

    let left =
        rectangle.left +
        rectangle.width / 2;

    const minimumLeft =
        screenPadding +
        toolbarWidth / 2;

    const maximumLeft =
        window.innerWidth -
        screenPadding -
        toolbarWidth / 2;

    left =
        Math.max(
            minimumLeft,
            Math.min(left, maximumLeft)
        );

    let top =
        rectangle.top - 10;

    if (top < 65) {
        top =
            rectangle.bottom + 58;
    }

    formatToolbar.style.left =
        `${left}px`;

    formatToolbar.style.top =
        `${top}px`;
}

function showFormattingToolbar() {
    if (!selectionIsInsideEditor()) {
        hideFormattingToolbar();
        return;
    }

    saveSelection();

    formatToolbar.classList.remove(
        "hidden"
    );

    updateFormattingButtonStates();

    window.requestAnimationFrame(() => {
        positionFormattingToolbar();
    });
}

function hideFormattingMenus() {
    sizeMenu.classList.add("hidden");
    colorMenu.classList.add("hidden");

    sizeButton.setAttribute(
        "aria-expanded",
        "false"
    );

    colorButton.setAttribute(
        "aria-expanded",
        "false"
    );
}

function hideFormattingToolbar() {
    formatToolbar.classList.add("hidden");
    hideFormattingMenus();
}

/* =====================================================
   FORMAT COMMANDS
   ===================================================== */

function prepareFormattingCommand() {
    editor.focus({
        preventScroll: true
    });

    return restoreSelection();
}

function runFormattingCommand(
    command,
    value = null
) {
    if (!prepareFormattingCommand()) {
        return;
    }

    document.execCommand(
        command,
        false,
        value
    );

    saveSelection();
    saveCurrentLetter();
    updateFormattingButtonStates();

    window.requestAnimationFrame(() => {
        positionFormattingToolbar();
    });
}

function updateFormattingButtonStates() {
    try {
        boldButton.classList.toggle(
            "active",
            document.queryCommandState(
                "bold"
            )
        );

        italicButton.classList.toggle(
            "active",
            document.queryCommandState(
                "italic"
            )
        );
    } catch (error) {
        boldButton.classList.remove(
            "active"
        );

        italicButton.classList.remove(
            "active"
        );
    }
}

/* =====================================================
   BOLD AND ITALIC
   ===================================================== */

boldButton.addEventListener(
    "pointerdown",
    (event) => {
        event.preventDefault();

        runFormattingCommand("bold");
    }
);

italicButton.addEventListener(
    "pointerdown",
    (event) => {
        event.preventDefault();

        runFormattingCommand("italic");
    }
);

/* =====================================================
   TEXT SIZE MENU
   ===================================================== */

sizeButton.addEventListener(
    "pointerdown",
    (event) => {
        event.preventDefault();

        saveSelection();

        colorMenu.classList.add("hidden");

        const menuIsHidden =
            sizeMenu.classList.contains(
                "hidden"
            );

        sizeMenu.classList.toggle(
            "hidden",
            !menuIsHidden
        );

        sizeButton.setAttribute(
            "aria-expanded",
            String(menuIsHidden)
        );

        colorButton.setAttribute(
            "aria-expanded",
            "false"
        );
    }
);

sizeMenu
    .querySelectorAll(
        "button[data-size]"
    )
    .forEach((button) => {
        button.addEventListener(
            "pointerdown",
            (event) => {
                event.preventDefault();

                const size =
                    button.dataset.size;

                runFormattingCommand(
                    "fontSize",
                    size
                );

                hideFormattingMenus();
            }
        );
    });

/* =====================================================
   TEXT COLOR MENU
   ===================================================== */

colorButton.addEventListener(
    "pointerdown",
    (event) => {
        event.preventDefault();

        saveSelection();

        sizeMenu.classList.add("hidden");

        const menuIsHidden =
            colorMenu.classList.contains(
                "hidden"
            );

        colorMenu.classList.toggle(
            "hidden",
            !menuIsHidden
        );

        colorButton.setAttribute(
            "aria-expanded",
            String(menuIsHidden)
        );

        sizeButton.setAttribute(
            "aria-expanded",
            "false"
        );
    }
);

colorMenu
    .querySelectorAll(
        "button[data-color]"
    )
    .forEach((button) => {
        button.addEventListener(
            "pointerdown",
            (event) => {
                event.preventDefault();

                const color =
                    button.dataset.color;

                runFormattingCommand(
                    "foreColor",
                    color
                );

                currentColorLine.style
                    .backgroundColor =
                    color;

                hideFormattingMenus();
            }
        );
    });

/* =====================================================
   SELECTION EVENTS
   ===================================================== */

document.addEventListener(
    "selectionchange",
    () => {
        if (
            bookScreen.classList.contains(
                "hidden"
            )
        ) {
            return;
        }

        window.requestAnimationFrame(() => {
            if (
                selectionIsInsideEditor()
            ) {
                showFormattingToolbar();
            } else if (
                !formatToolbar.contains(
                    document.activeElement
                )
            ) {
                hideFormattingToolbar();
            }
        });
    }
);

editor.addEventListener(
    "mouseup",
    () => {
        window.setTimeout(() => {
            if (
                selectionIsInsideEditor()
            ) {
                showFormattingToolbar();
            }
        }, 10);
    }
);

editor.addEventListener(
    "keyup",
    () => {
        if (
            selectionIsInsideEditor()
        ) {
            showFormattingToolbar();
        }
    }
);

editor.addEventListener(
    "touchend",
    () => {
        window.setTimeout(() => {
            if (
                selectionIsInsideEditor()
            ) {
                showFormattingToolbar();
            }
        }, 250);
    }
);

/* =====================================================
   CLOSE TOOLBAR WHEN TAPPING ELSEWHERE
   ===================================================== */

document.addEventListener(
    "pointerdown",
    (event) => {
        const clickedEditor =
            editor.contains(event.target);

        const clickedToolbar =
            formatToolbar.contains(
                event.target
            );

        if (
            !clickedEditor &&
            !clickedToolbar
        ) {
            hideFormattingToolbar();
        }
    }
);

window.addEventListener(
    "resize",
    () => {
        if (
            !formatToolbar.classList
                .contains("hidden")
        ) {
            positionFormattingToolbar();
        }
    }
);

window.addEventListener(
    "scroll",
    () => {
        if (
            !formatToolbar.classList
                .contains("hidden")
        ) {
            positionFormattingToolbar();
        }
    },
    true
);

/* =====================================================
   EDITOR EVENTS
   ===================================================== */

editor.addEventListener(
    "input",
    () => {
        scheduleSave();
        saveSelection();
    }
);

editor.addEventListener(
    "paste",
    (event) => {
        event.preventDefault();

        const plainText =
            event.clipboardData.getData(
                "text/plain"
            );

        document.execCommand(
            "insertText",
            false,
            plainText
        );

        scheduleSave();
    }
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
   SERVICE WORKER
   ===================================================== */

if ("serviceWorker" in navigator) {
    window.addEventListener(
        "load",
        () => {
            navigator.serviceWorker
                .register(
                    "service-worker.js"
                )
                .catch((error) => {
                    console.error(
                        "Service worker registration failed:",
                        error
                    );
                });
        }
    );
}

/* =====================================================
   START THE APP
   ===================================================== */

createLetterTabs();
openLetter("A");