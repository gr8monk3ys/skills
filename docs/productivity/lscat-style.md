# lscat-style

## What it does

`lscat-style` makes anything match the design of
[lscaturchio.xyz](https://lscaturchio.xyz) — a web app, an Obsidian vault, a
banner, a Discord server — using the site's own `DESIGN.md` as the source of
truth: warm paper, forest ink, Fraunces headings, Instrument Sans body, and
monospace wall labels.

It loads the real design file first, from a local clone or GitHub, and keeps
only a short summary for media where that file cannot be applied directly.

## When to reach for it

You invoke this by typing `/lscat-style <target>` — the agent won't reach for it
on its own. Examples: `/lscat-style the obsidian vault`, `/lscat-style a
linkedin banner`.

Reach for it whenever something you publish should look like it belongs to the
same person. For general design critique not tied to the site, use the
impeccable plugin.

## Per medium

| Target | What it produces |
| --- | --- |
| Web app | Tokens as CSS variables or Tailwind theme, restyled components |
| App themes (Obsidian) | A CSS snippet for light and dark |
| Images and banners | Built with the Inkscape or GIMP MCP, or HTML plus a screenshot |
| Discord, profiles | Palette, restrained emoji, humanized copy |

## Common questions

**What if the site's design changes?**

The skill reads `DESIGN.md` every time, so it follows the site. The built-in
summary is only a fallback.

## It's working if

- Light and dark screenshots sit beside the site and look like the same family.
- There is one accent colour, no shadows on content, and mono only in labels.
