// ==UserScript==
// @name         Hide Bot Comments
// @namespace    https://theusaf.org
// @version      1.11.2
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
      hostname: "www.youtube.com",
      checks: [
        // starts with too much whitespace
        /^\s{2,}/,
        // only links and other punctuation
        /^(\s*@.+)?\s*(https:\/\/[^\s]+)(https:\/\/[^\s]+|\n.\s])+$/,
        // all caps and a link
        /^(\s*@.+)?\s*[A-Z\s\r\n!]*https:\/\/[^\s]+[A-Z\s\r\n!]*$/,
        // A link and a random message afterwards
        /^(\s*@.+)?\s*https:\/\/[^\s]+(\n|.|\s)*(It'll blow your mind\.|[dD]on'?t [mM]iss|Bots for u|Finally|💜|fax|only until|Bots are|:]|\.\.?\.$|I found it :|Do not miss this|:)|Ye[sp] ¤? (true|exactly)/i,
        // word + link
        /^(\s*@.+)?\s*(This|[Ww]ow!?|Last fight|Yo)\s*https:\/\/[^\s]+/,
        // phrase + line + link
        /(is a brain burner.*|10,000.*?!|by having this:|it.?s finally here|Finally it's here\.?(\s*YES)?|deceives.*subscribers:\.{1,}|you .*will never love.*|[\u0401\u0451\u0410-\u044f,.:]{15,}.*|HOW STRONG IS KETTLE\?!|EXPOSED:|IS FREAK!|IS GARBAGE!{1,}|shocking truth.*|his subscribers.*|will stop watching.*|yes\.?|THE GAME.*|After watching this video you will never love.*)(\n|\s)(\n|.)*https:\/\/[^\s]+/,
        // link + random "word"
        /^(\s*@.+)?\s*https:\/\/[^\s]+\s*[a-z]+\s*$/,
        // link with a star at the end??
        /https:\/\/youtu.be\/\w+\*/,
        // ...
        /SWEET-GIRL|xvideos|specialdate|HOTGIRL|PRIVATE S\*X|over 18|Anna is a beautiful girl|adult porn videos/i,
        // suspicious websites
        /beautyzone\.\w+|[a-z]+\.online|\.cam|lust\.\w+|[a-z]+\.monster|\.host|\.uno|\.fun|asian\w*\.\w+|she.*\.online|\w*teen\.\w+/i,
        // too many "-"
        /-{5,}/,
        // single, somewhat strange word
        /^(Hii|Ye|Bruhh|Aawww?|🆁🆄🅷\s?!*)$/,
        // common phrase
        /I'm not scared of ghosts,? and you\?|SCREAMING IN H[E3]LL BECAUSE MY.*?BETTER|I MADE.*VIDS|is bad i make better content|оп му с[hН]аппе[ІlL]|I MAKE.*CONTENT|my videos are better|^I.m better than|I UPLOAD.*VIDEO|I (make|made).*(video|content)| (● ´ω ｀ ●) ✨💕|[Oo]mg.*it.?s finally here|I POST [A-Z\s]*?VIDEOS|HATE COMMENT|I can read you mind brother|SPECIAL FOR YOU|l1ke my v1deo|small channel trying to grow| YouT\*ber|MY CONTENT|MY NAME|at my profile|My video|pedophile😱|MY WORLD RECORD|(^Yes.{0,5}$)|said this to a fan|Read my name|[Mm]y mom.*subscribers|r[\.\s]e[\.\s]a[\.\s]d[\.\s]? m[\.\s]y[\.\s]? n[\.\s]a[\.\s]m[\.\s]e|literally begging|MY VIDEOS?|my playlist|fucking cringe|[Dd][Oo][Nn].?[Tt] read my name/,
        // replies to bots/about bots
        /When the bots|@.*a bot|@Don'?t read my|@.*ok.*[Ii].*wont|remove bots|^(ro)?bot+$|with bots|hi bot|bots.*get worse|why are.*bots|bots.*everywhere|bot repl.*row|there are.{0,15}bots|oh god.*bots|report.*bots|so many.*?bots|holy bots|do nothing about bots|bots.*common/i,
        // upside down chars
        /[ㄥϛㄣƐᄅƖ⅄Λ∩┴ɹԀ˥ʞſפℲƎƆ∀ʎʍʌʇɹɯʞɾᴉɥƃɟǝɔɐ]/,
        // just a single, weird character
        /^.$/s,
        // invisible characters
        /[\u200e]/u,
        (text) => {
          const matches = text.match(/[\u{0E80}-\u{0EFF}]/gu)?.length ?? 0;
          if (matches / text.length > 0.5 && /Don.?t tran?slate|Do not tran?slate/i.test(text)) {
            return true;
          }
        },
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
      ],
      getCommentText(node) {
        if (node.nodeName === "YTD-COMMENT-RENDERER") {
          return node.querySelector("#content-text").textContent;
        }
      }
    },
    FACEBOOK_EMBED: {
      hostname: "www.facebook.com",
      checks: [
        // "Easy cash" scams
        /easy cash|earning money is very easy.*https?:\/\/|work online|real passive income|(making|paid|get) over \$?\d+k?|salary from home/s,
        // Scammy manga sites
        /(I liked it.*?recommend|try this manga.*?https?s:\/\/|you should try:|[Ss]hare a cartoon website|top [a-z]*?(comic|website)|there is no cost|try this one out|[Jj]ust read this|you [a-z\s]*?want [a-z\s]*?manga|(tons|a lot) of [a-z\s]*?man[gh][wu]?a|You can find the last part here|looking forward to seeing where this goes|YET ANOTHER RECOMMENDATION|enjoy another manga|I prefer this type of comic|hottest comics|Google led me|will love this one|I like this one: |FEE IS FREE|another [a-z\s]*?manga|WEBSITE[A-Z\s]*FREE|good read|must check this out|read more:|300 or more chapters|comics for free|website [a-z\s]*?manga:|favorite mange which I have read|\*{1,} SPOILER ALERT \*{1,}|FREE ACCESS|FREE (TO|FOR) READ).*(\n\s)*(https?:\/\/[^\s]+|\n.\s])+/,
        /geoagiphy\.com|.giphy\.com/,
        /(manga|story|site|website).*?:\s?(https?:\/\/[^\s]+|\n.\s])+$/,
        // Other weird comments/scams
        /look at a website|very popular .*?website|Amazon gift card/,
        /^i love sex$/
      ],
      options: {
        initialScan: () => {
          return document.querySelectorAll(".clearfix");
        }
      },
      getCommentText(node) {
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
  }),
  site = getCurrentSite(),
  commentMutationListener = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        const text = site.getCommentText(node);
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

function getCurrentSite() {
  for (let key in SITES) {
    const site = SITES[key];
    if (location.hostname === site.hostname) {
      return site;
    }
  }
}

if (site.options?.initialScan) {
  const items = site.options.initialScan();
  for (const node of items) {
    const text = site.getCommentText(node);
    if (text) {
      if (isCommentLikelyBotComment(text, site)) {
        node.style.display = "none";
      }
    }
  }
}
