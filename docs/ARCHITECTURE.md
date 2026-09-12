# 架构设计

## 概览

TextPlan 优先实现为 Obsidian 插件。插件提供面向每日 todo 文件的日历视图（月/周两种模式），并在 Obsidian 原生 Markdown 编辑器中打开选中的日记文件。

界面体验应接近“左侧日历 + 主区域编辑器”，但插件不嵌入或重写 Obsidian 编辑器内部实现。

## 工作区模型

TextPlan View 默认挂载在 Obsidian **左侧边栏**（left sidebar leaf），而不是主区域的 split leaf：

- 左侧边栏 leaf：TextPlan View —— 日历、工具栏、月/周切换、日期范围切换、Today 操作、归档按钮
- 主区域 Markdown leaf：Obsidian 原生编辑器，显示选中日期的日记文件

**自动挂载：**

插件在 `onload` 中通过 `workspace.onLayoutReady()` 注册回调，在布局就绪后检查是否已存在 TextPlan View：

- 不存在则通过 `workspace.getLeftLeaf(false)` 创建并 `setViewState`，然后 `revealLeaf` 激活
- 已存在则不重复创建，也不改变用户已经调整过的位置

必须等 `onLayoutReady`，否则在 Obsidian 恢复上次工作区布局时创建 leaf 会产生重复视图。

用户可以把 TextPlan View 拖到主区域或右侧边栏，插件不锁定位置。左侧边栏宽度通常远小于主区域，日历渲染必须在窄栏下保持可读（见「UI 层」）。

点击日历中的日期时，插件确保对应日记文件存在，然后在主区域 Markdown leaf 中打开。

## 分层

```text
src/core       与 Obsidian 无关的领域逻辑
src/obsidian   Obsidian API 适配层
src/ui         TextPlan 视图渲染和 DOM 交互
src/settings   插件设置类型、默认值和设置页
src/main.ts    插件生命周期和命令注册
```

## Core 层

`src/core` 不能 import `obsidian`。

职责：

- 日期格式化和解析。
- 月历网格生成。
- 周网格生成。
- 日记文件名和路径计算。
- Todo 行解析（根据语法配置）。
- Todo 状态切换（根据语法配置）。
- 可选完成时间处理。
- 将已完成 todo 归档到 `## Done`（跨语法模式兼容）。

Core API 应尽量写成纯函数，接收语法配置参数，便于单元测试，也方便未来独立版复用。

### 日期网格

月视图和周视图共用同一个 `DayCell` 结构，只是生成方式不同：

- `monthGrid.ts` — `createMonthGrid(month, weekStartDay)` 生成完整月份网格，含前后补齐的非本月日期
- `weekGrid.ts` — `createWeekGrid(date, weekStartDay)` 生成包含给定日期的那一周的 7 个格子

两者返回同构的数据，使 UI 层可以用同一套渲染函数处理两种模式，只在容器布局上区分。

### 多语法模式设计

Core 层的 todo 解析、切换、归档函数均参数化，接受 `TodoSyntaxConfig` 参数：

```typescript
export type TodoSyntaxMode = "markdown" | "asterisk" | "custom";

export interface TodoSyntaxConfig {
  mode: TodoSyntaxMode;
  customOpen?: string;
  customDone?: string;
}
```

**解析函数** (`src/core/todo.ts`)：
- `parseTodos(content, syntaxConfig)` 根据当前语法模式解析 todo
- 内部根据 `mode` 分发到不同的解析逻辑
- Markdown 模式：`- [ ]` / `- [x]`
- 星号模式：`* todo` / `* ✓ todo` / `*[x] todo`（兼容旧版）
- 自定义模式：用户自定义标记

**切换函数** (`src/core/todoToggle.ts`)：
- `toggleTodos(lines, syntaxConfig, options)` 根据当前语法模式切换 todo
- 输出格式遵循当前语法规范
- Markdown 模式：`- [ ]` ↔ `- [x]`
- 星号模式：`* todo` ↔ `* ✓ todo`
- 自定义模式：`customOpen` ↔ `customDone`

