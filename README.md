# TextPlan

## 中文

TextPlan 是一个用于快速记录每日 todo 的 Obsidian 插件。它基于纯文本 Markdown 文件工作，用日历视图（月/周）呈现每天的任务：未完成的正常显示，已完成的弱化并加删除线。

### 功能特性

- **日历视图**：默认挂在左侧边栏，支持月视图和周视图切换；周视图提供横向（默认，7 天排成一行，等同月视图的一整行）和纵向（每天占满面板宽度，窄侧边栏下更易读）两种布局，可在设置中切换；清爽的白色背景，明确的格子分割线，选中日期高亮显示
- **有内容的格子更醒目**：格子里有 todo 或日程时底色加深，一眼看出哪天有安排
- **任务溢出折叠**：格子放不下时最后一行显示 `+x`，点击即可打开当天日记
- **整屏翻页**：窗口内始终完整展示一个月或一周，铺满可用高度，不出现滚动条；用工具栏的 ‹ › 按钮翻月或翻周
- **多语法模式**：
  - **Markdown 原生**（默认）：`- [ ] todo` / `- [x] todo`
  - **星号模式**：`* todo` / `* ✓ todo` / `* x todo`
  - **自定义模式**：自定义开/完成/放弃标记
- **三态任务**：未完成 → 已完成 → 已放弃，点标记或按 `CMD+D` 循环切换。已放弃的任务划线但归档时不会被移进 `## Done`
- **按日期分组 todo**：日记里用 `### 2026-11-20` 这样的三级标题，可以让一组 todo 显示在指定日期，适合提前安排几天后的事
- **外部日历（ICS 订阅）**：只读展示飞书、Google Calendar、iCloud 等公开的 ICS 订阅，日程和 todo 一起出现在日期格里
- **Daily Notes 兼容**：可与 Daily Notes 或 Periodic Notes 插件配合使用，共享日记目录和模板；「今天」按钮走对方的命令，行为与插件自己的快捷键一致
- **点击空白日期**：可选择直接新建文件、先弹窗询问，或只选中不新建
- **标签页标题显示日期**：日记文件标签页可显示日期和星期，随时知道自己看的是哪天
- **快捷键**：`CMD+SHIFT+T` 打开 TextPlan，`CMD+D` 切换任务状态，`CMD+SHIFT+A` 归档已完成任务
- **全局归档**：归档作用于任意 Markdown 文件，不限于日记目录
- **跨模式归档**：切换语法模式后，仍能识别和归档其他模式的已完成任务
- **已完成任务删除线**：编辑器中已完成任务显示为弱化 + 中间横线划掉
- **移动端与夜间模式**：移动端收紧字号和间距保证完整显示；所有颜色跟随 Obsidian 主题，夜间模式不出现对比度问题

### 安装

**社区插件市场**（尚未上架，审核通过后可用）

在 Obsidian 的「设置 → 第三方插件 → 浏览」中搜索 TextPlan。

**BRAT**（推荐用于尝鲜）

