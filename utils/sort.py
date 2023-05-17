import time

def sort_tsv(tsv_path=None, sorted_tsv_path=None):
    t1 = time.time()
    lines = open(tsv_path, encoding='utf-8').readlines()
    lines = [l.split('\t') for l in lines]
    lines = [[l[0], int(l[1]), l[2], l[3]] for l in lines]
    lines = sorted(lines, key=lambda l: (l[0], -l[1], l[2]))
    t2 = time.time()
    dt = t2 - t1
    term_count = len(lines)
    print("sorted {:,.0f} terms /~80,500,000 total entities [entities/s: {:,.0f}]".format(term_count, dt))
    fo = open(sorted_tsv_path, 'w', encoding='utf-8')
    fo.writelines(['\t'.join([l[0], str(l[1]), l[2], l[3]]) for l in lines])
    print(tsv_path)
    print(sorted_tsv_path)

if __name__ == "__main__":
    sort_tsv(
            tsv_path="./data/wikidata_enja_enja.tsv",
            sorted_tsv_path="./data/wikidata_enja_enja_sorted.tsv",
            )

