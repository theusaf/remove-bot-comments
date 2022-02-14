// ==UserScript==
// @name         Hide Bot Comments
// @namespace    https://theusaf.org
// @version      0.0.1
// @description  Removes comments made by bots on websites such as YouTube.
// @author       theusaf
// @match        https://www.youtube.com/**
// @copyright    2022 theusaf
// @license      MIT
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        none
// ==/UserScript==

const commentMutationListener = new MutationObserver((mutations) => {
});

// ytd-comment-renderer
