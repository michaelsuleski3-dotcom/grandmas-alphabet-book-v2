/* =====================================================
   Grandma's Alphabet Book
   Version 2.5.0

   Features:
   - Automatic saving
   - Undo and redo
   - Bold and italic text
   - Text sizes and colors
   - Yellow highlighting
   - Checklists
   - Photos
   - Document attachments
   - Search all pages
   - Export current page as PDF
   - Complete backup and restore
   ===================================================== */

"use strict";

/* =====================================================
   BASIC APP SETTINGS
   ===================================================== */

const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const STORAGE_PREFIX =
    "grandmas-alphabet-book-v2-";

const DATABASE_NAME =
    "grandmas-alphabet-book-assets";

const DATABASE_VERSION = 1;

const ASSET_STORE =
    "assets";

/* =====================================================
   MAIN PAGE ELEMENTS
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
   FORMATTING TOOLBAR
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

const italicButton =
    document.getElementById(
        "italic-button"
    );

const sizeButton =
    document.getElementById("size-button");

const colorButton =
    document.getElementById(
        "color-button"
    );

const highlightButton =
    document.getElementById(
        "highlight-button"
    );

const checklistButton =
    document.getElementById(
        "checklist-button"
    );

const photoButton =
    document.getElementById(
        "photo-button"
    );

const attachmentButton =
    document.getElementById(
        "attachment-button"
    );

const sizeMenu =
    document.getElementById("size-menu");

const colorMenu =
    document.getElementById(
        "color-menu"
    );

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
   CONFIRMATION WINDOW
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
    sizeMenu.classList.add("hidden");
    colorMenu.classList.add("hidden");
}

function closeAllModals() {
    searchModal.classList.add("hidden");
    backupModal.classList.add("hidden");
    confirmModal.classList.add("hidden");
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

    return copy.innerHTML;
}

function saveCurrentLetter() {
    try {
        const savedHtml =
            prepareEditorHtmlForStorage();

        localStorage.setItem(
            getStorageKey(currentLetter),
            savedHtml
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
    highlighterActive = false;

highlightButton.classList.remove(
    "active"
);

    currentLetterHeading.textContent =
        letter;

    editor.innerHTML =
        loadLetter(letter);

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

    hideFormattingToolbar();

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

    /*
    Load A directly without first saving an
    empty editor over the existing A page.
    */

    await displayLetter("A");
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
        return;
    }

    const selection =
        window.getSelection();

    selection.removeAllRanges();

    selection.addRange(
        savedSelection
    );
}

function getSelectionRectangle() {
    const selection =
        window.getSelection();

    if (
        !selection ||
        selection.rangeCount === 0
    ) {
        return null;
    }

    const range =
        selection.getRangeAt(0);

    let rectangle =
        range.getBoundingClientRect();

    if (
        rectangle.width === 0 &&
        rectangle.height === 0
    ) {
        const marker =
            document.createElement(
                "span"
            );

        marker.textContent =
            "\u200b";

        range.insertNode(marker);

        rectangle =
            marker.getBoundingClientRect();

        marker.remove();

        selection.removeAllRanges();

        selection.addRange(range);
    }

    return rectangle;
}

/* =====================================================
   FLOATING TOOLBAR
   ===================================================== */

function showFormattingToolbar() {
    if (!selectionIsInsideEditor()) {
        return;
    }

    saveSelection();

    formatToolbar.classList.remove(
        "hidden"
    );

    positionFormattingToolbar();

    updateToolbarState();
}

function hideFormattingToolbar() {
    formatToolbar.classList.add(
        "hidden"
    );

    closeAllFormattingMenus();
}

