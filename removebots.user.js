// ==UserScript==
// @name         Hide Bot Comments
// @namespace    https://theusaf.org
// @version      1.4.1
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
      /^(\s*@.+)?\s*(https:\/\/[^\s]+)(https:\/\/[^\s]+|\n.\s])+$/, // only links and other punctuation
      /^(\s*@.+)?\s*[A-Z\s\r\n!]*https:\/\/[^\s]+[A-Z\s\r\n!]*$/, // all caps and a link
      /^(\s*@.+)?\s*https:\/\/[^\s]+(\n|.|\s)*([dD]on'?t [mM]iss|Bots for u|Finally|💜|fax|only until|Bots are|:]|I found it :|Yes true)/i, // A link and a random message afterwards
      /^(\s*@.+)?\s*(This|[Ww]ow!?)\s*https:\/\/[^\s]+/, // word + link
      /^(\s*@.+)?\s*https:\/\/[^\s]+\s*[a-z]+\s*$/, // link + random "word"
      /PRIVATE S\*X|over 18/, // ...
      /beautyzone\.\w+|\.cam|lust\.\w+/i, // suspicious websites
      /-{5,}/, // too many "-"
      /SPECIAL FOR YOU|MY CONTENT|My mom.*subscribers|literally begging|MY VIDEOS|fucking cringe|Don'?t read my name/i, // common phrase
      /[ㄥϛㄣƐᄅƖ⅄Λ∩┴ɹԀ˥ʞſפℲƎƆ∀ʎʍʌʇɹɯʞɾᴉɥƃɟǝɔɐ]/, // upside down chars
      (text) => {
        const charSets = [
          {
            regex: /[ᴀʙᴄᴅᴇғɢʜɪᴊᴋʟᴍɴᴏᴘᴏ̨ʀsᴛᴜᴠᴡxʏᴢ\s]/g,
            matchPercent: 0.5
          },
          {
            regex: /[\u{1D538}-\u{1D56B}]/gu, // math letter symbols
            matchPercent: 0.5
          }
        ];
        for (const check of charSets) {
          const { regex, matchPercent } = check,
            matches = text.match(regex)?.length ?? 0;
          if (matches / text.length > matchPercent && text.length > 10) {
            return true;
          }
        }
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
