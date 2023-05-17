import { readFileSync } from 'fs';
import { join } from 'path';
import { WikiDictionary } from './dict';
import { expect, test } from "vitest";

test('test WikiDictionary wordSearch', () => {
  const dictPath = join(
    __dirname,
    'assets/wikidata_enja_enja.tsv'
  );
  console.log(dictPath);
  const wordDict = readFileSync(dictPath, 'utf8');
  const dict = new WikiDictionary(wordDict);
  const res = dict.wordSearch('this is a test. much wow');
  console.log(res);
  expect(res).toBeDefined();
});