function positionFormattingToolbar() {
    if (
        formatToolbar.classList.contains(
            "hidden"
        )
    ) {
        return;
    }

    if (
        window.innerWidth <= 560
    ) {
        formatToolbar.style.left =
            "8px";

        formatToolbar.style.top =
            "auto";

        formatToolbar.style.bottom =
            "8px";

        return;
    }

    const rectangle =
        getSelectionRectangle();

    if (!rectangle) {
        return;
    }

    const toolbarWidth =
        formatToolbar.offsetWidth;

    const toolbarHeight =
        formatToolbar.offsetHeight;

    let left =
        rectangle.left +
        rectangle.width / 2 -
        toolbarWidth / 2;

    let top =
        rectangle.top -
        toolbarHeight -
        14;

    left =
        Math.max(
            9,
            Math.min(
                left,
                window.innerWidth -
                toolbarWidth -
                9
            )
        );

    if (top < 9) {
        top =
            rectangle.bottom + 14;
    }

    formatToolbar.style.left =
        `${left}px`;

    formatToolbar.style.top =
        `${top}px`;

    formatToolbar.style.bottom =
        "auto";
}

function updateToolbarState() {
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

        undoButton.disabled =
            !document.queryCommandEnabled(
                "undo"
            );

        redoButton.disabled =
            !document.queryCommandEnabled(
                "redo"
            );
    } catch (error) {
        undoButton.disabled = false;
        redoButton.disabled = false;
    }
}

function runEditorCommand(
    command,
    value = null
) {
    restoreSelection();

    editor.focus();

    document.execCommand(
        command,
        false,
        value
    );

    saveSelection();

    scheduleSave();

    updateToolbarState();

    positionFormattingToolbar();
}

/* =====================================================
   SIZE AND COLOR MENUS
   ===================================================== */

function positionMenu(menu, button) {
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
}

