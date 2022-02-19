// ==UserScript==
// @name         Hide Bot Comments
// @namespace    https://theusaf.org
// @version      1.2.1
// @description  Removes comments made by bots on websites such as YouTube.
// @author       theusaf
// @match        https://www.youtube.com/**
// @copyright    2022 theusaf
// @license      MIT
// @grant        none
// ==/UserScript==

const SITES = Object.freeze({
    YOUTUBE: [
      /^\s{2,}/, // starts with too much whitespace
      /^(\s*@.+)?\s*(https:\/\/[^\s]+|[\n.\s])+$/, // only links and other punctuation
      /^(\s*@.+)?[A-Z\s\r\n!]*https:\/\/[^\s]+[A-Z\s\r\n!]*$/, // all caps and a link
      /^(\s*@.+)?\s*https:\/\/[^\s]+(\n|.|\s)*(don'?t miss|Don'?t miss|Bots for u|Finally|💜|fax)/, // A link and a random message afterwards
      /^(\s*@.+)?\s*This\s*https:\/\/[^\s]+/, // This + link
      /^(\s*@.+)?\s*https:\/\/[^\s]+\s*[a-z]+\s*$/, // link + random "word"
      /PRIVATE S\*X/,
      /-{5,}/, // too many "-"
      /SPECIAL FOR YOU/, // common phrase
      (text) => {
        const smallLatinCaps = text.match(/[ᴀʙᴄᴅᴇғɢʜɪᴊᴋʟᴍɴᴏᴘᴏ̨ʀsᴛᴜᴠᴡxʏᴢ\s]/g)?.length ?? 0;
        return smallLatinCaps / text.length > 0.7 && text.length > 10;
      }
    ]
  }),
  site = getCurrentSite(),
  commentMutationListener = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        const text = getCommentText(node, site);
        if (text) {
          if (isCommentLikelyBotComment(text, site)) {
            node.style.display = "none";
          }
        }
      }
    }
  });

commentMutationListener.observe(document.body, {
  subtree: true,
  childList: true
});

/**
 * Determines whether a comment is likely spam.
 *
 * @param {String} text The comment's content
 * @param {Object} site The website the comment is from
 * @return {Boolean}
 */
function isCommentLikelyBotComment(text, siteChecks) {
  for (const check of siteChecks) {
    if (typeof check === "function") {
      if (check(text)) {
        return true;
      }
    } else {
      // assume regex
      if (check.test(text)) {
        return true;
      }
    }
  }
  return false;
}

function getCommentText(node, site) {
  switch (site) {
    case SITES.YOUTUBE: {
      if (node.nodeName === "YTD-COMMENT-RENDERER") {
        return node.querySelector("#content-text").textContent;
      }
    }
  }
  return null;
}

function getCurrentSite() {
  switch (location.hostname) {
    case "www.youtube.com": {
      return SITES.YOUTUBE;
    }
  }
}