**归档函数** (`src/core/todoArchive.ts`)：
- `archiveCompletedTodos(content, syntaxConfig)` 归档已完成任务
- **跨模式识别**：使用 `parseCompletedTodoAnyMode()` 识别所有语法的已完成任务
- 这样用户切换语法模式后，仍能归档旧语法的已完成任务
- 移动到 `## Done` 时保持原始语法格式

### 归档的区块模型

归档不能简单按"Done 标题的行号"一刀切。正确的模型是先把文件切成 **Done 区块**和**非 Done 区块**：

- Done 区块 = 从 `## Done` 标题行起，到下一个 `##` 或 `#` 标题之前，或到文件末尾
- 一个文件中可能不存在 Done 区块，也可能存在多个 `##` 级标题把文件分成多段

归档规则：

- 扫描全文件，收集所有**位于 Done 区块之外**的已完成 todo
- 位置无关：Done 标题之前和之后的内容一视同仁
- Done 区块内部的 todo 不动，避免重复归档
- 写回时保证 `## Done` 标题的上下各有一个空行

早期实现用 `index < doneHeadingIndex` 判断是否需要归档，导致写在 Done 标题之后的新任务永远不会被归档——这是"归档有时候不成功"的根因之一，区块模型是对它的修正。

## Obsidian 适配层

`src/obsidian` 负责直接使用 Obsidian API。

职责：

- 通过 vault 读取日记文件。
- 创建日记目录和日记文件。
- 尽量通过 `Vault.process()` 修改文件内容。
- 在左侧边栏创建并激活 TextPlan View。
- 在主区域 Markdown leaf 中打开文件。
- 查找当前活动的 Markdown 编辑器，用于执行命令。
- **跟踪最近活动的 Markdown 文件**，供归档命令使用。
- 将编辑器命令接到 core 函数。
- **读取 Daily Notes / Periodic Notes 插件配置**（兼容模式）。
- **从模板文件读取内容并应用到新建日记**（兼容模式）。
- **检测默认快捷键冲突**并提示用户。

Vault 文件应通过 Obsidian API 处理，不直接使用 Node `fs`。

### 归档目标文件的解析

归档命令面向 vault 中任意 Markdown 文件，不限于日记目录。目标文件按优先级解析：

1. `workspace.getActiveViewOfType(MarkdownView)?.file` —— 当前焦点就在 Markdown 编辑器上
2. `lastActiveMarkdownFile` —— 插件维护的"最近活动过的 Markdown 文件"
3. 都没有 → Notice 提示，不修改任何文件

`lastActiveMarkdownFile` 通过监听 `workspace.on("active-leaf-change")` 维护：每当活动 leaf 是 Markdown 视图时记录其文件，非 Markdown 视图（例如 TextPlan View 自己）不覆盖该记录。

这样设计的原因：点击 TextPlan View 里的归档按钮时，焦点在 TextPlan View 上，`getActiveViewOfType(MarkdownView)` 返回 `null`。旧实现只 fallback 到插件自己的日记文件，插件刚重载时该字段为空，归档就静默失败——这是"归档有时候不成功"的另一个根因。

### 快捷键冲突检测

插件注册默认快捷键后，通过 Obsidian 的 `app.hotkeyManager` 检查同一组合是否已绑定到其他命令。

- 只读检查，不修改用户的快捷键配置
- 检测到冲突时用 Notice 告知具体是哪个组合、与哪个命令冲突
- 检测在 `onLayoutReady` 之后执行，确保其他插件的命令都已注册
- 每次会话对同一冲突只提示一次

`hotkeyManager` 不是公开 API，访问方式与 Daily Notes 兼容模式同样需要容错：拿不到就跳过提示，不影响插件正常工作。

### Daily Notes 兼容模式