function toggleSizeMenu() {
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

function toggleColorMenu() {
    const shouldOpen =
        colorMenu.classList.contains(
            "hidden"
        );

    closeAllFormattingMenus();

    if (shouldOpen) {
        positionMenu(
            colorMenu,
            colorButton
        );
    }
}

/* =====================================================
   CHECKLISTS
   ===================================================== */

function insertChecklist() {
    restoreSelection();

    editor.focus();

    const checklistHtml = `
        <ul class="checklist">
            <li class="checklist-item">
                <input
                    type="checkbox"
                    aria-label="Checklist item"
                >
                <span
                    class="checklist-text"
                    contenteditable="true"
                >New item</span>
            </li>
        </ul>
        <div><br></div>
    `;

    document.execCommand(
        "insertHTML",
        false,
        checklistHtml
    );

    scheduleSave();

    saveSelection();
}

function updateChecklistItem(
    checkbox
) {
    const checklistItem =
        checkbox.closest(
            ".checklist-item"
        );

    if (!checklistItem) {
        return;
    }

    checklistItem.classList.toggle(
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
   YELLOW HIGHLIGHTER
   ===================================================== */

function highlightSelection() {
    restoreSelection();

    const selection =
        window.getSelection();

    if (
        !selection ||
        selection.rangeCount === 0 ||
        selection.isCollapsed
    ) {
        window.alert(
            "Select the words you want to highlight first."
        );

        return;
    }

    editor.focus();

    try {
        document.execCommand(
            "styleWithCSS",
            false,
            true
        );

        const successful =
            document.execCommand(
                "hiliteColor",
                false,
                "#ffe04d"
            );

        if (!successful) {
            document.execCommand(
                "backColor",
                false,
                "#ffe04d"
            );
        }
    } catch (error) {
        document.execCommand(
            "backColor",
            false,
            "#ffe04d"
        );
    }

    /*
    Move the cursor to the end of the
    highlighted words.
    */

    const endingRange =
        selection.getRangeAt(0)
            .cloneRange();

    endingRange.collapse(false);

    selection.removeAllRanges();
    selection.addRange(endingRange);

    /*
    Turn off the yellow background for
    anything typed after the selection.
    */

    try {
        document.execCommand(
            "hiliteColor",
            false,
            "transparent"
        );

        document.execCommand(
            "backColor",
            false,
            "transparent"
        );
    } catch (error) {
        console.error(
            "Unable to reset highlighter:",
            error
        );
    }

    savedSelection =
        endingRange.cloneRange();

    highlightButton.classList.remove(
        "active"
    );

    scheduleSave();
}


/* =====================================================
   DOCUMENT ATTACHMENTS
   ===================================================== */

async function insertAttachment(file) {
    if (!file) {
        return;
    }

    const assetId =
        createUniqueId("attachment");

    const asset = {
        id: assetId,
        type: "attachment",
        name:
            file.name ||
            "Attached document",
        mimeType:
            file.type ||
            "application/octet-stream",
        size: file.size,
        created:
            new Date().toISOString(),
        blob: file
    };

    try {
        showSaveStatus(
            "Attaching file...",
            "saving"
        );

        await saveAsset(asset);

        const attachment =
            document.createElement("a");

        attachment.className =
            "attachment-card";

        attachment.dataset.assetId =
            assetId;

        attachment.href =
            getAssetObjectUrl(asset);

        attachment.download =
            asset.name;

        attachment.target =
            "_blank";

        attachment.rel =
            "noopener";

        attachment.setAttribute(
            "contenteditable",
            "false"
        );

        attachment.innerHTML = `
            <span class="attachment-icon">
                📎
            </span>

            <span class="attachment-details">
                <span class="attachment-name">
                    ${escapeHtml(asset.name)}
                </span>

                <span class="attachment-size">
                    ${escapeHtml(
                        formatFileSize(
                            asset.size
                        )
                    )}
                </span>
            </span>
        `;

        insertNodeAtSelection(
            attachment
        );

        saveCurrentLetter();

        showSaveStatus(
            "File attached"
        );
    } catch (error) {
        console.error(
            "Unable to attach file:",
            error
        );

        window.alert(
            "The document could not be attached."
        );
    } finally {
        attachmentInput.value = "";
    }
}

/* =====================================================
   SEARCH
   ===================================================== */

function getPlainTextFromHtml(html) {
    const temporaryElement =
        document.createElement("div");

    temporaryElement.innerHTML =
        html;

    return (
        temporaryElement.textContent ||
        temporaryElement.innerText ||
        ""
    )
        .replace(/\s+/g, " ")
        .trim();
}

function createSearchExcerpt(
    text,
    query
) {
    const lowerText =
        text.toLowerCase();

    const lowerQuery =
        query.toLowerCase();

    const matchIndex =
        lowerText.indexOf(
            lowerQuery
        );

    if (matchIndex === -1) {
        return text.slice(0, 145);
    }

    const start =
        Math.max(
            0,
            matchIndex - 55
        );

    const end =
        Math.min(
            text.length,
            matchIndex +
            query.length +
            85
        );

    let excerpt =
        text.slice(start, end);

    if (start > 0) {
        excerpt =
            `…${excerpt}`;
    }

    if (end < text.length) {
        excerpt =
            `${excerpt}…`;
    }

    return excerpt;
}

function highlightSearchText(
    text,
    query
) {
    const escapedText =
        escapeHtml(text);

    const escapedQuery =
        escapeHtml(query)
            .replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );

    const pattern =
        new RegExp(
            `(${escapedQuery})`,
            "gi"
        );

    return escapedText.replace(
        pattern,
        "<mark>$1</mark>"
    );
}

function runSearch() {
    const query =
        searchInput.value.trim();

    if (!query) {
        searchResults.innerHTML = `
            <p class="search-message">
                Type a word or phrase to begin searching.
            </p>
        `;

        return;
    }

    const matches = [];

    alphabet.forEach((letter) => {
        const html =
            letter === currentLetter
                ? prepareEditorHtmlForStorage()
                : loadLetter(letter);

        const text =
            getPlainTextFromHtml(html);

        if (
            text
                .toLowerCase()
                .includes(
                    query.toLowerCase()
                )
        ) {
            matches.push({
                letter,
                text
            });
        }
    });

    if (matches.length === 0) {
        searchResults.innerHTML = `
            <p class="search-message">
                No pages contain
                “${escapeHtml(query)}”.
            </p>
        `;

        return;
    }

    searchResults.innerHTML = "";

    matches.forEach((match) => {
        const resultButton =
            document.createElement(
                "button"
            );

        resultButton.type =
            "button";

        resultButton.className =
            "search-result";

        const excerpt =
            createSearchExcerpt(
                match.text,
                query
            );

        resultButton.innerHTML = `
            <span class="search-result-letter">
                ${match.letter}
            </span>

            <span class="search-result-text">
                ${highlightSearchText(
                    excerpt,
                    query
                )}
            </span>
        `;

        resultButton.addEventListener(
            "click",
            async () => {
                searchModal.classList.add(
                    "hidden"
                );

                await openLetter(
                    match.letter
                );
            }
        );

        searchResults.appendChild(
            resultButton
        );
    });
}

function openSearchWindow() {
    saveCurrentLetter();

    searchModal.classList.remove(
        "hidden"
    );

    searchInput.value = "";

    searchResults.innerHTML = `
        <p class="search-message">
            Type a word or phrase to begin searching.
        </p>
    `;

    window.setTimeout(() => {
        searchInput.focus();
    }, 100);
}

/* =====================================================
   PDF EXPORT
   ===================================================== */

async function exportCurrentPageAsPdf() {
    saveCurrentLetter();

    hideFormattingToolbar();

    if (
        typeof window.html2pdf ===
        "undefined"
    ) {
        window.alert(
            "The PDF tool could not load. Check your internet connection and try again."
        );

        return;
    }

    showSaveStatus(
        "Creating PDF...",
        "saving"
    );

    const pageArea =
        document.querySelector(
            ".page-area"
        );

    const printableCopy =
        pageArea.cloneNode(true);

    printableCopy.classList.add(
        "pdf-export-page"
    );

    printableCopy.querySelector(
        "#editor"
    ).removeAttribute(
        "contenteditable"
    );

    printableCopy.querySelectorAll(
        'input[type="checkbox"]'
    ).forEach((checkbox) => {
        checkbox.disabled = true;
    });

    const wrapper =
        document.createElement(
            "div"
        );

    wrapper.style.position =
        "fixed";

    wrapper.style.left =
        "-10000px";

    wrapper.style.top = "0";

    wrapper.style.background =
        "#ffffff";

    wrapper.appendChild(
        printableCopy
    );

    document.body.appendChild(
        wrapper
    );

    const options = {
        margin: 0.35,

        filename:
            `Grandmas-Book-Letter-${currentLetter}.pdf`,

        image: {
            type: "jpeg",
            quality: 0.98
        },

        html2canvas: {
            scale: 2,
            useCORS: true,
            backgroundColor:
                "#fffdf4"
        },

        jsPDF: {
            unit: "in",
            format: "letter",
            orientation: "portrait"
        },

        pagebreak: {
            mode: [
                "css",
                "legacy"
            ]
        }
    };

    try {
        await window
            .html2pdf()
            .set(options)
            .from(printableCopy)
            .save();

        showSaveStatus(
            "PDF created"
        );
    } catch (error) {
        console.error(
            "Unable to create PDF:",
            error
        );

        window.alert(
            "The PDF could not be created."
        );
    } finally {
        wrapper.remove();
    }
}

/* =====================================================
   BACKUP HELPERS
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

            reader.readAsDataURL(blob);
        }
    );
}

function dataUrlToBlob(dataUrl) {
    const parts =
        dataUrl.split(",");

    if (parts.length !== 2) {
        throw new Error(
            "Invalid backup file data."
        );
    }

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
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);

    link.click();

    link.remove();

    window.setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 1000);
}

/* =====================================================
   DOWNLOAD COMPLETE BACKUP
   ===================================================== */

async function downloadBackup() {
    saveCurrentLetter();

    showSaveStatus(
        "Creating backup...",
        "saving"
    );

    try {
        const pages = {};

        alphabet.forEach((letter) => {
            pages[letter] =
                loadLetter(letter);
        });

        const storedAssets =
            await getAllAssets();

        const backupAssets = [];

        for (
            const asset
            of storedAssets
        ) {
            const dataUrl =
                await blobToDataUrl(
                    asset.blob
                );

            backupAssets.push({
                id: asset.id,
                type: asset.type,
                name: asset.name,
                mimeType:
                    asset.mimeType,
                size: asset.size,
                created:
                    asset.created,
                dataUrl
            });
        }

        const backup = {
            application:
                "Grandma's Alphabet Book",

            version: "2.5.0",

            created:
                new Date().toISOString(),

            pages,

            assets: backupAssets
        };

        const date =
            new Date()
                .toISOString()
                .slice(0, 10);

        downloadJsonFile(
            backup,
            `Grandmas-Alphabet-Book-Backup-${date}.json`
        );

        showSaveStatus(
            "Backup downloaded"
        );

        backupModal.classList.add(
            "hidden"
        );
    } catch (error) {
        console.error(
            "Unable to create backup:",
            error
        );

        window.alert(
            "The backup could not be created."
        );
    }
}

/* =====================================================
   RESTORE BACKUP
   ===================================================== */

function validateBackup(backup) {
    return Boolean(
        backup &&
        typeof backup ===
            "object" &&
        backup.pages &&
        typeof backup.pages ===
            "object" &&
        Array.isArray(
            backup.assets
        )
    );
}

async function readBackupFile(file) {
    const text =
        await file.text();

    const backup =
        JSON.parse(text);

    if (!validateBackup(backup)) {
        throw new Error(
            "This is not a valid Grandma's Alphabet Book backup."
        );
    }

    return backup;
}

async function restoreBackup(
    backup
) {
    try {
        showSaveStatus(
            "Restoring...",
            "saving"
        );

        releaseObjectUrls();

        alphabet.forEach((letter) => {
            const page =
                backup.pages[letter];

            localStorage.setItem(
                getStorageKey(letter),
                typeof page === "string"
                    ? page
                    : ""
            );
        });

        await clearAllAssets();

        for (
            const storedAsset
            of backup.assets
        ) {
            const blob =
                dataUrlToBlob(
                    storedAsset.dataUrl
                );

            await saveAsset({
                id:
                    storedAsset.id,
                type:
                    storedAsset.type,
                name:
                    storedAsset.name,
                mimeType:
                    storedAsset.mimeType,
                size:
                    storedAsset.size,
                created:
                    storedAsset.created,
                blob
            });
        }

        pendingBackup = null;

        closeAllModals();

        await displayLetter("A");

        showSaveStatus(
            "Backup restored"
        );

        window.alert(
            "Your backup was restored successfully."
        );
    } catch (error) {
        console.error(
            "Unable to restore backup:",
            error
        );

        window.alert(
            "The backup could not be restored."
        );
    }
}

/* =====================================================
   EVENT LISTENERS: BOOK
   ===================================================== */

openBookButton.addEventListener(
    "click",
    openBook
);

editor.addEventListener(
    "input",
    () => {
        scheduleSave();
        updateToolbarState();
    }
);

editor.addEventListener(
    "mouseup",
    () => {
        window.setTimeout(
            showFormattingToolbar,
            0
        );
    }
);

editor.addEventListener(
    "keyup",
    () => {
        window.setTimeout(
            showFormattingToolbar,
            0
        );
    }
);

editor.addEventListener(
    "touchend",
    () => {
        window.setTimeout(
            showFormattingToolbar,
            80
        );
    }
);

editor.addEventListener(
    "focus",
    () => {
        window.setTimeout(
            showFormattingToolbar,
            0
        );
    }
);

editor.addEventListener(
    "change",
    (event) => {
        const target =
            event.target;

        if (
            target.matches(
                '.checklist-item input[type="checkbox"]'
            )
        ) {
            updateChecklistItem(
                target
            );
        }
    }
);

/* =====================================================
   EVENT LISTENERS: FORMATTING
   ===================================================== */

undoButton.addEventListener(
    "mousedown",
    (event) => {
        event.preventDefault();
        runEditorCommand("undo");
    }
);

redoButton.addEventListener(
    "mousedown",
    (event) => {
        event.preventDefault();
        runEditorCommand("redo");
    }
);

boldButton.addEventListener(
    "mousedown",
    (event) => {
        event.preventDefault();
        runEditorCommand("bold");
    }
);

italicButton.addEventListener(
    "mousedown",
    (event) => {
        event.preventDefault();
        runEditorCommand("italic");
    }
);

sizeButton.addEventListener(
    "mousedown",
    (event) => {
        event.preventDefault();

        saveSelection();

        toggleSizeMenu();
    }
);

colorButton.addEventListener(
    "mousedown",
    (event) => {
        event.preventDefault();

        saveSelection();

        toggleColorMenu();
    }
);

highlightButton.addEventListener(
    "mousedown",
    (event) => {
        event.preventDefault();

        saveSelection();

        highlightSelection();
    }
);

checklistButton.addEventListener(
    "mousedown",
    (event) => {
        event.preventDefault();

        insertChecklist();
    }
);

photoButton.addEventListener(
    "mousedown",
    (event) => {
        event.preventDefault();

        saveSelection();

        photoInput.click();
    }
);

attachmentButton.addEventListener(
    "mousedown",
    (event) => {
        event.preventDefault();

        saveSelection();

        attachmentInput.click();
    }
);

/* =====================================================
   EVENT LISTENERS: SIZE OPTIONS
   ===================================================== */

document.querySelectorAll(
    ".size-option"
).forEach((option) => {
    option.addEventListener(
        "mousedown",
        (event) => {
            event.preventDefault();

            const size =
                option.dataset.size;

            const sizeValues = {
                small: "2",
                normal: "3",
                large: "5"
            };

            runEditorCommand(
                "fontSize",
                sizeValues[size] ||
                "3"
            );

            sizeMenu.classList.add(
                "hidden"
            );
        }
    );
});

/* =====================================================
   EVENT LISTENERS: COLOR OPTIONS
   ===================================================== */

document.querySelectorAll(
    ".color-option"
).forEach((option) => {
    option.addEventListener(
        "mousedown",
        (event) => {
            event.preventDefault();

            const color =
                option.dataset.color;

            runEditorCommand(
                "foreColor",
                color
            );

            colorMenu.classList.add(
                "hidden"
            );
        }
    );
});

/* =====================================================
   EVENT LISTENERS: FILES
   ===================================================== */

photoInput.addEventListener(
    "change",
    () => {
        const file =
            photoInput.files?.[0];

        insertPhoto(file);
    }
);

attachmentInput.addEventListener(
    "change",
    () => {
        const file =
            attachmentInput.files?.[0];

        insertAttachment(file);
    }
);

/* =====================================================
   EVENT LISTENERS: SEARCH
   ===================================================== */

searchButton.addEventListener(
    "click",
    openSearchWindow
);

closeSearchButton.addEventListener(
    "click",
    () => {
        searchModal.classList.add(
            "hidden"
        );
    }
);

searchInput.addEventListener(
    "input",
    runSearch
);

/* =====================================================
   EVENT LISTENERS: PDF
   ===================================================== */

exportPdfButton.addEventListener(
    "click",
    exportCurrentPageAsPdf
);

/* =====================================================
   EVENT LISTENERS: BACKUP
   ===================================================== */

backupButton.addEventListener(
    "click",
    () => {
        backupModal.classList.remove(
            "hidden"
        );
    }
);

closeBackupButton.addEventListener(
    "click",
    () => {
        backupModal.classList.add(
            "hidden"
        );
    }
);

downloadBackupButton.addEventListener(
    "click",
    downloadBackup
);

restoreBackupButton.addEventListener(
    "click",
    () => {
        restoreInput.click();
    }
);

restoreInput.addEventListener(
    "change",
    async () => {
        const file =
            restoreInput.files?.[0];

        restoreInput.value = "";

        if (!file) {
            return;
        }

        try {
            pendingBackup =
                await readBackupFile(
                    file
                );

            backupModal.classList.add(
                "hidden"
            );

            confirmModal.classList.remove(
                "hidden"
            );
        } catch (error) {
            console.error(
                "Invalid backup:",
                error
            );

            window.alert(
                "That file is not a valid Grandma's Alphabet Book backup."
            );
        }
    }
);

confirmCancelButton.addEventListener(
    "click",
    () => {
        pendingBackup = null;

        confirmModal.classList.add(
            "hidden"
        );
    }
);

confirmRestoreButton.addEventListener(
    "click",
    () => {
        if (pendingBackup) {
            restoreBackup(
                pendingBackup
            );
        }
    }
);

/* =====================================================
   CLOSE WINDOWS BY CLICKING OUTSIDE
   ===================================================== */

[
    searchModal,
    backupModal,
    confirmModal
].forEach((modal) => {
    modal.addEventListener(
        "click",
        (event) => {
            if (
                event.target === modal
            ) {
                modal.classList.add(
                    "hidden"
                );
            }
        }
    );
});

/* =====================================================
   DOCUMENT EVENTS
   ===================================================== */

document.addEventListener(
    "selectionchange",
    () => {
        if (
            document.activeElement ===
                editor &&
            selectionIsInsideEditor()
        ) {
            saveSelection();

            updateToolbarState();
        }
    }
);

document.addEventListener(
    "mousedown",
    (event) => {
        const clickedInsideToolbar =
            formatToolbar.contains(
                event.target
            );

        const clickedInsideMenu =
            sizeMenu.contains(
                event.target
            ) ||
            colorMenu.contains(
                event.target
            );

        const clickedInsideEditor =
            editor.contains(
                event.target
            ) ||
            event.target === editor;

        if (
            !clickedInsideToolbar &&
            !clickedInsideMenu &&
            !clickedInsideEditor
        ) {
            hideFormattingToolbar();
        }

        if (
            !clickedInsideMenu &&
            event.target !==
                sizeButton &&
            event.target !==
                colorButton
        ) {
            closeAllFormattingMenus();
        }
    }
);

document.addEventListener(
    "keydown",
    (event) => {
        if (event.key === "Escape") {
            closeAllFormattingMenus();

            if (
                !searchModal.classList.contains(
                    "hidden"
                )
            ) {
                searchModal.classList.add(
                    "hidden"
                );

                return;
            }

            if (
                !backupModal.classList.contains(
                    "hidden"
                )
            ) {
                backupModal.classList.add(
                    "hidden"
                );

                return;
            }

            if (
                !confirmModal.classList.contains(
                    "hidden"
                )
            ) {
                confirmModal.classList.add(
                    "hidden"
                );

                pendingBackup = null;

                return;
            }

            hideFormattingToolbar();
        }
    }
);

/* =====================================================
   WINDOW EVENTS
   ===================================================== */

window.addEventListener(
    "resize",
    () => {
        positionFormattingToolbar();
        closeAllFormattingMenus();
    }
);

window.addEventListener(
    "scroll",
    () => {
        positionFormattingToolbar();
        closeAllFormattingMenus();
    },
    true
);

window.addEventListener(
    "beforeunload",
    () => {
        saveCurrentLetter();
        releaseObjectUrls();
    }
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
   PLAIN-TEXT PASTING

   This prevents copied website formatting from
   disrupting the vintage notebook appearance.
   ===================================================== */

editor.addEventListener(
    "paste",
    (event) => {
        const clipboardData =
            event.clipboardData;

        if (!clipboardData) {
            return;
        }

        event.preventDefault();

        const text =
            clipboardData.getData(
                "text/plain"
            );

        document.execCommand(
            "insertText",
            false,
            text
        );

        scheduleSave();
    }
);

/* =====================================================
   SERVICE WORKER
   ===================================================== */

if (
    "serviceWorker" in navigator
) {
    window.addEventListener(
        "load",
        () => {
            navigator.serviceWorker
                .register(
                    "./service-worker.js"
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

   Do not use openLetter("A") here because it would
   save the empty editor over the existing A page.
   ===================================================== */

async function startApp() {
    createLetterTabs();

    currentLetter = "A";

    currentLetterHeading.textContent =
        "A";

    editor.innerHTML =
        loadLetter("A");

    updateActiveTab();

    try {
        await openDatabase();

        await hydrateEditorAssets();
    } catch (error) {
        console.error(
            "File storage is unavailable:",
            error
        );
    }
}

startApp();