// ==UserScript==
// @name         Hide Bot Comments
// @namespace    https://theusaf.org
// @version      1.7.4
// @description  Removes comments made by bots on websites such as YouTube.
// @author       theusaf
// @match        https://www.youtube.com/**
// @match        https://www.facebook.com/plugins/comments.php*
// @match        https://www.facebook.com/plugins/feedback.php*
// @copyright    2022 theusaf
// @license      MIT
// @grant        none
// ==/UserScript==

const SITES = Object.freeze({
    YOUTUBE: {
      checks: [
        // starts with too much whitespace
        /^\s{2,}/,
        // only links and other punctuation
        /^(\s*@.+)?\s*(https:\/\/[^\s]+)(https:\/\/[^\s]+|\n.\s])+$/,
        // all caps and a link
        /^(\s*@.+)?\s*[A-Z\s\r\n!]*https:\/\/[^\s]+[A-Z\s\r\n!]*$/,
        // A link and a random message afterwards
        /^(\s*@.+)?\s*https:\/\/[^\s]+(\n|.|\s)*(It'll blow your mind\.|[dD]on'?t [mM]iss|Bots for u|Finally|💜|fax|only until|Bots are|:]|I found it :|Do not miss this|:\)|Ye[sp] ¤? (true|exactly)|(...?$))/i,
        // word + link
        /^(\s*@.+)?\s*(This|[Ww]ow!?)\s*https:\/\/[^\s]+/,
        // phrase + line + link
        /(is a brain burner.*|Finally it's here\.?|deceives.*subscribers:\.{1,}|you .*will never love.*|[\u0401\u0451\u0410-\u044f,.:]{15,}.*|EXPOSED:|IS FREAK!|IS GARBAGE!{1,}|shocking truth.*|his subscribers.*|will stop watching.*|yes\.?|THE GAME.*|After watching this video you will never love.*)(\n|\s)(\n|.)*https:\/\/[^\s]+/,
        // link + random "word"
        /^(\s*@.+)?\s*https:\/\/[^\s]+\s*[a-z]+\s*$/,
        // link with a star at the end??
        /https:\/\/youtu.be\/\w+\*/,
        // ...
        /SWEET-GIRL|PRIVATE S\*X|over 18|Anna is a beautiful girl/i,
        // suspicious websites
        /beautyzone\.\w+|\.cam|lust\.\w+|\.host|\.uno|asian\w*\.\w+|\w*teen\.\w+/i,
        // too many "-"
        /-{5,}/,
        // single, somewhat strange word
        /^(Hii|Ye|Bruhh|Aawww?)$/,
        // common phrase
        / (● ´ω ｀ ●) ✨💕|I can read you mind brother|SPECIAL FOR YOU|l1ke my v1deo|small channel trying to grow| YouT\*ber|MY CONTENT|MY NAME|My video|pedophile😱|MY WORLD RECORD|(^Yes.{0,5}$)|said this to a fan|Read my name|[Mm]y mom.*subscribers|literally begging|MY VIDEOS?|my playlist|fucking cringe|[Dd][Oo][Nn]'?[Tt] read my name/,
        // replies to bots
        /@Don'?t read my|^(ro)?bot+$/i,
        // upside down chars
        /[ㄥϛㄣƐᄅƖ⅄Λ∩┴ɹԀ˥ʞſפℲƎƆ∀ʎʍʌʇɹɯʞɾᴉɥƃɟǝɔɐ]/,
        // just a single, weird character
        /^.$/,
        // invisible characters
        /[\u200e]/u,
        (text) => {
          const charSets = [
            {
              regex: /[\u{fe27}-\u{fe2f}\u{1df5}-\u{1dff}\u{1dc0}-\u{1de6}\u{1ab0}-\u{1abe}\u{0300}-\u{0333}\u{0339}-\u{033f}\u{0346}-\u{034a}\u{034b}-\u{034e}\u{0350}-\u{0357}\u{0358}-\u{035b}]/gu, // weird combining characters
              matchPercent: 0.4
            },
            {
              regex: /[ᴀʙᴄᴅᴇғɢʜɪᴊᴋʟᴍɴᴏᴘᴏ̨ʀsᴛᴜᴠᴡxʏᴢ\s]/g,
              matchPercent: 0.5
            },
            {
              regex: /[\u{1D538}-\u{1D56B}\u{1D400}-\u{1D433}]/gu, // math letter symbols
              matchPercent: 0.3
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
    },
    FACEBOOK_EMBED: {
      checks: [
        // "Easy cash" scams
        /easy cash|work online|real passive income/,
        // Scammy manga sites
        /(must check this out|read more:|300 or more chapters|\*{1,} SPOILER ALERT \*{1,}|FREE (TO|FOR) READ).*(\n\s)*(https?:\/\/[^\s]+|\n.\s])+/
      ],
      options: {
        initialScan: () => {
          return document.querySelectorAll(".clearfix");
        }
      }
    }
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
function isCommentLikelyBotComment(text, site) {
  for (const check of site.checks) {
    if (typeof check === "function") {
      if (check(text)) {
        console.log("Filter Check Failed");
        console.log(text);
        return true;
      }
    } else {
      // assume regex
      if (check.test(text)) {
        console.log("Regex Check Failed");
        console.log(check);
        console.log(text);
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
      break;
    }
    case SITES.FACEBOOK_EMBED: {
      if (node.classList?.contains("clearfix")) {
        try {
          return node?.lastElementChild
            .lastElementChild
            .lastElementChild
            .firstElementChild
            .children[1]
            .textContent;
        } catch (err) {
          return null;
        }
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
    case "www.facebook.com": {
      return SITES.FACEBOOK_EMBED;
    }
  }
}

if (site.options?.initialScan) {
  const items = site.options.initialScan();
  for (const node of items) {
    const text = getCommentText(node, site);
    if (text) {
      if (isCommentLikelyBotComment(text, site)) {
        node.style.display = "none";
      }
    }
  }
}
