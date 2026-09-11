# Owner's workflow

The owner exclusively controls publishing and `git push`. Do not push, open pull requests, or deploy. Do not request permission for those actions unless the owner explicitly changes this rule.

Git remotes, `git init`, and local branch setup are allowed when the owner asks for them. Do not create commits unless the owner asks.

Production is Cloudflare Pages, same as grand-theft-horse: feature branch → GitHub PR → merge to `master` deploys. Branch pushes get Pages preview URLs. Do not treat `npm run deploy` as the production path.

# Project facts

- This is Unbridled: a 3-lane 3D horse endless runner at unbridled.max.horse.
- `dist/` is the editable game source, not generated build output.
- There is no build step and there are no npm dependencies to install. Three.js 0.180 is vendored in `dist/assets/`.
- Start with `npm run dev`. Run `npm test` for the 16 gameplay regression checks.
- Read `README.md` for controls, testing limits, and deploy notes.
