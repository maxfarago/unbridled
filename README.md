# Unbridled

a horsey endless runner at [unbridled.max.horse](https://unbridled.max.horse). mobile-friendly. heavily inspired by the artwork of [eyvind earle](https://www.wikiart.org/en/eyvind-earle). part of the [max.horse](https://max.horse) arcade.

## overview

self-contained static game: vendored three.js, no backend. ai generated desert paintings using earle artwork as reference images. serve `dist/` over http — no install, no accounts, no leaderboard.

#### controls

- phone: swipe to steer, jump, and duck
- desktop: arrows to steer; space or up-arrow to jump; down-arrow to duck

#### rules

- three hearts; apples replenish
- jump fences, duck bees, jump or dodge mud
- carrots stack a four-second speed rush
- golden horseshoes grant five seconds of invincibility
- pickup streaks grow a score multiplier

three.js 0.180 is vendored under mit. see `dist/assets/THREE-LICENSE.txt`.

## agents

rules for agents live in [`AGENTS.md`](AGENTS.md). default branch is `master`.
