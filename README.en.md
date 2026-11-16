# TextPlan

<p align="center">
  <b>English</b> · <a href="README.md">简体中文</a>
</p>

<p align="center">
  <a href="https://github.com/LaurenQL/textplan/releases/latest"><img src="https://img.shields.io/github/v/release/LaurenQL/textplan?label=release" alt="Release"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/LaurenQL/textplan" alt="License"></a>
  <img src="https://img.shields.io/badge/Obsidian-%E2%89%A5%201.5.0-7c3aed" alt="Obsidian 1.5.0+">
</p>

A daily todo plugin for Obsidian, built for people who are busy and a little lazy. Your todos live in the Markdown files already in your vault. No database, no sign-up. Calendar on the left, the day's note on the right, click a cell to jump there.

```md
- [ ] Pay rent
- [x] Buy milk
- [-] Gym, skipping it
```

## Why this exists

I don't have that much to do each day, but I forget things a lot. I tried a few task apps. Most of them want you to create a project first, then tags, then walk through a setup flow. Setting up the structure eats all my patience and I'd abandon it within two days.

Obsidian already has daily notes. So I write todos in the note, and put a calendar next to them. No second app to open.

That's all TextPlan does: turns each day's note into a calendar you can look at. The notes stay as they are, and the syntax is still plain Markdown.

## Calendar

Month view and week view. The window always shows exactly one month or one week, filling the height below the toolbar. No scrollbar. You page with the ‹ › buttons.

Week view can be laid out horizontally or vertically. Horizontal looks like one row of the month view; vertical stacks the seven days, each spanning the full width, which reads better in a narrow sidebar.

When a day has todos or events, its background deepens a little, so a busy week is obvious at a glance.

## Tasks

A task has three states. Click the marker, or press `CMD+D`, and it cycles open, done, abandoned. Both done and abandoned get struck through and dimmed. The difference shows up in archiving: abandoned tasks never move into `## Done`.

The calendar shows open and done tasks. Abandoned ones stop taking up space.

When a cell runs out of room, the last line becomes `+x`. Clicking it opens that day's note.

The default syntax is Markdown native, meaning Obsidian's own checkbox.

```md
- [ ] open
- [x] done
- [-] abandoned
```

If you prefer, there's an asterisk mode.

```md
* open
* ✓ done
* x abandoned
```

Or define your own markers in settings, like `>>`, `>>✓`, `>>x`. Nested todos are recognised in every mode.

## Scheduling a future day

Todos in a note belong to that day by default. To plan something ahead, give a group its own date with a third-level heading.

```md
### 2026-11-20
- [ ] Pay rent
- [ ] Book dentist
```

These show up on 20 November instead of the day you wrote them, and they don't appear twice on the note's own day. The heading has to be exactly `### YYYY-MM-DD`, and the group ends at the next heading.

## External calendars

Paste an ICS URL in settings and events appear in the cells, read-only, next to your todos.

Anything that gives you an ICS feed works. Feishu, Google Calendar, iCloud. Events never get written into your notes and can't be edited from here. TextPlan only displays them.

Results are cached for 15 minutes. If a source fails, the last result stays on screen with a notice instead of the calendar going blank.

## Installation

Needs Obsidian 1.5.0 or later, desktop or mobile. The community marketplace submission is still under review, so for now use one of the three options below.

### BRAT, with auto-updates

1. Install the [BRAT](https://github.com/TfTHacker/obsidian42-brat) plugin
2. In BRAT settings choose "Add Beta plugin" and enter `LaurenQL/textplan`
3. Enable TextPlan

### Command line, fastest

On macOS or Linux, run this with your own vault path.

```bash
mkdir -p "/path/to/vault/.obsidian/plugins/textplan" && cd "/path/to/vault/.obsidian/plugins/textplan" && for f in main.js manifest.json styles.css; do curl -fsSLO "https://github.com/LaurenQL/textplan/releases/latest/download/$f"; done
```

On Windows, use PowerShell and change the path first.

```powershell
$dir = "$HOME\Documents\YourVault\.obsidian\plugins\textplan"
New-Item -ItemType Directory -Force -Path $dir | Out-Null
"main.js","manifest.json","styles.css" | ForEach-Object {
  Invoke-WebRequest "https://github.com/LaurenQL/textplan/releases/latest/download/$_" -OutFile "$dir\$_"
}
```

Restart Obsidian afterwards and enable the plugin under Settings → Community plugins.

### Manual download

Grab `main.js`, `manifest.json` and `styles.css` from [Releases](https://github.com/LaurenQL/textplan/releases), drop them into `<your vault>/.obsidian/plugins/textplan/`, restart, enable.

### Updating later

With BRAT, hit "Check for updates" in its settings. With the command line, run the same command again. Manually, overwrite the three files. None of these require reconfiguring anything, and your notes and settings are left alone.

## Shortcuts

| Action | Keys |
| --- | --- |
| Open TextPlan | `CMD+SHIFT+T` |
| Toggle task state | `CMD+D` |
| Archive completed tasks | `CMD+SHIFT+A` |

On Windows and Linux, use `Ctrl` instead of `CMD`.

## FAQ

**Will it wreck my notes?**
No. It reads and writes through Obsidian's `Vault.process()`, touches only the Markdown you wrote, and adds no proprietary format. Uninstall it and your notes open exactly as before.

**What filenames does it support?**
`YYYYMMDD.md` by default, changeable to `YYYY-MM-DD.md` and so on. With compatibility mode it follows whatever Daily Notes or Periodic Notes is set to.

**Why are some tasks missing from the calendar?**
Abandoned tasks aren't shown, and neither is anything under `## Done`.

**Text is hard to read in dark mode?**
That was fixed in 0.1.1, colours now follow the theme. Update if you're on an older build.

**Does it phone home?**
Only if you add an ICS feed, in which case it fetches that URL. Otherwise it makes no requests and collects nothing.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Implementation plan](docs/IMPLEMENTATION_PLAN.md)
- [Decision records](docs/adr/), 14 entries, each explaining why a trade-off was made

## License

MIT. Use it, ship it commercially, just keep the copyright notice. Full text in [LICENSE](LICENSE).

## Development

```bash
npm install
npm test
npm run build
```

TypeScript and esbuild. The domain layer sits in `src/core` with no Obsidian dependency, so it's testable on its own and reusable if this ever becomes a standalone app.

## About

Lauren, one person building this.

Find me on X as [Lauren_QL](https://x.com/Lauren_QL) or on Jike as [Lauren](https://okjk.co/y9Z6lk). Bug reports, feature ideas, or just a note that it helped you are all welcome.

---

If it's useful, a star tells me so.
