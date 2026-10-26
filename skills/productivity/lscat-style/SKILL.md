---
name: lscat-style
description: Make anything match lscaturchio.xyz — its field-notebook design system (warm paper, forest ink, Fraunces, mono wall labels) — on sites, docs, images, banners or app themes.
argument-hint: "What to restyle, e.g. 'the obsidian vault' or 'a linkedin banner'"
disable-model-invocation: true
---

# lscat-style

Bring the target in the argument into the lscaturchio.xyz visual language. The site's `DESIGN.md` is the source of truth. The summary below is only for media where you cannot load it.

## 1. Load the source

Read `DESIGN.md` from a local clone of `gr8monk3ys/lscaturchio.xyz` if one exists in the user's code folders. Otherwise fetch `https://raw.githubusercontent.com/gr8monk3ys/lscaturchio.xyz/main/DESIGN.md`. Its tokens, named rules and do's and don'ts beat this page.

## 2. Quick reference

- **Mood**: a field notebook on warm paper, written in forest ink, catalogued in monospace.
- **Light**: paper `#f9f8f5`, card `#fbfaf9`, tinted `#eeece7`, ink `#1a1f23`, muted ink `#606976`, hairline `#e2dbd5`.
- **Accent**: forest ink `#184e35` (dark mode `#42a979`); moss `#397f5e` for secondary fills only. No second accent.
- **Dark**: the same notebook at night. Page `#111317`, card `#16181d`, ink `#fafafa`, muted `#abb0ba`, hairline `#292c32`.
- **Type**: Fraunces for display and titles; Instrument Sans for body; IBM Plex Mono only for labels (0.72rem, 0.16em tracking, uppercase). All three are on Google Fonts.
- **Signature moves**: a mono wall label above every section; 1px warm hairlines and 64–96px of space instead of boxes; forest ink only on action and emphasis.
- **Never**: shadows on content, glass or neumorphism, gradient blobs, three-column feature tiles, glowing buttons, cool grey neutrals, mono as a voice.

## 3. Apply per medium

- **Web app**: port the tokens to CSS variables or the Tailwind theme, load the fonts, then restyle the components with the do's and don'ts.
- **Obsidian or other app themes**: a CSS snippet that maps the tokens onto the app's variables, for both light and dark.
- **Images and banners**: paper background, Fraunces headline, mono wall label, one forest-ink element. Build them with the Inkscape or GIMP MCP, or render HTML and screenshot it.
- **Platforms with little styling** (Discord, profiles): the palette in role colors and banners, restrained emoji, and the plain voice. Run copy through `anthropic-skills:humanizer`.

## 4. Check

Screenshot the result next to lscaturchio.xyz, in light and dark. Fix anything that would not look at home on the site before reporting.
