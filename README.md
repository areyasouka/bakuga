# Bakuga - Multilingual Wikipedia Popup Definitions

Browser extension to add Multilingual Wikipedia Popup hints to any page

**(warning: alpha version, prototype)**

<a href="https://twitter.com/arex"><img src="https://img.shields.io/twitter/follow/arex" alt="Follow @arex"></a>
  [Postmeta.com](https://postmeta.com)

### Features

- Show multilingual wikipedia popup hints on any webpage (via web extension, browser plugin)
- Great for language acquisition and reading complex journal articles
  
<img src="https://raw.githubusercontent.com/areyasouka/bakuga/main/docs/screenshot.png" alt="Screenshot showing wikipedia popup" title="Bakuga wikipedia popup screenshot" width="640">

### Dependencies

- npm
- https://crxjs.dev/vite-plugin

### Build

```sh
gunzip -c ./data/wikidata_enja_enja.tsv.gz > ./src/assets/wikidata_enja_enja.tsv
npm i
npm run build
npm run dev
# load unpacked extension from ./dist folder in browser extensions dev mode
```

### Generate Dictionary TSV (optional)

```sh
pip3 install ujson qwikidata
vi ~/Library/Python/3.8/lib/python/site-packages/qwikidata/json_dump.py
# import ujson as json

# ~5.5hrs to download 80gb compressed
wget https://dumps.wikimedia.org/wikidatawiki/entities/latest-all.json.gz -P ./data

# ~3.5hrs filter json and write tsv of mapping data
python3 ./utils/extract.py
python3 ./utils/sort.py

mv ./data/wikidata_enja_enja_sorted.tsv ./src/assets/wikidata_enja_enja.tsv

# rebuild
```

## TODO

- improve dom parsing, backtrack to first real break in dom and parse sentence left to right doing longest normalized string matching from index data, return entities and positions in dom for highlight, identify closest (or under-cursor) entity for highlight and popup  
- support Chinese/Japanese etc by left-right parsing longest string matches
  - exact match first
  - later try stemming, rem suffixes or JP conjugated endings
- highlight matched text, embed tag around text and apply highlight style
- remove jquery dependency
