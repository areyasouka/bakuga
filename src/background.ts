import { DictEntry, WikiDictionary } from './dict';
import browser from "webextension-polyfill";
// import { Windows, Tabs } from 'webextension-polyfill';
import { onMessage } from "webext-bridge/background";

// import dictURL from './assets/wikidata_enja_enja.tsv?url'
import wordDict from './assets/wikidata_enja_enja.tsv?raw'
// const dictURL = new URL('./assets/wikidata_enja_enja.tsv', import.meta.url).href;

let dict: WikiDictionary;

function search(text: string): DictEntry | null {
  console.log('search', [text, dict]);
  if (!dict) {
    return null;
  }
  return dict.wordSearch(text);
}

// TODO fix https://github.com/zikaari/webext-bridge
onMessage('search', ({ data }) => {
  const { text, originalText } = data;
  const response = search(text);
  if (response) {
    response.originalText = originalText;
  }
  return response;
});

browser.runtime.onInstalled.addListener((details): void => {
  // const dictURL = new URL('./assets/wikidata_enja_enja.tsv', import.meta.url).href;
  console.log('onInstalled', details, wordDict.slice(0, 500) + '\n...\n' + wordDict.slice(-500));
  // fetch(dictURL).then(
  //   (r) => r.text()
  // ).then((wordDict) => {
  //   dict = new WikiDictionary(wordDict);
  //   console.log('extension installed', dict);
  // }).catch((error) => {
  //   console.error('Error:', error);
  // });
  dict = new WikiDictionary(wordDict);
});
