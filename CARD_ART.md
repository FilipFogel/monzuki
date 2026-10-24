# Card artwork and collection layout

Each of the 24 creatures now has two layouts:

- Basic: element-colored card, separate illustration window, name/HP header and two attacks. A transparent `art/<id>-creature.webp` is drawn above the scene background.
- Illustration: the existing complete image referenced by `cards.json`, displayed without extra stats or a replacement frame.

The four collectible finishes remain 96 variants: Basic (65%), Basic Holo (25%), Illustration Rare (8%), and Prisma Illustration (2%). Each draw is independent. Prisma uses an external violet glow and plaque; it no longer paints rainbow bands across the creature or text. Basic Holo has a separate animated foil layer behind the opaque creature inside its illustration window. Reduced motion disables the animation.

Old collection entries used the illustration artwork for every finish. The one-time catalog version 2 migration maps base/rare to Illustration Rare and holo/prism to Prisma Illustration, merging duplicates while preserving the total number of copies and pack progress. The previous save is backed up under `monzuki.collection.v1.before-card-layout-v2`. New basic cards can then be collected separately.

Creature sprites and the launcher icon were made with the built-in image generator. Prompts are in `art/creature-prompts.json` and `art/app-icon-prompt.json`. Android launcher assets are under `android-app/app/src/main/res/`. Creature exports retain alpha and their original 1254×1254 resolution.

Run `node tests/collection.cjs` for collection migration, pack/sweep locking, rarity boundary and card layout checks. Android CI verifies that all full illustrations and all creature sprites are packaged byte-for-byte.
