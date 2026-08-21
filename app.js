/* =====================================================
   Grandma's Alphabet Book
   Version 2.6.3
   ===================================================== */

"use strict";

/* =====================================================
   APP SETTINGS
   ===================================================== */

const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const STORAGE_PREFIX =
    "grandmas-alphabet-book-v2-";

const LAST_LETTER_KEY =
    "grandmas-alphabet-book-last-letter";

const DATABASE_NAME =
    "grandmas-alphabet-book-assets";

const DATABASE_VERSION = 1;

const ASSET_STORE =
    "assets";

/* =====================================================
   MAIN ELEMENTS
   ===================================================== */

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

const saveStatus =
    document.getElementById("save-status");

/* =====================================================
   HEADER BUTTONS
   ===================================================== */

const searchButton =
    document.getElementById("search-button");

const exportPdfButton =
    document.getElementById(
        "export-pdf-button"
    );

const backupButton =
    document.getElementById(
        "backup-button"
    );

/* =====================================================
   TOOLBAR ELEMENTS
   ===================================================== */

const formatToolbar =
    document.getElementById(
        "format-toolbar"
    );

const undoButton =
    document.getElementById("undo-button");

const redoButton =
    document.getElementById("redo-button");

const boldButton =
    document.getElementById("bold-button");

const sizeButton =
    document.getElementById("size-button");

const linkButton =
    document.getElementById("link-button");

const photoButton =
    document.getElementById(
        "photo-button"
    );

const sizeMenu =
    document.getElementById("size-menu");

/* =====================================================
   FILE INPUTS
   ===================================================== */

const photoInput =
    document.getElementById("photo-input");

const attachmentInput =
    document.getElementById(
        "attachment-input"
    );

const restoreInput =
    document.getElementById(
        "restore-input"
    );

/* =====================================================
   SEARCH WINDOW
   ===================================================== */

const searchModal =
    document.getElementById(
        "search-modal"
    );

const closeSearchButton =
    document.getElementById(
        "close-search-button"
    );

const searchInput =
    document.getElementById(
        "search-input"
    );

const searchResults =
    document.getElementById(
        "search-results"
    );

/* =====================================================
   BACKUP WINDOW
   ===================================================== */

const backupModal =
    document.getElementById(
        "backup-modal"
    );

const closeBackupButton =
    document.getElementById(
        "close-backup-button"
    );

const downloadBackupButton =
    document.getElementById(
        "download-backup-button"
    );

const restoreBackupButton =
    document.getElementById(
        "restore-backup-button"
    );

/* =====================================================
   RESTORE CONFIRMATION WINDOW
   ===================================================== */

const confirmModal =
    document.getElementById(
        "confirm-modal"
    );

const confirmCancelButton =
    document.getElementById(
        "confirm-cancel-button"
    );

const confirmRestoreButton =
    document.getElementById(
        "confirm-restore-button"
    );

/* =====================================================
   APP STATE
   ===================================================== */

let currentLetter = "A";

let saveTimer = null;

let saveStatusTimer = null;

let savedSelection = null;

let pendingBackup = null;

let databasePromise = null;

const activeObjectUrls =
    new Map();

/* =====================================================
   GENERAL HELPERS
   ===================================================== */

function createUniqueId(prefix = "item") {
    const randomPart =
        Math.random()
            .toString(36)
            .slice(2, 10);

    return (
        `${prefix}-${Date.now()}-` +
        randomPart
    );
}

