/* eslint-disable @typescript-eslint/no-explicit-any */

// modifies selEndList as a side-effect
function getTextFromSingleNode(
  node: any,
  selEndList: any,
  maxLength: any
): string {
  let endIndex;

  if (node.nodeName === '#text') {
    endIndex = Math.min(maxLength, node.data.length);
    selEndList.push({
      node,
      offset: endIndex,
    });
    return node.data.substring(0, endIndex);
  }
  return '';
}

function findNextTextNode(root: any, previous: any): Node | null {
  if (root === null) {
    return null;
  }
  const nodeIterator = document.createNodeIterator(
    root,
    NodeFilter.SHOW_TEXT,
    null
  );
  let node = nodeIterator.nextNode();
  while (node !== previous) {
    node = nodeIterator.nextNode();
    if (node === null) {
      return findNextTextNode(root.parentNode, previous);
    }
  }
  const result = nodeIterator.nextNode();
  if (result !== null) {
    return result;
  }
  return findNextTextNode(root.parentNode, previous);
}

// modifies selEndList as a side-effect
function getText(
  startNode: any,
  offset: any,
  selEndList: any,
  maxLength: any
): string {
  let text = '';

  if (startNode.nodeType !== Node.TEXT_NODE) {
    return '';
  }

  const endIndex = Math.min(startNode.data.length, offset + maxLength);
  text += startNode.data.substring(offset, endIndex);
  selEndList.push({
    node: startNode,
    offset: endIndex,
  });

  let nextNode = startNode;
  while (text.length < maxLength) {
    nextNode = findNextTextNode(nextNode.parentNode, nextNode);
    if (nextNode === null) break;
    text += getTextFromSingleNode(
      nextNode,
      selEndList,
      maxLength - text.length
    );
  }

  return text;
}


// TODO https://stackoverflow.com/a/30586239
function getTextFromNode(textNode: any, offset: number) {
  const data = textNode.textContent ?? "";

  // Sometimes the offset can be at the 'length' of the data.
  // It might be a bug with this 'experimental' feature
  // Compensate for this below
  if (offset >= data.length) {
    offset = data.length - 1;
  }

  // Ignore the cursor on spaces - these aren't words
  if (isW(data[offset])) {
    return "";
  }

  // Scan behind the current character until whitespace is found, or beginning
  let i = offset,
    begin = offset,
    end = offset;
  while (i > 0 && !isW(data[i - 1])) {
    i--;
  }
  begin = i;

  // Scan ahead of the current character until whitespace is found, or end
  i = offset;
  while (i < data.length - 1 && !isW(data[i + 1])) {
    i++;
  }
  end = i;

  // This is our temporary word
  let word = data.substring(begin, end + 1);

  // If at a node boundary, cross over and see what 
  // the next word is and check if this should be added to our temp word
  if (end === data.length - 1 || begin === 0) {

    const nextNode = getNextNode(textNode);
    const prevNode = getPrevNode(textNode);

    // Get the next node text
    if (end == data.length - 1 && nextNode) {
      const nextText = nextNode.textContent || "";

      // Add the letters from the next text block until a whitespace, or end
      i = 0;
      while (i < nextText.length && !isW(nextText[i])) {
        word += nextText[i++];
      }

    } else if (begin === 0 && prevNode) {
      // Get the previous node text
      const prevText = prevNode.textContent || "";

      // Add the letters from the next text block until a whitespace, or end
      i = prevText.length - 1;
      while (i >= 0 && !isW(prevText[i])) {
        word = prevText[i--] + word;
      }
    }
  }
  return word;
}

// Get the full word the cursor is over regardless of span breaks
function getFullWord(event: any) {
  // Firefox, Safari
  // REF: https://developer.mozilla.org/en-US/docs/Web/API/Document/caretPositionFromPoint
  // else if (document.caretPositionFromPoint) {
  //   range = document.caretPositionFromPoint(event.clientX, event.clientY);
  //   textNode = range.offsetNode;
  //   offset = range.offset;

  // Chrome
  // REF: https://developer.mozilla.org/en-US/docs/Web/API/document/caretRangeFromPoint
  // } else 
  // if (document.caretRangeFromPoint) {
  const range = document.caretRangeFromPoint(event.clientX, event.clientY);
  const textNode = range?.startContainer;
  const offset = range?.startOffset || 0;
  // }

  // Only act on text nodes
  if (!textNode || textNode.nodeType !== Node.TEXT_NODE) {
    return "";
  }

  return getTextFromNode(textNode, offset);
}

// Helper functions

// Whitespace checker
function isW(s: string) {
  return /[ \f\n\r\t\v\u00A0\u2028\u2029]/.test(s);
}

// Barrier nodes are BR, DIV, P, PRE, TD, TR, ... 
function isBarrierNode(node: Node | null) {
  return node ? /^(BR|DIV|P|PRE|TD|TR|TABLE)$/i.test(node.nodeName) : true;
}

// Try to find the next adjacent node
function getNextNode(node: Node) {
  let n = null;
  // Does this node have a sibling?
  if (node.nextSibling) {
    n = node.nextSibling;

    // Does this node's container have a sibling?
  } else if (node.parentNode && node.parentNode.nextSibling) {
    n = node.parentNode.nextSibling;
  }
  return isBarrierNode(n) ? null : n;
}

// Try to find the prev adjacent node
function getPrevNode(node: Node) {
  let n = null;

  // Does this node have a sibling?
  if (node.previousSibling) {
    n = node.previousSibling;

    // Doe this node's container have a sibling?
  } else if (node.parentNode && node.parentNode.previousSibling) {
    n = node.parentNode.previousSibling;
  }
  return isBarrierNode(n) ? null : n;
}

// REF: http://stackoverflow.com/questions/3127369/how-to-get-selected-textnode-in-contenteditable-div-in-ie
// function getChildIndex(node: Node | null | undefined) {
//   let i = 0;
//   while ((node = node?.previousSibling)) {
//     i++;
//   }
//   return i;
// }

export { getText, findNextTextNode, getFullWord, getTextFromNode };
