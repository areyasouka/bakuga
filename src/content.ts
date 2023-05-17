// import browser from "webextension-polyfill";
import { sendMessage } from "webext-bridge/content-script";
import $ from 'jquery';
import './index.css';
import { getText, findNextTextNode } from "./extract";
import makeHtml from "./popup";

/* eslint-disable @typescript-eslint/no-explicit-any */

let savedTarget: any;

let savedRangeNode: any;

let savedRangeOffset: any;

let selText: any;

let clientX: any;

let clientY: any;

let selStartDelta: any;

let popX = 0;

let popY = 0;

let timer: any;

let savedSelStartOffset = 0;

let savedSelEndList: any[] = [];

// regular expression for zero-width non-joiner U+200C &zwnj;
const zwnj = /\u200c/g;

function hidePopup(): void {
  const popup = document.getElementById('bakuga-popup');
  if (popup) {
    popup.style.display = 'none';
    popup.textContent = '';
  }
}

function clearHighlight(): void {
  if (selText === null) {
    return;
  }

  const selection: any = window.getSelection();
  if (selection.isCollapsed || selText === selection.toString()) {
    selection.empty();
  }
  selText = null;
}

function highlightMatch(
  doc: any,
  rangeStartNode: any,
  rangeStartOffset: any,
  matchLen: any,
  selEndList: any
): void {
  if (!selEndList || selEndList.length === 0) return;

  let selEnd;
  let offset = rangeStartOffset + matchLen;

  for (let i = 0, len = selEndList.length; i < len; i += 1) {
    selEnd = selEndList[i];
    if (offset <= selEnd.offset) {
      break;
    }
    offset -= selEnd.offset;
  }

  const range = doc.createRange();
  range.setStart(rangeStartNode, rangeStartOffset);
  range.setEnd(selEnd.node, offset);

  const sel: any = window.getSelection();
  if (!sel.isCollapsed && selText !== sel.toString()) return;
  sel.empty();
  sel.addRange(range);
  selText = sel.toString();
}

function showPopup(html: any, elem?: any, x1 = 0, y1 = 0): void {
  let x = x1;
  let y = y1;
  let popup = document.getElementById('bakuga-popup');

  if (!popup) {
    popup = document.createElement('div');
    popup.setAttribute('id', 'bakuga-popup');
    document.documentElement.appendChild(popup);
  }

  popup.style.width = 'auto';
  popup.style.height = 'auto';
  popup.style.maxWidth = '480px';
  popup.className = 'background-yellow';

  popup.innerHTML = html;
  console.log(['showPopup', x, y, popup, elem, html]);

  if (elem) {
    popup.style.top = '-1000px';
    popup.style.left = '0px';
    popup.style.display = '';

    let pW = popup.offsetWidth;
    let pH = popup.offsetHeight;

    if (pW <= 0) {
      pW = 200;
    }
    if (pH <= 0) {
      pH = 0;
      let j = 0;
      while (j !== -1) {
        j = html.indexOf('<br/>', j);
        if (j === -1) break;
        j += 5;
        pH += 22;
      }
      pH += 25;
    }
    if (elem instanceof window.HTMLOptionElement) {
      x = 0;
      y = 0;

      let p: any = elem;
      while (p) {
        x += p.offsetLeft;
        y += p.offsetTop;
        p = p.offsetParent;
      }
      const { parentNode }: { parentNode: any } = elem;
      if (parentNode && elem.offsetTop > parentNode.clientHeight) {
        y -= elem.offsetTop;
      }

      if (x + popup.offsetWidth > window.innerWidth) {
        // too much to the right, go left
        x -= popup.offsetWidth + 5;
        if (x < 0) {
          x = 0;
        }
      } else {
        // use SELECT's width
        x += parentNode.offsetWidth + 5;
      }
    } else {
      // go left if necessary
      if (x + pW > window.innerWidth - 20) {
        x = window.innerWidth - pW - 20;
        if (x < 0) {
          x = 0;
        }
      }

      // below the mouse
      const v = 25;

      // go up if necessary
      if (y + v + pH > window.innerHeight) {
        const t = y - pH - 30;
        if (t >= 0) {
          y = t;
        }
      } else {
        y += v;
      }

      x += window.scrollX;
      y += window.scrollY;
    }
  } else {
    x += window.scrollX;
    y += window.scrollY;
  }

  // (-1, -1) indicates: leave position unchanged
  if (x !== -1 && y !== -1) {
    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;
    popup.style.display = '';
  }
}

async function processSearchResult(result: any): Promise<number> {
  console.log('processSearchResult', result);
  const selStartOffset = savedSelStartOffset;
  const selEndList = savedSelEndList;

  if (!result || result === 'done') {
    hidePopup();
    clearHighlight();
    return 0;
  }

  let index = 0;
  for (let i = 0; i < result.matchLen; i += 1) {
    // Google Docs workaround: determine the correct highlight length
    while (result.originalText[index] === '\u200c') {
      index += 1;
    }
    index += 1;
  }
  const highlightLength = index;

  selStartDelta = selStartOffset - savedRangeOffset;

  const rangeNode = savedRangeNode;
  // don't try to highlight form elements
  if (rangeNode && !('form' in savedTarget)) {
    const doc = rangeNode.ownerDocument;
    if (!doc) {
      clearHighlight();
      hidePopup();
      return 0;
    }
    highlightMatch(doc, rangeNode, selStartOffset, highlightLength, selEndList);
  }

  showPopup(await makeHtml(result), savedTarget, popX, popY);
  return 0;
}