当用户启用兼容模式时，TextPlan 读取 Daily Notes 或 Periodic Notes 插件的配置，使用它们的日记目录、文件名格式和模板。

**配置读取**：
- Daily Notes：`app.internalPlugins.plugins["daily-notes"]?.instance?.options`
- Periodic Notes：`app.plugins.plugins["periodic-notes"]?.settings?.daily`
- 优先使用 Periodic Notes 配置（如果已安装）

**读取内容**：
- `folder`：日记目录（空字符串表示根目录）
- `format`：Moment.js 日期格式字符串（如 `YYYY-MM-DD`）
- `template`：模板文件路径

**格式转换**：
将 Moment.js 格式转换为 TextPlan 内部格式：
- `YYYY` → `YYYY`
- `MM` → `MM`
- `DD` → `DD`
- 其他字符保持不变

**模板应用**：
- 读取模板文件内容
- 替换模板中的日期变量（如 `{{date}}`、`{{time}}`）
- 在创建新日记时插入模板内容

**文件路径解析**：
- 如果 `folder` 为空字符串，文件创建在根目录
- 否则确保目录存在并在该目录下创建文件
- 文件名按照插件配置的格式生成

## UI 层

`src/ui` 负责 TextPlan View 的 DOM。

职责：

- 渲染月视图网格、周视图纵向列表和周视图横向网格。
- 在日期格中渲染可见的未完成 todo，超出时折叠为 `+x`。
- 管理选中日期、当前展示的周期、当前日历模式。
- 提供工具栏控件（月/周切换、上一个/Today/下一个、归档）。
- 通过 Obsidian 适配层请求打开文件。
- 在设置、文件或选中日期变化时刷新。

### 视图模式

`TextPlanView` 持有 `viewMode: "month" | "week"` 状态，初值来自 `settings.defaultCalendarMode`。

周视图的排列方式由 `settings.weekViewLayout`（`"vertical" | "horizontal"`，默认 `"horizontal"`）决定。它只在设置页配置，不放进工具栏——窄侧边栏容不下更多控件，而且这是一次性的偏好，不是高频切换的操作。

视图状态还包含一个 `displayedDate`，表示当前窗口展示的周期：月模式下是当前展示的月份（任意一天），周模式下是当前展示的周内的任意一天。一次只渲染一个完整周期，不预生成相邻范围。

渲染流程按模式分派，但共用下层函数：

```text
render()
  renderToolbar()          共用，按 viewMode 调整标题与上/下一个的步长
  renderCalendar()
    月      ：createMonthGrid() → 网格容器（列头 + 6 个等高周行）
    周·纵向 ：createWeekGrid()  → 网格容器（7 行等分，无列头）
    周·横向 ：createWeekGrid()  → 网格容器（列头 + 1 个占满高度的周行）
    三者都调用 renderDayCell() 渲染单个日期格
```

`renderDayCell()` 负责日期数字、选中/今天/非本月状态类、任务列表和 `+x` 折叠。三种布局的差异只体现在外层容器的 CSS 上，不体现在数据或事件逻辑里。

纵向布局在 `renderDayCell()` 内额外渲染星期名称，通过传入的布局参数控制。

日历采用 CSS Grid 铺满工具栏以下的全部可用高度，`overflow: hidden`，任何模式下都不出现滚动条。行高由 `1fr` 等分决定，不使用固定像素值。

### 任务溢出与 `+x`

任务数量超出日期格可用高度时，最后一行显示 `+x`（x = 未显示数量）。

实现要点：

- 不能靠 CSS `overflow: hidden` 硬裁，那会产生半行文字和视觉堆叠
- 需要在渲染后测量日期格的可用高度与单行任务高度，算出可容纳行数
- 保留最后一行给 `+x`，其余行渲染真实任务
- 容器尺寸变化时重新计算，通过 `ResizeObserver` 触发并在视图卸载时断开
- `+x` 元素绑定与日期格相同的点击处理，行为一致

