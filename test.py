import os
import re


def filelist():
    for root, dirnames, filenames in os.walk("site"):
        for filename in filenames:
            if filename.endswith(".html"):
                fname = os.path.join(root, filename).replace("\\", "/")
                print(fname)


strings = [
    '["Fractals, adapted by M"]',
    '["Petri, adapted by M"]',
    '["Petri, adapted by M"]',
    '["Petri, adapted by CC"]',
    '["Petri, adapted by M"]',
    '["Petri, adapted by M"]',
    '["Petri, adapted by M"]',
    '["Petri, adapted by CC"]',
    '["Petri, adapted by M"]',
    '["M, adapted from Petri"]',
    '["Neon, adapted from froggygolem"]',
    '["Neon, adapted from froggygolem"]',
    '["Neon, adapted from froggygolem"]',
    '["Fractals, adapted by M"]',
    '["M (adapted from StellarSymbols)"]',
    '["M, adapted from Plum"]',
]

adapted_by_pattern = re.compile(r"\[['\"](.+), adapted by (.+)['\"]\]", re.I)
adapted_from_pattern = re.compile(r"\[['\"](.+), adapted from (.+)['\"]\]", re.I)
adapted_from_pattern2 = re.compile(r"\[['\"](.+) \(adapted from (.+)\)['\"]\]", re.I)

for string in strings:

    if re.search(adapted_by_pattern, string):
        string = re.sub(adapted_by_pattern, r"['\1', '\2']", string)
    elif re.search(adapted_from_pattern, string):
        string = re.sub(adapted_from_pattern, r"['\2', '\1']", string)
    elif re.search(adapted_from_pattern2, string):
        string = re.sub(adapted_from_pattern2, r"['\2', '\1']", string)
    print(string)