// function findPreviousTextNode(root: any, previous: any): Node | null {
//   if (root === null) {
//     return null;
//   }
//   const nodeIterator = document.createNodeIterator(
//     root,
//     NodeFilter.SHOW_TEXT,
//     null
//   );
//   let node = nodeIterator.nextNode();
//   while (node !== previous) {
//     node = nodeIterator.nextNode();
//     if (node === null) {
//       return findPreviousTextNode(root.parentNode, previous);
//     }
//   }
//   nodeIterator.previousNode();
//   const result = nodeIterator.previousNode();
//   if (result !== null) {
//     return result;
//   }
//   return findPreviousTextNode(root.parentNode, previous);
// }

async function triggerSearch(): Promise<number> {
  const rangeNode = savedRangeNode;
  const selStartOffset = savedRangeOffset + selStartDelta;
  console.log('triggerSearch', rangeNode, selStartOffset);

  if (!rangeNode) {
    clearHighlight();
    hidePopup();
    return 1;
  }

  if (selStartOffset < 0 || rangeNode.data.length <= selStartOffset) {
    clearHighlight();
    hidePopup();
    return 2;
  }

  const selEndList: any[] = [];
  console.log('getText', rangeNode, selStartOffset, selEndList);
  const originalText = getText(
    rangeNode,
    selStartOffset,
    selEndList,
    30 /* maxlength */
  );

  // Workaround for Google Docs: remove zero-width non-joiner &zwnj;
  const text = originalText.replace(zwnj, '');

  savedSelStartOffset = selStartOffset;
  savedSelEndList = selEndList;

  console.log('sendMessage', text, originalText, processSearchResult);
  const res = await sendMessage('search', {
      text,
      originalText,
    }, 
    'background');
  return processSearchResult(res);
}

function makeDiv(input: any): HTMLElement {
  const div = document.createElement('div');

  div.id = 'bakugaDiv';

  let text;
  if (input.value) {
    text = input.value;
  } else {
    text = '';
  }
  div.innerText = text;

  div.style.cssText = window.getComputedStyle(input, '').cssText;
  div.scrollTop = input.scrollTop;
  div.scrollLeft = input.scrollLeft;
  div.style.position = 'absolute';
  div.style.zIndex = '7000';
  const inputElem = $(input);
  if (inputElem) {
    const offset = inputElem.offset();
    if (offset)
      $(div).offset({
        top: offset.top,
        left: offset.left,
      });
  }

  return div;
}

function onMouseMove(mouseMove: any): void {
  // console.log("onMouseMove start", mouseMove);
  if (
    mouseMove.target.nodeName === 'TEXTAREA' ||
    mouseMove.target.nodeName === 'INPUT' ||
    mouseMove.target.nodeName === 'DIV'
  ) {
    let div = document.getElementById('bakugaDiv');

    if (mouseMove.altKey) {
      if (
        !div &&
        (mouseMove.target.nodeName === 'TEXTAREA' ||
          mouseMove.target.nodeName === 'INPUT')
      ) {
        div = makeDiv(mouseMove.target);
        document.body.appendChild(div);
        div.scrollTop = mouseMove.target.scrollTop;
        div.scrollLeft = mouseMove.target.scrollLeft;
      }
    } else if (div) {
      document.body.removeChild(div);
    }
  }

  if (clientX && clientY) {
    if (mouseMove.clientX === clientX && mouseMove.clientY === clientY) {
      return;
    }
  }
  clientX = mouseMove.clientX;
  clientY = mouseMove.clientY;

  let range: Range | null = null;
  let rangeNode: any | null = null;
  let rangeOffset = 0;

  // Handle Chrome and Firefox
  if (document.caretRangeFromPoint) {
    range = document.caretRangeFromPoint(mouseMove.clientX, mouseMove.clientY);
    if (range === null) {
      return;
    }
    rangeNode = range.startContainer;
    rangeOffset = range.startOffset;
    // } else if (document.caretPositionFromPoint) {
    //   const rangecp = document.caretPositionFromPoint(
    //     mouseMove.clientX,
    //     mouseMove.clientY
    //   );
    //   if (rangecp === null) {
    //     return;
    //   }
    //   rangeNode = rangecp.offsetNode;
    //   rangeOffset = rangecp.offset;
  }

  if (
    mouseMove.target === savedTarget &&
    rangeNode === savedRangeNode &&
    rangeOffset === savedRangeOffset
  ) {
    return;
  }

  if (timer) {
    clearTimeout(timer);
    timer = null;
  }

  if (rangeNode && rangeNode.data && rangeOffset === rangeNode.data.length) {
    rangeNode = findNextTextNode(rangeNode.parentNode, rangeNode);
    rangeOffset = 0;
  }

  if (!rangeNode || rangeNode.parentNode !== mouseMove.target) {
    rangeNode = null;
    rangeOffset = -1;
  }

  savedTarget = mouseMove.target;
  savedRangeNode = rangeNode;
  savedRangeOffset = rangeOffset;

  // console.log("onMouseMove", savedRangeNode, savedRangeOffset);

  selStartDelta = 0;

  if (rangeNode && rangeNode.data && rangeOffset < rangeNode.data.length) {
    popX = mouseMove.clientX;
    popY = mouseMove.clientY;
    timer = setTimeout(triggerSearch, 50);
    return;
  }

  // don't close on slight move
  const dx = popX - mouseMove.clientX;
  const dy = popY - mouseMove.clientY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance > 4) {
    clearHighlight();
    hidePopup();
  }
}

document.addEventListener('mousemove', onMouseMove);

export { };