### 翻页

切换日期范围只通过工具栏按钮，直接修改 `displayedDate` 后重新渲染：月模式 `addMonths(±1)`，周模式 `addDays(±7)`。「今天」回到今天所在的月或周；月/周切换时重置到当前月 / 当前周。

不注册任何 `touchstart` / `touchmove` / `touchend` / `wheel` 导航监听——日历不滚动，也不响应滑动手势（见 [ADR 0009](adr/0009-paged-calendar-fill-viewport.md)）。

### 响应式与移动端

- 日历必须在左侧边栏的窄宽度下可读，尺寸相关的值走 CSS 变量，不写死像素
- 移动端通过 Obsidian 的 `.is-mobile` / `.is-phone` body 类，或 `Platform.isMobile` 施加更小的字号与更紧凑的行高
- 移动端与桌面端共用同一套 DOM 结构和布局逻辑，只有尺寸变量不同

## 编辑器扩展

TextPlan 通过 CodeMirror 6 编辑器扩展为不同语法模式提供视觉增强和交互功能。

### 动态配置系统

使用 **CodeMirror Compartment** 实现运行时语法配置切换。用户在设置页更改语法模式时，编辑器扩展可动态重新配置，无需重启插件或重新加载编辑器。

**实现要点**：
- 创建扩展时用 `Compartment.of()` 包裹 `ViewPlugin`
- 提供 `reconfigure` 函数，通过 `view.dispatch()` 发送 `Compartment.reconfigure()` effect
- 插件设置变化时调用 `reconfigure` 更新所有活动编辑器

### 文件作用域识别

通过 `EditorView.editorAttributes.of()` 扩展，为符合条件的日记文件编辑器添加 `.is-textplan-daily-note` 类。

**识别规则**：
- 非兼容模式：检查文件路径是否在 `settings.dailyNoteDirectory` 下
- 兼容模式：
  - 优先使用 Daily Notes / Periodic Notes 插件配置的目录
  - 如果插件配置目录为空（根目录），通过文件名格式判断（`YYYY-MM-DD.md` 或 `YYYYMMDD.md`）

该类作为 CSS 选择器的命名空间，确保 TextPlan 样式只作用于日记文件。

### 装饰系统

装饰系统的总原则：**只叠加，不替换。** 允许给已有内容加颜色、透明度、删除线；不替换原生渲染的字符，不改动列表的缩进与间距。

**已完成任务删除线（所有模式）：**
- 为已完成任务的**文本部分**添加 `Decoration.mark()`，类名 `.textplan-editor-done-text`
- CSS 施加 `text-decoration: line-through` 和文本弱化
- 只作用于文本区间，不覆盖标记区间，因此不影响 Obsidian 的 checkbox 或列表标记渲染
- 不设置任何 padding / margin / display，避免重演布局塌陷

**Markdown 原生模式：**
- Obsidian 原生已支持 checkbox 渲染，TextPlan 不干预标记本身
- 仅为 `- [x]` 的文本部分添加删除线装饰

**星号模式：**
- 保持 Obsidian 原生列表渲染，不替换列表标记、不改缩进
- 仅为 `* ✓` 和 `*[x]` 的文本部分添加删除线装饰

**自定义模式：**
- 添加行级 `Decoration.line()` 标记开/完成状态（`.is-textplan-open` / `.is-textplan-done`）
- 为已完成任务文本添加 `.textplan-editor-done-text`

**星号模式视觉优化尝试记录**：
曾尝试通过装饰和 CSS 将星号显示为彩色而非列表圆点，包括：
- `Decoration.replace()` + widget 替换星号
- `Decoration.mark()` + CSS 改变星号颜色
- CSS 隐藏 `.list-bullet` + 强制显示 `.cm-formatting-list`

以上方案均因破坏 Obsidian 列表布局或与原生渲染优先级冲突而放弃。最终决策：保持原生渲染，优先保证功能稳定性。

