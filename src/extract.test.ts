// import { readFileSync } from 'fs';
// import { join } from 'path';
import { getText, getTextFromNode } from './extract';
import { expect, test } from "vitest"
import { JSDOM } from 'jsdom';

/**
 * @vitest-environment jsdom
 */

test('test getText', () => {
  const dom = new JSDOM(`
      <div>
        <p>Hello, world!</p>
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
        </ul>
      </div>
    `);
  const res = getText(dom, 2, [], 250);
  console.log(res);
  expect(res).toBeDefined();
});

function getFirstChildTextNode(element: HTMLElement): Node | null {
  let node = element.firstChild;
  while (node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return node;
    }
    node = node.nextSibling || node.firstChild;
  }
  return null;
}

test('test getTextFromNode', () => {
  const dom = new JSDOM(`<div><p>Hello, <b>AMAZING</b> world!</p>
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
        </ul>
      </div>
    `), doc = dom.window.document;
  const res = getTextFromNode(getFirstChildTextNode(doc.firstChild as HTMLElement), 3);
  console.log(res);
  expect(res).toBeDefined();
});

