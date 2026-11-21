Race Career v3.1.5 - source patch

This archive contains the updated cloud-sync-core.mjs, its tests, and apply_v315.py.
The patcher updates the current repository versions of cloud.js, index.html and sw.js
and creates CHANGELOG_v3.1.5.txt. It does not touch Firebase or career data.

HOW TO APPLY
1. Download or clone https://github.com/ercicho/motorsport-career
2. Make a new branch: git checkout -b fix/cloud-sync-license-v3.1.5
3. Copy apply_v315.py into the repository root.
4. Run: python3 apply_v315.py
5. Copy cloud-sync-core.test.mjs into the repository root.
6. Run: node --test cloud-sync-core.test.mjs
7. Review changes: git diff
8. Commit, push branch, open a PR. Do not merge before testing on iPhone.

The patcher requires the exact v3.1.4 source version inspected on 2026-11-21.
If a search pattern fails, STOP: the source has changed; do not force the patch.

IMPORTANT: Back up the career JSON before deploying. Tests cover pure sync comparison,
not live Firebase, Safari/PWA, or all concurrent UI actions. Check these manually.
