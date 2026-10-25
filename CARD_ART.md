# Card artwork and collection layout

Each of the 24 creatures now has two layouts:

- Basic: element-colored card, separate illustration window, name/HP header and two attacks. A transparent `art/<id>-creature.webp` is drawn above the scene background.
- Illustration: the existing complete image referenced by `cards.json`, displayed without extra stats or a replacement frame.

The four collectible finishes remain 96 variants: Basic (65%), Basic Holo (25%), Illustration Rare (8%), and Prisma Illustration (2%). Each draw is independent. Prisma uses an external violet glow and plaque; it no longer paints rainbow bands across the creature or text. Basic Holo has a separate animated foil layer behind the opaque creature inside its illustration window. Reduced motion disables the animation.

Old collection entries used the illustration artwork for every finish. The one-time catalog version 2 migration maps base/rare to Illustration Rare and holo/prism to Prisma Illustration, merging duplicates while preserving the total number of copies and pack progress. The previous save is backed up under `monzuki.collection.v1.before-card-layout-v2`. New basic cards can then be collected separately.

Creature sprites and the launcher icon were made with the built-in image generator. Prompts are in `art/creature-prompts.json` and `art/app-icon-prompt.json`. Android launcher assets are under `android-app/app/src/main/res/`. Creature exports retain alpha and their original 1254×1254 resolution.

Run `node tests/collection.cjs` for collection migration, pack/sweep locking, rarity boundary and card layout checks. Android CI verifies that all full illustrations and all creature sprites are packaged byte-for-byte.

## Packs and timed openings

Each creature and all four of its finishes belong to exactly one pack (eight creatures each): Skogsglänta has nature, earth and shadow; Åskglöd has fire, lightning and light; Frostljus has water, ice, air and cosmic. The pack picker lists its actual contents.

New and upgraded installations start with five openings. One opening regenerates every two hours, up to five. Time spent at the cap is not banked. The shared balance and timestamp persist across app restarts; the offline prototype uses device time (not an authoritative server clock). Rolling the clock backwards cannot grant extra credit. Opening a pack atomically saves its five cards and consumes one credit. Resuming an interrupted pack costs nothing.

The Android build integrates Google rewarded TEST ads, with the official demo app/unit IDs. A reward is recorded in native preferences only from the SDK's earned-reward callback, then acknowledged after the web collection saves it. A pending reward survives restart, and duplicate delivery is ignored. Ads are opt-in, unavailable while the balance is full, and never simulated in the browser. If a timer refill fills the balance during an ad, its reward waits for the next free slot.

Production ads are not activated: provide the owner's AdMob App ID and rewarded ad unit ID and configure the production consent/privacy flow before a public release. No production revenue is earned by this test APK.
