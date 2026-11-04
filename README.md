# the cube: source

This branch is never deployed. `main` holds only the live site (`index.html` at the root), which OVH pulls through its webhook.

- `src/index.html`: the page to edit, with font placeholders (`%%SG400%%` and so on).
- `fonts/`: the woff2 files embedded at build time (SIL Open Font License).
- `build.py`: fills in the fonts and writes `index.html`.

To publish a change: edit `src/index.html`, run `python3 build.py`, then copy the resulting `index.html` to the root of `main` and push `main`.