**被放弃的范围仅限于"替换标记字符"和"改动列表布局"**，删除线这类纯叠加装饰不在其中——它不与 Obsidian 的渲染层争夺同一块布局职责。详见 ADR 0005。

### 点击交互

通过 `EditorView.domEventHandlers` 监听编辑器点击事件，检测点击位置是否在 todo 标记上，如果是则调用 core 层的 toggle 函数。

**支持的标记**：
- Markdown 模式：checkbox 前的 `- [ ]` 或 `- [x]`
- 星号模式：`*` 或 `* ✓` 或 `*[x]`
- 自定义模式：用户设置的开/完成标记

点击标记时调用与快捷键相同的 toggle 逻辑，保证交互一致性。

## 设置

MVP 设置项：

### 兼容设置
- **兼容 Obsidian 日记插件**（开关，默认关闭）

### Todo 语法
- **Todo 语法模式**（单选：Markdown 原生 / 星号 / 自定义，默认 Markdown 原生）
- **自定义未完成标记**（仅自定义模式）
- **自定义已完成标记**（仅自定义模式）

### 日记设置
- **日记目录**（默认 `textplan`，兼容模式下禁用）
- **文件名格式**（默认 `YYYYMMDD.md`，兼容模式下禁用）

### 其他
- **周起始日**（默认周日）
- **完成时记录时间**（默认关闭）
- **默认日历模式**（单选：月 / 周，默认月）

设置通过 `Plugin.loadData()` 和 `Plugin.saveData()` 存储。

## 命令

MVP 命令：

- 打开 TextPlan，默认快捷键 `CMD+SHIFT+T`。
- 切换 todo 状态，默认快捷键 `CMD+D`。
- 归档已完成 todo，默认快捷键 `CMD+SHIFT+A`。

三个命令的默认快捷键都通过 Obsidian 命令 API 的 `hotkeys` 字段注册，用户可在「设置 → 快捷键」中覆盖。插件在布局就绪后检测冲突并通过 Notice 告知用户。

Todo 切换在存在选区时处理选区内 todo 行；没有选区时处理当前行。普通文本行会被忽略。

默认 TextPlan 语法为 Markdown 原生 `- [ ] todo` 和 `- [x] todo`。用户可以切换为星号语法或自定义语法。

归档作用于当前活动或最近活动的任意 Markdown 文件，在所有语法模式下都能识别其他模式的已完成任务并移动到 `## Done`。

## 国际化

插件 UI 支持中文和英文，并跟随 Obsidian 当前语言显示。用户可见文案应集中管理，不应散落在业务逻辑中。

## 打包

Obsidian 插件发布产物是：

- `main.js`
- `manifest.json`
- `styles.css`

项目文档和 agent 文件属于源码仓库资产，不应作为插件安装产物。

### 产物的产生与分发

`main.js` 由 `esbuild.config.mjs` 把 `src/main.ts` 打包生成，`obsidian`、`electron` 和全部 `@codemirror/*`、`@lezer/*` 声明为 external —— 这些由 Obsidian 运行时提供，打进 bundle 会与宿主实例冲突。

`main.js` 是构建产物，**不进入 Git 仓库**，只作为 GitHub Release 附件分发。三个文件必须平铺为 Release 附件，不能打成 zip：Obsidian 和 BRAT 都按文件名直接下载。

### 版本号

`package.json` 的 `version` 是唯一真相源。`version-bump.mjs` 通过 npm 的 `version` 生命周期钩子把它同步到 `manifest.json.version`，并向 `versions.json` 追加 `{ 版本号: minAppVersion }` —— Obsidian 用后者判断某个插件版本要求的最低宿主版本。

发布由 `.github/workflows/release.yml` 在 push 纯版本号 tag 时自动完成。

详见 [ADR 0010](adr/0010-version-control-and-release.md)。
