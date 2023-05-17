/* eslint-disable @typescript-eslint/no-explicit-any */

export interface OriginalImage {
    source: string;
    width: number;
    height: number;
  }
  
  export interface WikiSummary {
    // type?: string;
    // title?: string;
    // displaytitle?: string;
    // namespace?:     Namespace;
    // wikibase_item?: string;
    // titles?:        Titles;
    // pageid?: number;
    thumbnail?: OriginalImage;
    // originalimage?: OriginalImage;
    lang?: string;
    // dir?: string;
    // revision?: string;
    // tid?: string;
    // timestamp?: Date;
    // description?: string;
    // content_urls?:  ContentUrls;
    // api_urls?:      APIUrls;
    // extract?: string;
    extract_html?: string;
  }
  
  export interface ResponseError {
    url: string;
    statusCode: number;
    statusText: string;
    responseText?: string;
    parseError?: string;
  }
  
  function parseJson<T = any>(res: Response): Promise<T> {
    const { status, statusText, url, ok } = res;
    const error: ResponseError = { statusCode: status, statusText, url };
    return res.text().then((text) => {
      error.responseText = text;
      let json = null;
      try {
        json = JSON.parse(text);
        if (ok) return json;
      } catch (err) {
        error.parseError = err instanceof Error ? err.message : 'Unknown error.';
      }
      return error;
    });
  }
  
  async function getWikiSummary(
    lang: string,
    entry: string
  ): Promise<WikiSummary> {
    const apiUrl = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${entry}?redirect=true`;
    return fetch(apiUrl).then(parseJson);
  }
  
  async function entryHtml(lang: string, entry: string): Promise<string> {
    const ent = await getWikiSummary(lang, entry);
    return `<table><tr><td>${ent.thumbnail
        ? `<img src="${ent.thumbnail?.source}" style="width: 100px; display: inline; margin: 0 5px;" />`
        : ''
      }</td><td>${ent.extract_html}</td></tr></table>`;
  }
  
  async function makeHtml(result: any): Promise<string> {
    console.log('makeHtml', result);
    let entry;
    let html = '';
    const texts = [];
  
    if (result === null) return '';
  
    for (let i = 0; i < result.data.length; i += 1) {
      entry = result.data[i][0].split('	'); // "本¥t210¥tBook¥t本"
      console.log('entry=', entry);
      // eslint-disable-next-line no-continue
      if (!entry) continue;
  
      // Definition
      html += `<br><span class="w-def">${entry[0]} [${entry[1]}]: ${entry[2]} ↔ ${entry[3]}</span><br>`;
      html += await entryHtml('en', entry[2]);
      html += await entryHtml('ja', entry[3]);
      texts[i] = entry;
    }
  
    console.log('makeHtml html=', html);
    return html;
  }
  
  export default makeHtml;