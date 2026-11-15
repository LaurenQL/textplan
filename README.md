# TextPlan

## 中文

TextPlan 是一个用于快速记录每日 todo 的 Obsidian 插件。它基于纯文本 Markdown 文件工作，用日历视图（月/周）呈现每天未完成的事项。

### 功能特性

- **日历视图**：默认挂在左侧边栏，支持月视图和周视图切换；周视图提供纵向（默认，每天占满面板宽度）和横向（等同月视图一行）两种布局，可在设置中切换；清爽的白色背景，明确的格子分割线，选中日期高亮显示
- **任务溢出折叠**：格子放不下时最后一行显示 `+x`，点击即可打开当天日记
- **整屏翻页**：窗口内始终完整展示一个月或一周，铺满可用高度，不出现滚动条；用工具栏的 ‹ › 按钮翻月或翻周
- **多语法模式**：
  - **Markdown 原生**（默认）：`- [ ] todo` / `- [x] todo`
  - **星号模式**：`* todo` / `* ✓ todo`
  - **自定义模式**：自定义开/完成标记
- **Daily Notes 兼容**：可与 Daily Notes 或 Periodic Notes 插件配合使用，共享日记目录和模板
- **快捷键**：`CMD+SHIFT+T` 打开 TextPlan，`CMD+D` 切换任务状态，`CMD+SHIFT+A` 归档已完成任务
- **全局归档**：归档作用于任意 Markdown 文件，不限于日记目录
- **跨模式归档**：切换语法模式后，仍能识别和归档其他模式的已完成任务
- **已完成任务删除线**：编辑器中已完成任务显示为弱化 + 中间横线划掉

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
```

**星号模式**：

```md
* todo            # 未完成任务
* ✓ todo          # 已完成任务
```

`✓` 前有一个空格。为避免与 Markdown emphasis（斜体）冲突，已完成标记不使用 `*[x]`；读取时仍兼容旧版 `*[x] todo` 写法。

**自定义模式**：

在设置中定义自己的标记，例如 `>> todo` / `>>x todo`。

### 兼容模式

如果你已经在使用 Daily Notes 或 Periodic Notes 插件，可以在 TextPlan 设置中启用"兼容 Obsidian 日记插件"。TextPlan 会：

- 使用插件配置的日记目录和文件名格式
- 自动应用插件配置的模板
- 识别插件目录下的文件为 TextPlan 日记

### 开发状态

TextPlan 目前处于早期开发阶段。第一个里程碑是 Obsidian 插件 MVP。

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

---

## English

TextPlan is an Obsidian plugin for fast daily todo capture in plain Markdown files. It shows unfinished daily todos in a calendar view.

### Features

- **Calendar View**: Docked in the left sidebar by default, with switchable month and week modes; week view supports vertical (default, each day spans full panel width) and horizontal (equivalent to one row of month view) layouts, configurable in settings; clean white background, clear grid borders, highlighted selection
- **Overflow Folding**: Shows `+x` on the last line when a cell runs out of room; click it to open that day's note
- **Full-Period Paging**: A complete month or week is always shown in the window, filling the available height with no scrollbar; use the ‹ › toolbar buttons to page back or forward
- **Multiple Syntax Modes**:
  - **Markdown Native** (default): `- [ ] todo` / `- [x] todo`
  - **Asterisk Mode**: `* todo` / `* ✓ todo`
  - **Custom Mode**: Define your own open/done markers
- **Daily Notes Compatibility**: Works with Daily Notes or Periodic Notes plugin, sharing directory and templates
- **Keyboard Shortcuts**: `CMD+SHIFT+T` to open TextPlan, `CMD+D` to toggle task status, `CMD+SHIFT+A` to archive completed tasks
- **Global Archive**: Archiving works on any Markdown file, not just notes in the daily directory
- **Cross-Mode Archive**: Archive completed tasks in any syntax mode, even after switching modes
- **Strikethrough for Done**: Completed tasks are dimmed and struck through in the editor

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
```

**Asterisk Mode**:

```md
* todo            # open task
* ✓ todo          # completed task
```

There is a space before `✓`. The completed marker does not use `*[x]`, because that collides with Markdown emphasis (italic). Reading legacy `*[x] todo` is still supported.

**Custom Mode**:

Define your own markers in settings, e.g., `>> todo` / `>>x todo`.

### Compatibility Mode

If you're already using Daily Notes or Periodic Notes plugin, enable "Compatible with Obsidian daily notes plugin" in TextPlan settings. TextPlan will:

- Use the plugin's configured directory and filename format
- Automatically apply the plugin's template
- Recognize files in the plugin's directory as TextPlan daily notes

### Development Status

TextPlan is in early development. The first milestone is the Obsidian plugin MVP.

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
