import time

# Setup:
# pip3 install ujson qwikidata
# # modify to use "ujson" for faster wikidata parsing:
# vi ~/Library/Python/3.8/lib/python/site-packages/qwikidata/json_dump.py
# add: "import ujson as json"

from qwikidata.entity import WikidataItem
from qwikidata.json_dump import WikidataJsonDump
from qwikidata.utils import dump_entities_to_json

# wget https://dumps.wikimedia.org/wikidatawiki/entities/latest-all.json.gz
##### ~5.5hrs to download 80gb compressed
##### ~3.5hrs filter json and write tsv of mapping data

# Filter example:
# def has_occupation_politician(item: WikidataItem, truthy: bool = True) -> bool:
#     """Return True if the Wikidata Item has occupation politician."""
#     P_OCCUPATION = "P106"
#     Q_POLITICIAN = "Q82955"
#     if truthy:
#         claim_group = item.get_truthy_claim_group(P_OCCUPATION)
#     else:
#         claim_group = item.get_claim_group(P_OCCUPATION)
#     occupation_qids = [
#         claim.mainsnak.datavalue.value["id"]
#         for claim in claim_group
#         if claim.mainsnak.snaktype == "value"
#     ]
#     return Q_POLITICIAN in occupation_qids

def has_id(item: WikidataItem, id: str) -> bool:
    # >>> q42.entity_id # 'Q42'
    # >>> q42.entity_type # 'item'
    # >>> q42.get_label() # 'Douglas Adams'
    # >>> q42.get_description() # 'author and humorist'
    # >>> q42.get_aliases() # ['Douglas Noël Adams', 'Douglas Noel Adams', 'Douglas N. Adams']
    # >>> q42.get_enwiki_title() # 'Douglas Adams'
    # >>> q42.get_sitelinks()["enwiki"]["url"] # 'https://en.wikipedia.org/wiki/Douglas_Adams'
    return item.entity_id == id

def dump_entities_tsv(wjd_dump_path=None, from_langs=None, to_langs=None, tsv_path=None, entity_id=None, limit=None):
    out = open(tsv_path, "w")
    wjd = WikidataJsonDump(wjd_dump_path)
    t1 = time.time()
    term_count = 0
    for ii, entity_dict in enumerate(wjd):
        if limit:
            print(entity_dict)
            if ii > limit:
                break
            continue
        if entity_id:
            if has_id(entity, entity_id):
                print(entity_dict)
                break
            continue
        if entity_dict["type"] == "item":
            entity = WikidataItem(entity_dict)
            # if has_occupation_politician(entity):
                # politicians.append(entity)
            sitelinks = entity._entity_dict["sitelinks"] or {}
            sl = [sitelinks[l+"wiki"]["title"] for l in to_langs if l+"wiki" in sitelinks]
            if len(sl) == len(to_langs) and not sl[0].startswith("Category:") and not sl[0].startswith("Template:"):
                for from_lang in from_langs:
                    label = entity.get_label(from_lang)
                    label_count = len(entity._entity_dict["labels"])
                    aliases = entity.get_aliases(from_lang)
                    for txt in [label]+aliases:
                        out.write(txt+'\t'+str(label_count)+'\t'+'\t'.join(sl)+'\n')
                        term_count += 1
        if ii % 10000 == 0:
            t2 = time.time()
            dt = t2 - t1
            print("found {:,.0f} terms for {:,.0f}/~80,500,000 total entities [entities/s: {:,.0f}]".format(term_count, ii, ii / dt))
        # if ii > 10000:
        #     break
    print(wjd_dump_path)
    print(tsv_path)

if __name__ == "__main__":
    dump_entities_tsv(wjd_dump_path="./data/latest-all.json.gz", 
            from_langs=["en", "ja"], to_langs=["en", "ja"], 
            tsv_path="./data/wikidata_enja_enja.tsv",
            limit=None)


