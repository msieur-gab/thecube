# the cube

Source of [thecu.be](https://thecu.be): one self-contained page, no cookies, no trackers, no third-party requests. The fonts are embedded in the page.

## Layout

- `src/index.html`: the page to edit. Font data is left as placeholders (`%%SG400%%` and so on).
- `fonts/`: the woff2 files the build embeds (SIL Open Font License, see the LICENSE files).
- `build.py`: fills in the fonts and writes `site/index.html`.
- `site/`: what the server receives. Commit it after every build.
- `.github/workflows/deploy.yml`: copies `site/` to the OVH server on every push to `main`.

## Change the page

    python3 build.py
    git add -A && git commit -m "…" && git push

The deploy checks that `site/index.html` matches the source, so a forgotten build fails loudly instead of shipping an old page.

## Go back to an earlier version

The first landing (the minefield page alone) is tagged `landing-v1`:

    git checkout landing-v1 -- src site
    git commit -m "Restore landing-v1" && git push

## Deploy setup (once)

In the repository settings on GitHub:

- **Secrets** (Settings → Secrets and variables → Actions → Secrets)
  - `DEPLOY_HOST`: the server address
  - `DEPLOY_USER`: the SSH user that may write to the web root
  - `DEPLOY_PATH`: the web root, for example `/var/www/thecu.be`
  - `DEPLOY_KEY`: a private SSH key used only for deploys (its public half goes in that user's `~/.ssh/authorized_keys`)
  - `DEPLOY_KNOWN_HOSTS`: the output of `ssh-keyscan -H <server address>`
- **Variables** (same page → Variables)
  - `DEPLOY_ENABLED`: set to `true` to switch deploys on
  - `DEPLOY_PORT`: only if SSH does not run on port 22