function getStorageKey(letter) {
    return `${STORAGE_PREFIX}${letter}`;
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatFileSize(bytes) {
    if (!Number.isFinite(bytes)) {
        return "";
    }

    if (bytes < 1024) {
        return `${bytes} bytes`;
    }

    const kilobytes =
        bytes / 1024;

    if (kilobytes < 1024) {
        return `${kilobytes.toFixed(1)} KB`;
    }

    const megabytes =
        kilobytes / 1024;

    return `${megabytes.toFixed(1)} MB`;
}

function showSaveStatus(
    message,
    statusClass = ""
) {
    window.clearTimeout(
        saveStatusTimer
    );

    if (!saveStatus) {
        return;
    }

    saveStatus.textContent = message;

    saveStatus.className =
        "save-status visible";

    if (statusClass) {
        saveStatus.classList.add(
            statusClass
        );
    }

    saveStatusTimer =
        window.setTimeout(() => {
            saveStatus.classList.remove(
                "visible"
            );
        }, 1400);
}

function closeAllFormattingMenus() {
    sizeMenu?.classList.add("hidden");
}

function closeAllModals() {
    searchModal?.classList.add("hidden");
    backupModal?.classList.add("hidden");
    confirmModal?.classList.add("hidden");
}

/* =====================================================
   PAGE STORAGE
   ===================================================== */

function loadLetter(letter) {
    try {
        return (
            localStorage.getItem(
                getStorageKey(letter)
            ) || ""
        );
    } catch (error) {
        console.error(
            "Unable to load page:",
            error
        );

        return "";
    }
}

function prepareEditorHtmlForStorage() {
    const copy =
        editor.cloneNode(true);

    copy.querySelectorAll(
        "img[data-asset-id]"
    ).forEach((image) => {
        image.removeAttribute("src");
    });

    copy.querySelectorAll(
        ".attachment-card[data-asset-id]"
    ).forEach((attachment) => {
        attachment.removeAttribute("href");
    });

    copy.querySelectorAll(
        'input[type="checkbox"]'
    ).forEach((checkbox) => {
        if (checkbox.checked) {
            checkbox.setAttribute(
                "checked",
                ""
            );
        } else {
            checkbox.removeAttribute(
                "checked"
            );
        }
    });

    copy.querySelectorAll(
        ".highlight-cursor-marker"
    ).forEach((marker) => {
        marker.classList.remove(
            "highlight-cursor-marker"
        );

        marker.innerHTML =
            marker.innerHTML.replace(
                /\u200B/g,
                ""
            );

        if (
            marker.textContent === "" &&
            marker.children.length === 0
        ) {
            marker.remove();
        }
    });

    return copy.innerHTML;
}

function saveCurrentLetter() {
    if (!editor) {
        return;
    }

    try {
        localStorage.setItem(
            getStorageKey(currentLetter),
            prepareEditorHtmlForStorage()
        );

        showSaveStatus("Saved");
    } catch (error) {
        console.error(
            "Unable to save page:",
            error
        );

        showSaveStatus(
            "Unable to save",
            "error"
        );
    }
}

function scheduleSave() {
    window.clearTimeout(saveTimer);

    showSaveStatus(
        "Saving...",
        "saving"
    );

    saveTimer =
        window.setTimeout(() => {
            saveCurrentLetter();
        }, 350);
}

/* =====================================================
   INDEXEDDB FILE STORAGE
   ===================================================== */

function openDatabase() {
    if (databasePromise) {
        return databasePromise;
    }

    databasePromise =
        new Promise(
            (resolve, reject) => {
                const request =
                    indexedDB.open(
                        DATABASE_NAME,
                        DATABASE_VERSION
                    );

                request.onupgradeneeded =
                    () => {
                        const database =
                            request.result;

                        if (
                            !database
                                .objectStoreNames
                                .contains(
                                    ASSET_STORE
                                )
                        ) {
                            database.createObjectStore(
                                ASSET_STORE,
                                {
                                    keyPath: "id"
                                }
                            );
                        }
                    };

                request.onsuccess =
                    () => {
                        resolve(
                            request.result
                        );
                    };

                request.onerror =
                    () => {
                        reject(
                            request.error
                        );
                    };
            }
        );

    return databasePromise;
}

async function saveAsset(asset) {
    const database =
        await openDatabase();

    return new Promise(
        (resolve, reject) => {
            const transaction =
                database.transaction(
                    ASSET_STORE,
                    "readwrite"
                );

            const store =
                transaction.objectStore(
                    ASSET_STORE
                );

            store.put(asset);

            transaction.oncomplete =
                () => resolve(asset);

            transaction.onerror =
                () => reject(
                    transaction.error
                );
        }
    );
}

async function getAsset(assetId) {
    const database =
        await openDatabase();

    return new Promise(
        (resolve, reject) => {
            const transaction =
                database.transaction(
                    ASSET_STORE,
                    "readonly"
                );

            const store =
                transaction.objectStore(
                    ASSET_STORE
                );

            const request =
                store.get(assetId);

            request.onsuccess =
                () => {
                    resolve(
                        request.result ||
                        null
                    );
                };

            request.onerror =
                () => {
                    reject(
                        request.error
                    );
                };
        }
    );
}

async function getAllAssets() {
    const database =
        await openDatabase();

    return new Promise(
        (resolve, reject) => {
            const transaction =
                database.transaction(
                    ASSET_STORE,
                    "readonly"
                );

            const store =
                transaction.objectStore(
                    ASSET_STORE
                );

            const request =
                store.getAll();

            request.onsuccess =
                () => {
                    resolve(
                        request.result || []
                    );
                };

            request.onerror =
                () => {
                    reject(
                        request.error
                    );
                };
        }
    );
}

async function clearAllAssets() {
    const database =
        await openDatabase();

    return new Promise(
        (resolve, reject) => {
            const transaction =
                database.transaction(
                    ASSET_STORE,
                    "readwrite"
                );

            const store =
                transaction.objectStore(
                    ASSET_STORE
                );

            store.clear();

            transaction.oncomplete =
                () => resolve();

            transaction.onerror =
                () => reject(
                    transaction.error
                );
        }
    );
}

/* =====================================================
   OBJECT URL MANAGEMENT
   ===================================================== */

function releaseObjectUrls() {
    activeObjectUrls.forEach(
        (url) => {
            URL.revokeObjectURL(url);
        }
    );

    activeObjectUrls.clear();
}

function getAssetObjectUrl(asset) {
    if (
        activeObjectUrls.has(asset.id)
    ) {
        return activeObjectUrls.get(
            asset.id
        );
    }

    const objectUrl =
        URL.createObjectURL(asset.blob);

    activeObjectUrls.set(
        asset.id,
        objectUrl
    );

    return objectUrl;
}

async function hydrateEditorAssets() {
    const images =
        editor.querySelectorAll(
            "img[data-asset-id]"
        );

    for (const image of images) {
        const assetId =
            image.dataset.assetId;

        try {
            const asset =
                await getAsset(assetId);

            if (asset) {
                image.src =
                    getAssetObjectUrl(
                        asset
                    );

                image.alt =
                    asset.name ||
                    "Inserted photograph";
            }
        } catch (error) {
            console.error(
                "Unable to load photograph:",
                error
            );
        }
    }

    const attachments =
        editor.querySelectorAll(
            ".attachment-card[data-asset-id]"
        );

    for (
        const attachment
        of attachments
    ) {
        const assetId =
            attachment.dataset.assetId;

        try {
            const asset =
                await getAsset(assetId);

            if (asset) {
                attachment.href =
                    getAssetObjectUrl(
                        asset
                    );

                attachment.download =
                    asset.name ||
                    "attachment";
            }
        } catch (error) {
            console.error(
                "Unable to load attachment:",
                error
            );
        }
    }
}

/* =====================================================
   ALPHABET TABS
   ===================================================== */

function createLetterTabs() {
    letterTabs.innerHTML = "";

    alphabet.forEach((letter) => {
        const button =
            document.createElement(
                "button"
            );

        button.type = "button";

        button.className =
            "letter-tab";

        button.textContent = letter;

        button.dataset.letter =
            letter;

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

        letterTabs.appendChild(
            button
        );
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

async function displayLetter(letter) {
    currentLetter = letter;

    try {
        localStorage.setItem(
            LAST_LETTER_KEY,
            letter
        );
    } catch (error) {
        console.warn(
            "Unable to remember the current letter:",
            error
        );
    }

    currentLetterHeading.textContent =
        letter;

    editor.innerHTML =
        loadLetter(letter);

    savedSelection = null;

    updateActiveTab();

    releaseObjectUrls();

    await hydrateEditorAssets();
}

async function openLetter(letter) {
    if (!alphabet.includes(letter)) {
        return;
    }

    window.clearTimeout(saveTimer);

    saveCurrentLetter();

    closeAllFormattingMenus();

    await displayLetter(letter);
}

/* =====================================================
   OPEN THE BOOK
   ===================================================== */

async function openBook() {
    coverScreen.classList.add(
        "hidden"
    );

    bookScreen.classList.remove(
        "hidden"
    );

    let startingLetter = "A";

    try {
        const rememberedLetter =
            localStorage.getItem(
                LAST_LETTER_KEY
            );

        if (
            alphabet.includes(
                rememberedLetter
            )
        ) {
            startingLetter =
                rememberedLetter;
        }
    } catch (error) {
        console.warn(
            "Unable to load the last page:",
            error
        );
    }

    await displayLetter(
        startingLetter
    );
}

/* =====================================================
   TEXT SELECTION
   ===================================================== */

function selectionIsInsideEditor() {
    const selection =
        window.getSelection();

    if (
        !selection ||
        selection.rangeCount === 0
    ) {
        return false;
    }

    const range =
        selection.getRangeAt(0);

    const commonAncestor =
        range.commonAncestorContainer;

    const element =
        commonAncestor.nodeType ===
        Node.ELEMENT_NODE
            ? commonAncestor
            : commonAncestor.parentElement;

    return (
        element === editor ||
        editor.contains(element)
    );
}

function selectionContainsWords() {
    const selection =
        window.getSelection();

    return Boolean(
        selection &&
        selection.rangeCount > 0 &&
        !selection.isCollapsed &&
        selection.toString().trim() !== "" &&
        selectionIsInsideEditor()
    );
}

function saveSelection() {
    const selection =
        window.getSelection();

    if (
        !selection ||
        selection.rangeCount === 0 ||
        !selectionIsInsideEditor()
    ) {
        return;
    }

    savedSelection =
        selection.getRangeAt(0)
            .cloneRange();
}

function restoreSelection() {
    if (!savedSelection) {
        editor.focus();

        return false;
    }

    try {
        const selection =
            window.getSelection();

        if (!selection) {
            return false;
        }

        selection.removeAllRanges();

        selection.addRange(
            savedSelection
        );

        return true;
    } catch (error) {
        savedSelection = null;

        editor.focus();

        return false;
    }
}

function clearBrowserSelection() {
    const selection =
        window.getSelection();

    if (selection) {
        selection.removeAllRanges();
    }
}

function getSelectedRange() {
    if (!restoreSelection()) {
        return null;
    }

    const selection =
        window.getSelection();

    if (
        !selection ||
        selection.rangeCount === 0
    ) {
        return null;
    }

    return selection.getRangeAt(0);
}

/* =====================================================
   PERMANENT TOOLBAR
   ===================================================== */

function showFormattingToolbar() {
    if (selectionIsInsideEditor()) {
        saveSelection();
        updateToolbarState();
    }
}

function hideFormattingToolbar() {
    // Toolbar stays visible.
    // Only temporary menus are closed.
    closeAllFormattingMenus();
}

function finishToolbarAction() {
    savedSelection = null;

    closeAllFormattingMenus();

    clearBrowserSelection();
}

function positionFormattingToolbar() {
    // Positioning is handled by CSS.
}

function updateToolbarState() {
    try {
        boldButton?.classList.toggle(
            "active",
            document.queryCommandState(
                "bold"
            )
        );

        if (undoButton) {
            undoButton.disabled =
                !document
                    .queryCommandEnabled(
                        "undo"
                    );
        }

        if (redoButton) {
            redoButton.disabled =
                !document
                    .queryCommandEnabled(
                        "redo"
                    );
        }
    } catch (error) {
        if (undoButton) {
            undoButton.disabled = false;
        }

        if (redoButton) {
            redoButton.disabled = false;
        }
    }
}

function runEditorCommand(
    command,
    value = null
) {
    if (
        command === "undo" ||
        command === "redo"
    ) {
        editor.focus();

        try {
            document.execCommand(
                command,
                false,
                value
            );
        } catch (error) {
            console.error(
                `Unable to run ${command}:`,
                error
            );
        }

        scheduleSave();

        updateToolbarState();

        return;
    }

    const restored =
        restoreSelection();

    if (!restored) {
        window.alert(
            "Select the words you want to change first."
        );

        return;
    }

    editor.focus();

    try {
        document.execCommand(
            command,
            false,
            value
        );
    } catch (error) {
        console.error(
            `Unable to run ${command}:`,
            error
        );
    }

    scheduleSave();

    finishToolbarAction();

    editor.focus();
}

/* =====================================================
   SIZE MENU
   ===================================================== */

function positionMenu(menu, button) {
    if (!menu || !button) {
        return;
    }

    const buttonRectangle =
        button.getBoundingClientRect();

    menu.classList.remove("hidden");

    const menuWidth =
        menu.offsetWidth;

    const menuHeight =
        menu.offsetHeight;

    let left =
        buttonRectangle.left;

    let top =
        buttonRectangle.bottom + 7;

    if (
        left + menuWidth >
        window.innerWidth - 8
    ) {
        left =
            window.innerWidth -
            menuWidth -
            8;
    }

    if (
        top + menuHeight >
        window.innerHeight - 8
    ) {
        top =
            buttonRectangle.top -
            menuHeight -
            7;
    }

    menu.style.left =
        `${Math.max(8, left)}px`;

    menu.style.top =
        `${Math.max(8, top)}px`;

    menu.style.bottom =
        "auto";

    menu.style.transform =
        "none";
}

function toggleSizeMenu() {
    if (!sizeMenu) {
        return;
    }

    if (!savedSelection) {
        window.alert(
            "Select the words you want to resize first."
        );

        return;
    }

    const shouldOpen =
        sizeMenu.classList.contains(
            "hidden"
        );

    closeAllFormattingMenus();

    if (shouldOpen) {
        positionMenu(
            sizeMenu,
            sizeButton
        );
    }
}

function applyFontSize(fontSize) {
    const range =
        getSelectedRange();

    if (
        !range ||
        range.collapsed
    ) {
        window.alert(
            "Select the words you want to resize first."
        );

        return;
    }

    const wrapper =
        document.createElement(
            "span"
        );

    wrapper.style.fontSize =
        fontSize;

    try {
        range.surroundContents(
            wrapper
        );
    } catch (error) {
        const fragment =
            range.extractContents();

        wrapper.appendChild(
            fragment
        );

        range.insertNode(
            wrapper
        );
    }

    scheduleSave();

    finishToolbarAction();

    editor.focus();
}

/* =====================================================
   WEB LINKS
   ===================================================== */

function normalizeWebAddress(address) {
    const trimmed =
        String(address || "").trim();

    if (!trimmed) {
        return "";
    }

    if (
        /^https?:\/\//i.test(
            trimmed
        )
    ) {
        return trimmed;
    }

    return `https://${trimmed}`;
}

function addWebLink() {
    const range =
        getSelectedRange();

    if (
        !range ||
        range.collapsed
    ) {
        window.alert(
            "Select the words you want to turn into a link first."
        );

        return;
    }

    const address =
        window.prompt(
            "Paste the web address:"
        );

    const href =
        normalizeWebAddress(
            address
        );

    if (!href) {
        restoreSelection();

        return;
    }

    const link =
        document.createElement("a");

    link.href = href;

    link.target = "_blank";

    link.rel =
        "noopener noreferrer";

    try {
        range.surroundContents(
            link
        );
    } catch (error) {
        const fragment =
            range.extractContents();

        link.appendChild(
            fragment
        );

        range.insertNode(
            link
        );
    }

    scheduleSave();

    finishToolbarAction();

    editor.focus();
}

/* =====================================================
   CURSOR PLACEMENT
   ===================================================== */

function placeCursorAfter(element) {
    const selection =
        window.getSelection();

    const range =
        document.createRange();

    range.setStartAfter(element);

    range.collapse(true);

    selection.removeAllRanges();

    selection.addRange(range);
}

function placeCursorInsideEnd(element) {
    const selection =
        window.getSelection();

    const range =
        document.createRange();

    range.selectNodeContents(
        element
    );

    range.collapse(false);

    selection.removeAllRanges();

    selection.addRange(range);
}

function insertNodeAtSelection(node) {
    editor.focus();

    const selection =
        window.getSelection();

    if (
        savedSelection &&
        restoreSelection()
    ) {
        const range =
            selection.getRangeAt(0);

        range.deleteContents();

        range.insertNode(node);

        placeCursorAfter(node);

        return;
    }

    if (
        selection &&
        selection.rangeCount > 0 &&
        selectionIsInsideEditor()
    ) {
        const range =
            selection.getRangeAt(0);

        range.deleteContents();

        range.insertNode(node);

        placeCursorAfter(node);

        return;
    }

    editor.appendChild(node);

    placeCursorAfter(node);
}

/* =====================================================
   CHECKLIST SUPPORT FOR EXISTING SAVED CONTENT
   ===================================================== */

function createChecklistItem(
    text = "",
    checked = false
) {
    const item =
        document.createElement(
            "div"
        );

    item.className =
        "checklist-item";

    const checkbox =
        document.createElement(
            "input"
        );

    checkbox.type =
        "checkbox";

    checkbox.checked =
        checked;

    checkbox.setAttribute(
        "aria-label",
        "Checklist item"
    );

    const itemText =
        document.createElement(
            "span"
        );

    itemText.className =
        "checklist-text";

    itemText.contentEditable =
        "true";

    itemText.textContent =
        text;

    item.append(
        checkbox,
        itemText
    );

    return item;
}

function updateChecklistItem(
    checkbox
) {
    if (
        !checkbox ||
        checkbox.type !==
        "checkbox"
    ) {
        return;
    }

    const item =
        checkbox.closest(
            ".checklist-item"
        );

    if (!item) {
        return;
    }

    item.classList.toggle(
        "completed",
        checkbox.checked
    );

    if (checkbox.checked) {
        checkbox.setAttribute(
            "checked",
            ""
        );
    } else {
        checkbox.removeAttribute(
            "checked"
        );
    }

    scheduleSave();
}

/* =====================================================
   PHOTO INSERTION
   ===================================================== */

async function handlePhotoSelection(
    event
) {
    const files =
        Array.from(
            event.target.files || []
        );

    event.target.value = "";

    if (files.length === 0) {
        return;
    }

    for (const file of files) {
        if (
            !file.type.startsWith(
                "image/"
            )
        ) {
            continue;
        }

        const assetId =
            createUniqueId(
                "photo"
            );

        const asset = {
            id: assetId,

            name:
                file.name ||
                "Photograph",

            type:
                file.type ||
                "image/jpeg",

            size: file.size,

            kind: "photo",

            createdAt:
                new Date()
                    .toISOString(),

            blob: file
        };

        try {
            await saveAsset(asset);

            const figure =
                document.createElement(
                    "figure"
                );

            figure.className =
                "editor-photo";

            figure.contentEditable =
                "false";

            const image =
                document.createElement(
                    "img"
                );

            image.dataset.assetId =
                assetId;

            image.alt =
                asset.name;

            image.src =
                getAssetObjectUrl(
                    asset
                );

            image.loading =
                "lazy";

            figure.appendChild(
                image
            );

            insertNodeAtSelection(
                figure
            );

            const paragraph =
                document.createElement(
                    "div"
                );

            paragraph.innerHTML =
                "<br>";

            figure.after(
                paragraph
            );

            placeCursorInsideEnd(
                paragraph
            );

            scheduleSave();
        } catch (error) {
            console.error(
                "Unable to save photograph:",
                error
            );

            showSaveStatus(
                "Photo could not be added",
                "error"
            );
        }
    }

    savedSelection = null;

    editor.focus();
}

/* =====================================================
   SEARCH
   ===================================================== */

function stripHtml(html) {
    const temporary =
        document.createElement("div");

    temporary.innerHTML = html;

    return (
        temporary.textContent ||
        temporary.innerText ||
        ""
    );
}

function getSearchSnippet(
    text,
    query
) {
    const normalizedText =
        text.replace(/\s+/g, " ").trim();

    const lowerText =
        normalizedText.toLowerCase();

    const lowerQuery =
        query.toLowerCase();

    const matchIndex =
        lowerText.indexOf(lowerQuery);

    if (matchIndex === -1) {
        return normalizedText.slice(
            0,
            140
        );
    }

    const start =
        Math.max(
            0,
            matchIndex - 50
        );

    const end =
        Math.min(
            normalizedText.length,
            matchIndex +
            query.length +
            90
        );

    let snippet =
        normalizedText.slice(
            start,
            end
        );

    if (start > 0) {
        snippet = `…${snippet}`;
    }

    if (
        end <
        normalizedText.length
    ) {
        snippet = `${snippet}…`;
    }

    return snippet;
}

function searchAllLetters(query) {
    const cleanQuery =
        query.trim();

    if (!cleanQuery) {
        return [];
    }

    const lowerQuery =
        cleanQuery.toLowerCase();

    const results = [];

    alphabet.forEach((letter) => {
        const html =
            loadLetter(letter);

        const text =
            stripHtml(html);

        if (
            text
                .toLowerCase()
                .includes(lowerQuery)
        ) {
            results.push({
                letter,

                snippet:
                    getSearchSnippet(
                        text,
                        cleanQuery
                    )
            });
        }
    });

    return results;
}

function renderSearchResults(
    results,
    query
) {
    searchResults.innerHTML = "";

    if (!query.trim()) {
        const message =
            document.createElement(
                "p"
            );

        message.className =
            "search-message";

        message.textContent =
            "Type a word or name to search the book.";

        searchResults.appendChild(
            message
        );

        return;
    }

    if (results.length === 0) {
        const message =
            document.createElement(
                "p"
            );

        message.className =
            "search-message";

        message.textContent =
            "No matching entries were found.";

        searchResults.appendChild(
            message
        );

        return;
    }

    results.forEach((result) => {
        const button =
            document.createElement(
                "button"
            );

        button.type = "button";

        button.className =
            "search-result";

        const letter =
            document.createElement(
                "strong"
            );

        letter.className =
            "search-result-letter";

        letter.textContent =
            result.letter;

        const snippet =
            document.createElement(
                "span"
            );

        snippet.className =
            "search-result-preview";

        snippet.textContent =
            result.snippet;

        button.append(
            letter,
            snippet
        );

        button.addEventListener(
            "click",
            async () => {
                searchModal.classList.add(
                    "hidden"
                );

                await openLetter(
                    result.letter
                );

                editor.focus();
            }
        );

        searchResults.appendChild(
            button
        );
    });
}

function openSearchModal() {
    closeAllFormattingMenus();

    searchModal.classList.remove(
        "hidden"
    );

    searchInput.value = "";

    renderSearchResults(
        [],
        ""
    );

    window.setTimeout(() => {
        searchInput.focus();
    }, 50);
}

function closeSearchModal() {
    searchModal.classList.add(
        "hidden"
    );

    searchInput.value = "";
}

/* =====================================================
   PRINTABLE BOOK
   ===================================================== */

function buildPrintableBook() {
    const printable =
        document.createElement(
            "div"
        );

    printable.className =
        "printable-book";

    const title =
        document.createElement(
            "h1"
        );

    title.textContent =
        "Grandma's Alphabet Book";

    printable.appendChild(
        title
    );

    alphabet.forEach((letter) => {
        const html =
            loadLetter(letter);

        const text =
            stripHtml(html).trim();

        if (
            text === "" &&
            !html.includes(
                "data-asset-id"
            )
        ) {
            return;
        }

        const section =
            document.createElement(
                "section"
            );

        section.className =
            "print-letter-section";

        const heading =
            document.createElement(
                "h2"
            );

        heading.textContent =
            letter;

        const content =
            document.createElement(
                "div"
            );

        content.className =
            "print-letter-content";

        content.innerHTML =
            html;

        section.append(
            heading,
            content
        );

        printable.appendChild(
            section
        );
    });

    return printable;
}

function exportBookAsPdf() {
    saveCurrentLetter();

    closeAllFormattingMenus();

    const printable =
        buildPrintableBook();

    const printWindow =
        window.open(
            "",
            "_blank"
        );

    if (!printWindow) {
        showSaveStatus(
            "Please allow pop-ups",
            "error"
        );

        return;
    }

    printWindow.document.open();

    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">

            <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0"
            >

            <title>
                Grandma's Alphabet Book
            </title>

            <style>
                body {
                    font-family:
                        Georgia,
                        "Times New Roman",
                        serif;

                    margin: 32px;

                    color: #222;

                    line-height: 1.5;
                }

                h1 {
                    text-align: center;

                    margin-bottom: 36px;
                }

                h2 {
                    font-size: 28px;

                    border-bottom:
                        2px solid #999;

                    padding-bottom: 6px;
                }

                .print-letter-section {
                    break-after: page;

                    page-break-after: always;
                }

                .print-letter-section:last-child {
                    break-after: auto;

                    page-break-after: auto;
                }

                img {
                    max-width: 100%;

                    height: auto;

                    display: block;

                    margin: 14px auto;
                }

                .attachment-card {
                    display: block;

                    margin: 8px 0;
                }

                .yellow-highlight {
                    background: #fff59d;
                }

                .checklist-item {
                    display: flex;

                    align-items: flex-start;

                    gap: 8px;

                    margin: 5px 0;
                }

                .checklist-item.completed
                .checklist-text {
                    text-decoration:
                        line-through;

                    opacity: 0.65;
                }

                a {
                    color: #000;

                    text-decoration:
                        underline;
                }

                @media print {
                    body {
                        margin: 0.5in;
                    }
                }
            </style>
        </head>

        <body>
            ${printable.innerHTML}
        </body>
        </html>
    `);

    printWindow.document.close();

    printWindow.focus();

    window.setTimeout(() => {
        printWindow.print();
    }, 400);
}

/* =====================================================
   BACKUP DATA HELPERS
   ===================================================== */

function blobToDataUrl(blob) {
    return new Promise(
        (resolve, reject) => {
            const reader =
                new FileReader();

            reader.onload =
                () => {
                    resolve(
                        reader.result
                    );
                };

            reader.onerror =
                () => {
                    reject(
                        reader.error
                    );
                };

            reader.readAsDataURL(
                blob
            );
        }
    );
}

function dataUrlToBlob(dataUrl) {
    const parts =
        dataUrl.split(",");

    const metadata =
        parts[0];

    const base64 =
        parts[1];

    const mimeMatch =
        metadata.match(
            /data:(.*?);base64/
        );

    const mimeType =
        mimeMatch
            ? mimeMatch[1]
            : "application/octet-stream";

    const binary =
        atob(base64);

    const bytes =
        new Uint8Array(
            binary.length
        );

    for (
        let index = 0;
        index < binary.length;
        index += 1
    ) {
        bytes[index] =
            binary.charCodeAt(index);
    }

    return new Blob(
        [bytes],
        {
            type: mimeType
        }
    );
}

/* =====================================================
   CREATE BACKUP
   ===================================================== */

async function createBackupData() {
    saveCurrentLetter();

    const pages = {};

    alphabet.forEach((letter) => {
        pages[letter] =
            loadLetter(letter);
    });

    const storedAssets =
        await getAllAssets();

    const assets = [];

    for (
        const asset
        of storedAssets
    ) {
        const dataUrl =
            await blobToDataUrl(
                asset.blob
            );

        assets.push({
            id: asset.id,

            name: asset.name,

            type: asset.type,

            size: asset.size,

            kind: asset.kind,

            createdAt:
                asset.createdAt,

            dataUrl
        });
    }

    return {
        app:
            "Grandma's Alphabet Book",

        version: "2.6.3",

        createdAt:
            new Date()
                .toISOString(),

        lastLetter:
            currentLetter,

        pages,

        assets
    };
}

function downloadJsonFile(
    data,
    filename
) {
    const json =
        JSON.stringify(
            data,
            null,
            2
        );

    const blob =
        new Blob(
            [json],
            {
                type:
                    "application/json"
            }
        );

    const url =
        URL.createObjectURL(
            blob
        );

    const link =
        document.createElement(
            "a"
        );

    link.href = url;

    link.download = filename;

    document.body.appendChild(
        link
    );

    link.click();

    link.remove();

    window.setTimeout(() => {
        URL.revokeObjectURL(
            url
        );
    }, 1000);
}

async function downloadBackup() {
    try {
        showSaveStatus(
            "Preparing backup...",
            "saving"
        );

        const backup =
            await createBackupData();

        const date =
            new Date()
                .toISOString()
                .slice(0, 10);

        downloadJsonFile(
            backup,
            `grandmas-alphabet-book-backup-${date}.json`
        );

        backupModal.classList.add(
            "hidden"
        );

        showSaveStatus(
            "Backup downloaded"
        );
    } catch (error) {
        console.error(
            "Unable to create backup:",
            error
        );

        showSaveStatus(
            "Backup failed",
            "error"
        );
    }
}

/* =====================================================
   RESTORE BACKUP
   ===================================================== */

function normalizeBackupData(backup) {
    if (
        !backup ||
        typeof backup !== "object" ||
        Array.isArray(backup)
    ) {
        return null;
    }

    if (
        backup.pages &&
        typeof backup.pages === "object"
    ) {
        return {
            ...backup,

            pages: backup.pages,

            assets:
                Array.isArray(
                    backup.assets
                )
                    ? backup.assets
                    : [],

            lastLetter:
                backup.lastLetter || "A"
        };
    }

    const hasLetterPages =
        alphabet.some((letter) =>
            Object.prototype
                .hasOwnProperty
                .call(
                    backup,
                    letter
                )
        );

    if (hasLetterPages) {
        const pages = {};

        alphabet.forEach((letter) => {
            pages[letter] =
                typeof backup[letter] ===
                "string"
                    ? backup[letter]
                    : "";
        });

        return {
            app:
                "Grandma's Alphabet Book",

            version: "legacy",

            pages,

            assets: [],

            lastLetter: "A"
        };
    }

    return null;
}

function validateBackupData(backup) {
    return Boolean(
        normalizeBackupData(backup)
    );
}

async function handleRestoreFile(
    event
) {
    const file =
        event.target.files?.[0];

    event.target.value = "";

    if (!file) {
        return;
    }

    try {
        const text =
            await file.text();

        const backup =
            JSON.parse(text);

        if (
            !validateBackupData(
                backup
            )
        ) {
            throw new Error(
                "Invalid backup file"
            );
        }

        pendingBackup =
            normalizeBackupData(backup);

        backupModal.classList.add(
            "hidden"
        );

        confirmModal.classList.remove(
            "hidden"
        );
    } catch (error) {
        console.error(
            "Unable to read backup:",
            error
        );

        showSaveStatus(
            "That backup file is not valid",
            "error"
        );
    }
}

async function restoreBackupData() {
    if (!pendingBackup) {
        return;
    }

    try {
        showSaveStatus(
            "Restoring...",
            "saving"
        );

        alphabet.forEach(
            (letter) => {
                const html =
                    pendingBackup
                        .pages[
                            letter
                        ] || "";

                localStorage.setItem(
                    getStorageKey(
                        letter
                    ),
                    html
                );
            }
        );

        await clearAllAssets();

        for (
            const asset
            of pendingBackup.assets
        ) {
            const blob =
                dataUrlToBlob(
                    asset.dataUrl
                );

            await saveAsset({
                id: asset.id,

                name:
                    asset.name ||
                    "File",

                type:
                    asset.type ||
                    blob.type,

                size:
                    asset.size ||
                    blob.size,

                kind:
                    asset.kind ||
                    "attachment",

                createdAt:
                    asset.createdAt ||
                    new Date()
                        .toISOString(),

                blob
            });
        }

        const restoredLetter =
            alphabet.includes(
                pendingBackup
                    .lastLetter
            )
                ? pendingBackup
                      .lastLetter
                : "A";

        localStorage.setItem(
            LAST_LETTER_KEY,
            restoredLetter
        );

        releaseObjectUrls();

        pendingBackup = null;

        confirmModal.classList.add(
            "hidden"
        );

        await displayLetter(
            restoredLetter
        );

        showSaveStatus(
            "Backup restored"
        );
    } catch (error) {
        console.error(
            "Unable to restore backup:",
            error
        );

        showSaveStatus(
            "Restore failed",
            "error"
        );
    }
}

/* =====================================================
   BACKUP WINDOW
   ===================================================== */

function openBackupModal() {
    closeAllFormattingMenus();

    backupModal.classList.remove(
        "hidden"
    );
}

function closeBackupModal() {
    backupModal.classList.add(
        "hidden"
    );
}

/* =====================================================
   EDITOR INPUT BEHAVIOR
   ===================================================== */

function handleEditorInput() {
    scheduleSave();

    updateToolbarState();
}

function handleEditorChange(event) {
    const target =
        event.target;

    if (
        target.matches(
            'input[type="checkbox"]'
        )
    ) {
        updateChecklistItem(
            target
        );
    }
}

function handleEditorClick(event) {
    const attachment =
        event.target.closest(
            ".attachment-card"
        );

    if (attachment) {
        return;
    }

    const checklistText =
        event.target.closest(
            ".checklist-text"
        );

    if (checklistText) {
        checklistText.focus();
    }
}

function handleEditorKeydown(event) {
    if (
        event.key === "Escape"
    ) {
        closeAllFormattingMenus();

        return;
    }

    if (
        event.key !== "Enter"
    ) {
        return;
    }

    const checklistText =
        event.target.closest(
            ".checklist-text"
        );

    if (!checklistText) {
        return;
    }

    event.preventDefault();

    const currentItem =
        checklistText.closest(
            ".checklist-item"
        );

    if (!currentItem) {
        return;
    }

    const newItem =
        createChecklistItem();

    currentItem.after(
        newItem
    );

    const newText =
        newItem.querySelector(
            ".checklist-text"
        );

    newText.focus();

    placeCursorInsideEnd(
        newText
    );

    scheduleSave();
}

function handleEditorPaste(event) {
    const clipboard =
        event.clipboardData;

    if (!clipboard) {
        return;
    }

    const plainText =
        clipboard.getData(
            "text/plain"
        );

    if (!plainText) {
        return;
    }

    event.preventDefault();

    document.execCommand(
        "insertText",
        false,
        plainText
    );

    scheduleSave();
}

/* =====================================================
   SELECTION EVENTS
   ===================================================== */

function handleSelectionChange() {
    if (selectionIsInsideEditor()) {
        saveSelection();

        updateToolbarState();
    }
}

function handleDocumentPointerDown(
    event
) {
    const clickedToolbar =
        formatToolbar?.contains(
            event.target
        );

    const clickedSizeMenu =
        sizeMenu?.contains(
            event.target
        );

    if (
        clickedToolbar ||
        clickedSizeMenu
    ) {
        return;
    }

    if (
        !editor.contains(
            event.target
        )
    ) {
        closeAllFormattingMenus();
    }
}

/* =====================================================
   TOOLBAR BUTTON EVENTS
   ===================================================== */

function connectToolbarButtons() {
    undoButton?.addEventListener(
        "click",
        () => {
            runEditorCommand(
                "undo"
            );
        }
    );

    redoButton?.addEventListener(
        "click",
        () => {
            runEditorCommand(
                "redo"
            );
        }
    );

    boldButton?.addEventListener(
        "click",
        () => {
            runEditorCommand(
                "bold"
            );
        }
    );

    sizeButton?.addEventListener(
        "click",
        (event) => {
            event.stopPropagation();

            toggleSizeMenu();
        }
    );

    linkButton?.addEventListener(
        "click",
        () => {
            addWebLink();
        }
    );

    photoButton?.addEventListener(
        "click",
        () => {
            photoInput?.click();
        }
    );
}

/* =====================================================
   SIZE MENU EVENTS
   ===================================================== */

function connectSizeMenu() {
    if (!sizeMenu) {
        return;
    }

    const buttons =
        sizeMenu.querySelectorAll(
            "[data-font-size]"
        );

    buttons.forEach(
        (button) => {
            button.addEventListener(
                "click",
                () => {
                    applyFontSize(
                        button.dataset
                            .fontSize
                    );
                }
            );
        }
    );
}

/* =====================================================
   SEARCH EVENTS
   ===================================================== */

function connectSearchEvents() {
    searchButton?.addEventListener(
        "click",
        openSearchModal
    );

    closeSearchButton?.addEventListener(
        "click",
        closeSearchModal
    );

    searchInput?.addEventListener(
        "input",
        () => {
            const query =
                searchInput.value;

            const results =
                searchAllLetters(
                    query
                );

            renderSearchResults(
                results,
                query
            );
        }
    );

    searchModal?.addEventListener(
        "click",
        (event) => {
            if (
                event.target ===
                searchModal
            ) {
                closeSearchModal();
            }
        }
    );
}

/* =====================================================
   BACKUP EVENTS
   ===================================================== */

function connectBackupEvents() {
    backupButton?.addEventListener(
        "click",
        openBackupModal
    );

    closeBackupButton?.addEventListener(
        "click",
        closeBackupModal
    );

    downloadBackupButton?.addEventListener(
        "click",
        downloadBackup
    );

    restoreBackupButton?.addEventListener(
        "click",
        () => {
            restoreInput?.click();
        }
    );

    confirmCancelButton?.addEventListener(
        "click",
        () => {
            pendingBackup = null;

            confirmModal.classList.add(
                "hidden"
            );
        }
    );

    confirmRestoreButton?.addEventListener(
        "click",
        restoreBackupData
    );

    backupModal?.addEventListener(
        "click",
        (event) => {
            if (
                event.target ===
                backupModal
            ) {
                closeBackupModal();
            }
        }
    );

    confirmModal?.addEventListener(
        "click",
        (event) => {
            if (
                event.target ===
                confirmModal
            ) {
                pendingBackup = null;

                confirmModal.classList.add(
                    "hidden"
                );
            }
        }
    );
}

/* =====================================================
   GLOBAL EVENTS
   ===================================================== */

function connectGlobalEvents() {
    openBookButton?.addEventListener(
        "click",
        openBook
    );

    exportPdfButton?.addEventListener(
        "click",
        exportBookAsPdf
    );

    photoInput?.addEventListener(
        "change",
        handlePhotoSelection
    );

    restoreInput?.addEventListener(
        "change",
        handleRestoreFile
    );

    editor?.addEventListener(
        "input",
        handleEditorInput
    );

    editor?.addEventListener(
        "change",
        handleEditorChange
    );

    editor?.addEventListener(
        "click",
        handleEditorClick
    );

    editor?.addEventListener(
        "keydown",
        handleEditorKeydown
    );

    editor?.addEventListener(
        "paste",
        handleEditorPaste
    );

    document.addEventListener(
        "selectionchange",
        handleSelectionChange
    );

    document.addEventListener(
        "pointerdown",
        handleDocumentPointerDown
    );

    window.addEventListener(
        "beforeunload",
        () => {
            saveCurrentLetter();

            releaseObjectUrls();
        }
    );

    document.addEventListener(
        "keydown",
        (event) => {
            if (
                event.key ===
                "Escape"
            ) {
                closeAllModals();

                closeAllFormattingMenus();
            }
        }
    );
}

/* =====================================================
   CLEAN SAVED CONTENT
   ===================================================== */

function cleanEditorContent() {
    editor
        ?.querySelectorAll(
            ".checklist-item"
        )
        .forEach((item) => {
            const checkbox =
                item.querySelector(
                    'input[type="checkbox"]'
                );

            item.classList.toggle(
                "completed",
                Boolean(
                    checkbox?.checked
                )
            );
        });

    editor
        ?.querySelectorAll(
            ".highlight-cursor-marker"
        )
        .forEach((marker) => {
            marker.classList.remove(
                "highlight-cursor-marker"
            );

            marker.innerHTML =
                marker.innerHTML.replace(
                    /\u200B/g,
                    ""
                );
        });
}

/* =====================================================
   PRESERVE TEXT SELECTION WHEN
   GRANDMA TAPS A TOOL BUTTON
   ===================================================== */

function preserveSelectionOnToolbarPress() {
    const controls = [
        formatToolbar,
        sizeMenu
    ];

    controls.forEach(
        (control) => {
            control?.addEventListener(
                "pointerdown",
                (event) => {
                    const button =
                        event.target.closest(
                            "button"
                        );

                    if (!button) {
                        return;
                    }

                    event.preventDefault();

                    restoreSelection();
                }
            );
        }
    );
}

/* =====================================================
   ACCESSIBILITY HELPERS
   ===================================================== */

function prepareAccessibility() {
    editor?.setAttribute(
        "role",
        "textbox"
    );

    editor?.setAttribute(
        "aria-multiline",
        "true"
    );

    editor?.setAttribute(
        "aria-label",
        "Alphabet book page"
    );

    formatToolbar?.setAttribute(
        "role",
        "toolbar"
    );

    formatToolbar?.setAttribute(
        "aria-label",
        "Writing tools"
    );

    sizeMenu?.setAttribute(
        "role",
        "menu"
    );
}

/* =====================================================
   VERIFY REQUIRED HTML ELEMENTS
   ===================================================== */

function verifyRequiredElements() {
    const requiredElements = [
        ["cover-screen", coverScreen],
        ["book-screen", bookScreen],
        ["open-book", openBookButton],
        ["letter-tabs", letterTabs],
        [
            "current-letter",
            currentLetterHeading
        ],
        ["editor", editor],
        [
            "format-toolbar",
            formatToolbar
        ],
        ["undo-button", undoButton],
        ["redo-button", redoButton],
        ["bold-button", boldButton],
        ["size-button", sizeButton],
        ["link-button", linkButton],
        ["photo-button", photoButton],
        ["size-menu", sizeMenu]
    ];

    const missing =
        requiredElements
            .filter(
                ([, element]) =>
                    !element
            )
            .map(
                ([name]) => name
            );

    if (missing.length > 0) {
        console.error(
            "Grandma's Alphabet Book is missing these HTML elements:",
            missing.join(", ")
        );

        return false;
    }

    return true;
}

/* =====================================================
   SERVICE WORKER
   ===================================================== */

function registerServiceWorker() {
    if (
        !(
            "serviceWorker"
            in navigator
        )
    ) {
        return;
    }

    window.addEventListener(
        "load",
        () => {
            navigator
                .serviceWorker
                .register(
                    "./service-worker.js"
                )
                .then(
                    (registration) => {
                        console.log(
                            "Service worker registered:",
                            registration.scope
                        );
                    }
                )
                .catch(
                    (error) => {
                        console.warn(
                            "Service worker registration failed:",
                            error
                        );
                    }
                );
        }
    );
}

/* =====================================================
   APPLICATION STARTUP
   ===================================================== */

function initializeApp() {
    if (
        !verifyRequiredElements()
    ) {
        return;
    }

    createLetterTabs();

    prepareAccessibility();

    connectToolbarButtons();

    connectSizeMenu();

    connectSearchEvents();

    connectBackupEvents();

    connectGlobalEvents();

    preserveSelectionOnToolbarPress();

    cleanEditorContent();

    registerServiceWorker();

    updateToolbarState();

    console.log(
        "Grandma's Alphabet Book Version 2.6.3 is ready."
    );
}

/* =====================================================
   START AFTER THE PAGE LOADS
   ===================================================== */

if (
    document.readyState ===
    "loading"
) {
    document.addEventListener(
        "DOMContentLoaded",
        initializeApp
    );
} else {
    initializeApp();
}

/* =====================================================
   GRANDMA'S ALPHABET BOOK
   VERSION 2.6.3
   END OF FILE
   ===================================================== */
