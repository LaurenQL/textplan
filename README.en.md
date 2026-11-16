# TextPlan

<p align="center">
  <b>English</b> · <a href="README.md">简体中文</a>
</p>

<p align="center">
  <a href="https://github.com/LaurenQL/textplan/releases/latest"><img src="https://img.shields.io/github/v/release/LaurenQL/textplan?label=release" alt="Release"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/LaurenQL/textplan" alt="License"></a>
  <img src="https://img.shields.io/badge/Obsidian-%E2%89%A5%201.5.0-7c3aed" alt="Obsidian 1.5.0+">
</p>

A daily todo plugin for Obsidian, built for people who are **busy and lazy**. Your data is your Markdown files — no database, no subscription, no account. Calendar on the left, notes on the right, click a cell to open that day.

```md
- [ ] Pay rent
- [x] Buy milk
- [-] Gym (skipped)
```

## What it is

TextPlan puts your day's todos into a calendar you can read at a glance. Click a day and you get that day's note; write `- [ ] task` in the note and it shows up in the calendar cell.

No new format, no data lock-in. Stop using the plugin and your notes are still just notes.

## Features

- **Calendar view**: month and week modes (week has horizontal and vertical layouts). Always exactly one month or week on screen, filling the window height, never scrolling
- **Content cells stand out**: a day with todos or events gets a deeper background
- **Three-state todos**: open → done → abandoned, cycled by clicking the marker or pressing `CMD+D`. Done tasks are dimmed and struck through; abandoned tasks don't occupy a calendar slot
- **Overflow folding**: when a cell runs out of room the last line shows `+x`; click it to open that day's note
- **Dated sections**: write `### 2026-11-20` in a note and that group of todos shows up on 20 November — handy for planning days ahead
- **External calendars**: add an ICS feed and events from Feishu, Google Calendar or iCloud appear next to your todos (read-only, nothing written back)
- **Multiple syntax modes**: Markdown native (default), asterisk, or custom
- **Daily Notes compatibility**: reuse the folder, filename format and templates from Daily Notes or Periodic Notes
- **Global archive**: `CMD+SHIFT+A` collects completed tasks from any Markdown file into `## Done`
- **Mobile and dark mode**: follows the Obsidian theme; text stays legible in either mode

## Installation

> Requires **Obsidian 1.5.0 or later**. Works on desktop and mobile.

The community plugin marketplace submission is under review; once approved you'll be able to install it by searching inside Obsidian.

### Option 1: BRAT (recommended, auto-updates)

1. Install the [BRAT](https://github.com/TfTHacker/obsidian42-brat) plugin
2. In BRAT settings, choose "Add Beta plugin" and enter `LaurenQL/textplan`
3. Enable TextPlan

### Option 2: Command line (fastest)

**macOS / Linux** — replace `/path/to/vault` with your vault path:

```bash
mkdir -p "/path/to/vault/.obsidian/plugins/textplan" && cd "/path/to/vault/.obsidian/plugins/textplan" && for f in main.js manifest.json styles.css; do curl -fsSLO "https://github.com/LaurenQL/textplan/releases/latest/download/$f"; done
```

**Windows PowerShell**:

```powershell
$dir = "$HOME\Documents\YourVault\.obsidian\plugins\textplan"
New-Item -ItemType Directory -Force -Path $dir | Out-Null
"main.js","manifest.json","styles.css" | ForEach-Object {
  Invoke-WebRequest "https://github.com/LaurenQL/textplan/releases/latest/download/$_" -OutFile "$dir\$_"
}
```

Then restart Obsidian and enable TextPlan under Settings → Community plugins.

### Option 3: Manual download

Download `main.js`, `manifest.json` and `styles.css` from [Releases](https://github.com/LaurenQL/textplan/releases), put them in `<your vault>/.obsidian/plugins/textplan/`, restart Obsidian and enable the plugin.

### Updating

- **BRAT**: click "Check for updates" in its settings, or let it check automatically
- **Command line**: run the command above again, then restart Obsidian
- **Manual**: overwrite the three files with the new ones and restart Obsidian

Updating never touches your notes or resets your settings.

## Usage

Once TextPlan is open:

- **Click a calendar cell** — open or create that day (creates immediately by default; configurable to ask first, or to select without creating)
- **Click a task marker or press `CMD+D`** — cycle the task state
- **`CMD+SHIFT+T`** — open TextPlan
- **`CMD+SHIFT+A`** — archive completed tasks

> On Windows and Linux, use `Ctrl` in place of `CMD`.

### Syntax

**Markdown native (default)**

```md
- [ ] open
- [x] done
- [-] abandoned
```

**Asterisk mode**

```md
* open
* ✓ done
* x abandoned
```

**Custom mode**

Define your own open / done / abandoned markers in settings, e.g. `>>` / `>>✓` / `>>x`.

### Scheduling a future day

```md
### 2026-11-20
- [ ] Pay rent
- [ ] Book dentist
```

These todos appear on 20 November instead of the day you wrote them. The heading must be exactly `### YYYY-MM-DD`; the group ends at the next heading.

### External calendars

Add an ICS URL under "Calendar sources" in settings. Results are cached in-process for 15 minutes; if a source fails to load, the previous result is kept and the failure is surfaced rather than blanking the calendar.

> Events are read-only: TextPlan never creates, edits or deletes external events, and never writes them into vault files.

## FAQ

**Will it damage my notes?**
No. TextPlan reads and writes your existing Markdown files through Obsidian's `Vault.process()` and adds no proprietary format. Your notes stay usable after you uninstall it.

**Which daily note filenames are supported?**
`YYYYMMDD.md` by default, configurable to `YYYY-MM-DD.md` and others; with compatibility mode it follows whatever Daily Notes / Periodic Notes is configured to use.

**Why can't I see some tasks in the calendar?**
Abandoned tasks (`- [-]` / `* x`) are hidden, as is anything inside the `## Done` section.

**Text is hard to read in dark mode?**
Fixed in v0.1.1 — all colours now follow theme variables. Update to the latest release if you're on an older build.

**Does TextPlan make network requests?**
No, unless you configure an ICS calendar feed yourself. The plugin collects no data and makes no outbound requests on its own.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Implementation plan](docs/IMPLEMENTATION_PLAN.md)
- [Decision records (ADR)](docs/adr/) — 14 entries, each recording why a trade-off was made

## License

[MIT](LICENSE). Use it, change it, ship it commercially — just keep the copyright notice.

## Development

```bash
npm install
npm test
npm run build
```

TypeScript + esbuild. The domain layer (`src/core`) has no Obsidian dependency, so it's unit-testable and reusable.

## About

**Lauren** — building small tools that keep a day under control with as few actions as possible.

- X: [Lauren_QL](https://x.com/Lauren_QL)
- Jike: [Lauren](https://okjk.co/y9Z6lk)

Ideas, bug reports, or just a note that this helped you — all welcome.

---

<p align="center">
  If TextPlan is useful to you, a ⭐ is the best encouragement.
</p>