安装 [BRAT](https://github.com/TfTHacker/obsidian42-brat) 插件，添加测试版插件仓库 `LaurenQL/textplan`，BRAT 会自动跟进更新。

**手动安装**

1. 从 [Releases](https://github.com/LaurenQL/textplan/releases) 下载最新版本的 `main.js`、`manifest.json`、`styles.css`
2. 在你的 vault 中创建目录 `.obsidian/plugins/textplan/`，把三个文件放进去
3. 重启 Obsidian，在「设置 → 第三方插件」中启用 TextPlan

### 工作区布局

TextPlan 采用联动式工作区布局：

- 左侧边栏：TextPlan 日历视图（插件启用后自动出现）
- 主区域：Obsidian 原生 Markdown 编辑器，打开选中日期的日记

你可以把日历视图拖到主区域或右侧边栏，插件不锁定位置。

### 语法说明

**Markdown 原生模式**（默认）：

```md
- [ ] todo        # 未完成任务
- [x] todo        # 已完成任务
- [-] todo        # 已放弃任务
```

**星号模式**：

```md
* todo            # 未完成任务
* ✓ todo          # 已完成任务
* x todo          # 已放弃任务
```

`✓` 前有一个空格。为避免与 Markdown emphasis（斜体）冲突，已完成标记不使用 `*[x]`；读取时仍兼容旧版 `*[x] todo` 写法。

**自定义模式**：

在设置中定义自己的标记，例如 `>> todo` / `>>✓ todo` / `>>x todo`。

### 按日期分组 todo

日记里的 todo 默认属于这一天。如果一件事要提前安排，可以用三级标题给它指定生效日期：

```md
### 2026-11-20
- [ ] 交房租
- [ ] 预约牙医
```

这一组 todo 会显示在 11 月 20 日的日历格里，而不是写它的那一天。标题必须是 `### YYYY-MM-DD` 格式；遇到下一个标题时分组结束；`## Done` 区块内不参与分组。

### 外部日历

在设置里添加 ICS 订阅地址，日程会以只读方式显示在日期格中，和 todo 一起看。飞书、Google Calendar、iCloud 等能导出 ICS 订阅链接的服务都支持。

日程只读：不创建、不修改、不删除外部事件，也不写进 vault 的 Markdown 文件。

### 兼容模式

如果你已经在使用 Daily Notes 或 Periodic Notes 插件，可以在 TextPlan 设置中启用"兼容 Obsidian 日记插件"。TextPlan 会：

- 使用插件配置的日记目录和文件名格式
- 自动应用插件配置的模板
- 识别插件目录下的文件为 TextPlan 日记

### 开发状态

当前版本 v0.1.1。核心功能已经可用并发布正式 Release，尚未提交到 Obsidian 社区插件市场。

### 文档

- [架构设计](docs/ARCHITECTURE.md)
- [实现计划](docs/IMPLEMENTATION_PLAN.md)
- [ADR 0001：Obsidian Leaf 布局](docs/adr/0001-obsidian-leaf-layout.md)
- [ADR 0002：完成标记 `* ✓`](docs/adr/0002-asterisk-check-mark-completed.md)
- [ADR 0003：多语法模式支持](docs/adr/0003-multiple-syntax-modes.md)
- [ADR 0004：Daily Notes 插件兼容模式](docs/adr/0004-daily-notes-compatibility.md)
- [ADR 0005：放弃星号模式编辑器视觉定制](docs/adr/0005-asterisk-decoration-abandoned.md)
- [ADR 0006：TextPlan View 默认放置于左侧边栏](docs/adr/0006-left-sidebar-default-placement.md)
- [ADR 0007：月/周双日历模式](docs/adr/0007-month-week-calendar-modes.md)
- [ADR 0008：连续日历滚动（已废弃）](docs/adr/0008-continuous-calendar-scrolling.md)
- [ADR 0009：日历分页与窗口占满](docs/adr/0009-paged-calendar-fill-viewport.md)
- [ADR 0010：版本控制与发布流程](docs/adr/0010-version-control-and-release.md)
- [ADR 0011：三态任务模型](docs/adr/0011-three-state-todo-model.md)
- [ADR 0012：跨插件日记文件复用](docs/adr/0012-cross-plugin-daily-note-reuse.md)
- [ADR 0013：ICS 只读日历集成](docs/adr/0013-ics-readonly-calendar.md)
- [ADR 0014：按日期分组的 Todo](docs/adr/0014-dated-todo-sections.md)

---

## English

TextPlan is an Obsidian plugin for fast daily todo capture in plain Markdown files. It shows each day's tasks in a calendar view: open tasks render normally, completed ones are dimmed and struck through.

### Features

- **Calendar View**: Docked in the left sidebar by default, with switchable month and week modes; week view supports horizontal (default, 7 days in one row, same as one row of month view) and vertical (each day spans full panel width, easier to read in a narrow sidebar) layouts, configurable in settings; clean white background, clear grid borders, highlighted selection
- **Content Cells Stand Out**: A cell with todos or events gets a deeper background, so busy days are obvious at a glance
- **Overflow Folding**: Shows `+x` on the last line when a cell runs out of room; click it to open that day's note
- **Full-Period Paging**: A complete month or week is always shown in the window, filling the available height with no scrollbar; use the ‹ › toolbar buttons to page back or forward
- **Multiple Syntax Modes**:
  - **Markdown Native** (default): `- [ ] todo` / `- [x] todo`
  - **Asterisk Mode**: `* todo` / `* ✓ todo` / `* x todo`
  - **Custom Mode**: Define your own open/done/abandoned markers
- **Three-State Todos**: open → done → abandoned, cycled by clicking the marker or pressing `CMD+D`. Abandoned tasks are struck through but never moved into `## Done` when archiving
- **Dated Todo Sections**: Use a `### 2026-11-20` heading in a daily note to make a group of todos show up on that date, useful for planning days ahead
- **External Calendars (ICS)**: Read-only display of public ICS feeds from Feishu, Google Calendar, iCloud and others, shown alongside todos in each day cell
- **Daily Notes Compatibility**: Works with Daily Notes or Periodic Notes plugin, sharing directory and templates; the "Today" button runs the companion plugin's own command, matching its hotkey behaviour
- **Clicking an Empty Date**: Create the note immediately, ask first, or select without creating
- **Date in Tab Title**: Daily note tabs can show the date and weekday
- **Keyboard Shortcuts**: `CMD+SHIFT+T` to open TextPlan, `CMD+D` to toggle task status, `CMD+SHIFT+A` to archive completed tasks
- **Global Archive**: Archiving works on any Markdown file, not just notes in the daily directory
- **Cross-Mode Archive**: Archive completed tasks in any syntax mode, even after switching modes
- **Strikethrough for Done**: Completed tasks are dimmed and struck through in the editor
- **Mobile and Dark Mode**: Mobile tightens type and spacing so everything fits; all colours follow the Obsidian theme, so dark mode keeps proper contrast

### Installation

**Community plugin marketplace** (not listed yet; available once review passes)

Search for TextPlan under Settings → Community plugins → Browse.

**BRAT** (recommended for early access)

Install the [BRAT](https://github.com/TfTHacker/obsidian42-brat) plugin, add `LaurenQL/textplan` as a beta plugin repository, and BRAT will keep it up to date automatically.

**Manual installation**

1. Download `main.js`, `manifest.json`, and `styles.css` from the latest [release](https://github.com/LaurenQL/textplan/releases)
2. Create `.obsidian/plugins/textplan/` in your vault and put the three files there
3. Restart Obsidian and enable TextPlan under Settings → Community plugins

### Workspace Layout

TextPlan uses a linked workspace layout:

- Left sidebar: the TextPlan calendar view, created automatically when the plugin is enabled
- Main area: the native Obsidian Markdown editor showing the selected daily note

You can drag the calendar view to the main area or the right sidebar; the plugin does not lock its position.

### Syntax

**Markdown Native Mode** (default):

```md
- [ ] todo        # open task
- [x] todo        # completed task
- [-] todo        # abandoned task
```

**Asterisk Mode**:

```md
* todo            # open task
* ✓ todo          # completed task
* x todo          # abandoned task
```

There is a space before `✓`. The completed marker does not use `*[x]`, because that collides with Markdown emphasis (italic). Reading legacy `*[x] todo` is still supported.

**Custom Mode**:

Define your own markers in settings, e.g., `>> todo` / `>>✓ todo` / `>>x todo`.

### Dated Todo Sections

Todos in a daily note belong to that day by default. To schedule something ahead of time, give a group its own date with a third-level heading:

```md
### 2026-11-20
- [ ] Pay rent
- [ ] Book dentist
```

These todos appear on 20 November instead of the day the note was written. The heading must be exactly `### YYYY-MM-DD`; a group ends at the next heading; anything inside the `## Done` section is ignored.

### External Calendars

Add an ICS subscription URL in settings and events appear read-only in the day cells alongside todos. Any service that exposes a public ICS feed works — Feishu, Google Calendar, iCloud and others.

Events are read-only: TextPlan never creates, edits or deletes external events, and never writes them into vault Markdown files.

### Compatibility Mode

If you're already using Daily Notes or Periodic Notes plugin, enable "Compatible with Obsidian daily notes plugin" in TextPlan settings. TextPlan will:

- Use the plugin's configured directory and filename format
- Automatically apply the plugin's template
- Recognize files in the plugin's directory as TextPlan daily notes

### Development Status

Current version: v0.1.1. Core features are usable and released; the plugin has not been submitted to the Obsidian community plugin marketplace yet.

### Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Implementation Plan](docs/IMPLEMENTATION_PLAN.md)
- [ADR 0001: Obsidian Leaf Layout](docs/adr/0001-obsidian-leaf-layout.md)
- [ADR 0002: Completed Marker `* ✓`](docs/adr/0002-asterisk-check-mark-completed.md)
- [ADR 0003: Multiple Syntax Modes](docs/adr/0003-multiple-syntax-modes.md)
- [ADR 0004: Daily Notes Compatibility](docs/adr/0004-daily-notes-compatibility.md)
- [ADR 0005: Asterisk Decoration Abandoned](docs/adr/0005-asterisk-decoration-abandoned.md)
- [ADR 0006: Left Sidebar Default Placement](docs/adr/0006-left-sidebar-default-placement.md)
- [ADR 0007: Month and Week Calendar Modes](docs/adr/0007-month-week-calendar-modes.md)
- [ADR 0008: Continuous Calendar Scrolling (superseded)](docs/adr/0008-continuous-calendar-scrolling.md)
- [ADR 0009: Paged Calendar Filling the Viewport](docs/adr/0009-paged-calendar-fill-viewport.md)
- [ADR 0010: Version Control and Release Process](docs/adr/0010-version-control-and-release.md)
- [ADR 0011: Three-State Todo Model](docs/adr/0011-three-state-todo-model.md)
- [ADR 0012: Cross-Plugin Daily Note Reuse](docs/adr/0012-cross-plugin-daily-note-reuse.md)
- [ADR 0013: ICS Read-Only Calendar Integration](docs/adr/0013-ics-readonly-calendar.md)
- [ADR 0014: Dated Todo Sections](docs/adr/0014-dated-todo-sections.md)
