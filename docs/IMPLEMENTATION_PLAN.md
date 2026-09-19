# 实现计划

## 1. 插件骨架

- 基于官方 sample plugin 结构添加 Obsidian 插件项目文件。
- 配置 TypeScript 和 esbuild。
- 添加 `manifest.json`、`versions.json`、`styles.css` 和 `src/main.ts`。
- 添加构建和测试脚本。

完成标准：

- `npm run build` 能生成 `main.js`。
- Obsidian 可以从仓库目录手动加载插件。

## 2. Core 领域逻辑

- 实现 core 逻辑使用的设置类型，包含语法配置。
- 实现日期工具。
- 实现支持 `YYYY`、`MM`、`DD` token 的文件名和日记路径格式化。
- 实现支持自定义周起始日的月历网格生成。
- 实现 **参数化** 的 todo 解析，接收 `TodoSyntaxConfig`：
  - Markdown 原生模式：`- [ ] todo` / `- [x] todo`
  - 星号模式：`* todo` / `* ✓ todo`，兼容 `*todo` 和 `*[x] todo`
  - 自定义模式：用户设置的标记
- 实现 **参数化** 的 todo 切换，接收 `TodoSyntaxConfig`，输出对应格式。
- 实现当前行和选区多行 todo 切换。
- 实现可选的 `@done(YYYY-MM-DD)` 处理。
- 实现将已完成 todo 归档到 `## Done`，**跨语法模式识别**：
  - Markdown 原生模式下识别 `- [x]` 和其他模式已完成任务
  - 星号模式下识别 `* ✓`、`*[x]` 和其他模式已完成任务
  - 自定义模式下识别自定义标记

完成标准：

- 单元测试覆盖解析、切换、日期格式化、月历网格生成和归档。
- 测试覆盖三种语法模式和跨模式兼容。

## 3. Obsidian 适配层

- 实现 vault helper，确保目录和日记文件存在。
- 通过 Obsidian `Vault` 实现文件读写。
- **新增 Daily Notes / Periodic Notes 兼容模块**：
  - 读取 Daily Notes 插件配置（`app.internalPlugins.plugins['daily-notes']`）
  - 读取 Periodic Notes 插件配置（`app.plugins.plugins['periodic-notes']`）
  - 提取目录、日期格式、模板路径
  - moment.js 格式转换为 TextPlan token（常用格式）
- **新增模板应用功能**：
  - 从模板文件读取内容
  - 新建日记时写入模板内容（兼容模式下）
- 实现在 Markdown leaf 中打开选中日期文件。
- 实现用于切换 todo 状态的编辑器命令 helper。
- 实现针对当前日记文件的归档命令 helper。

完成标准：

- 命令可以作用于真实 Obsidian Markdown 文件，不直接使用 Node `fs`。
- 兼容模式能正确读取插件配置并应用模板。

## 4. TextPlan View

- 注册自定义 TextPlan View。
- 渲染工具栏控件。
- 渲染月历网格。
- 在每个日期格中显示未完成 todo。
- 点击日期时打开或创建日记文件。
- 相关文件变化后刷新月历。

完成标准：

- View 可以切换月份、选择日期并打开日记文件。

## 5. 命令和快捷键

- 注册打开 TextPlan 命令。
- 注册切换 Todo 命令，默认快捷键 `CMD+D`。
- 注册归档已完成 Todo 命令，默认快捷键 `CMD+SHIFT+A`。
- 将归档按钮接到与快捷键相同的归档行为。

完成标准：

- 键盘和按钮行为共用同一套 core 实现。

## 6. 设置页

- 添加设置页。
- **新增兼容设置**：
  - 兼容 Obsidian 日记插件（开关）
  - 开关开启时禁用日记目录和文件名格式输入
- **新增 Todo 语法设置**：
  - Todo 语法模式（单选：Markdown 原生 / 星号 / 自定义）
  - 自定义未完成标记（输入框，仅自定义模式显示）
  - 自定义已完成标记（输入框，仅自定义模式显示）
- 支持日记目录（兼容模式关闭时可用）。
- 支持文件名格式（兼容模式关闭时可用）。
- 支持周起始日。
- 支持完成时间开关。

完成标准：

- 修改设置后，会影响新打开文件、月历布局、完成时间行为和 todo 语法解析。
- 语法模式切换时，编辑器扩展动态重新配置。

## 7. 点击切换 Todo

- 添加点击 todo marker 的编辑器交互。
- 支持三种语法模式，不同模式识别不同标记。
- 添加编辑器视觉扩展，根据语法配置动态调整：
  - **使用 CodeMirror Compartment** 实现运行时配置切换
  - Markdown 原生模式：不干预（Obsidian 原生渲染）
  - 星号模式：**不干预**（保持 Obsidian 原生列表渲染，见 [ADR 0005](adr/0005-asterisk-decoration-abandoned.md)）
  - 自定义模式：根据用户标记显示，已完成任务弱化+删除线
- 星号模式下保留对旧版已完成写法 `*[x] todo` 的读取兼容。
- 保持快捷键切换作为可靠 fallback。

完成标准：

- 点击支持的 todo marker 可以在编辑器中切换状态。
- 设置页切换语法模式时，编辑器扩展立即更新，无需重启。

**注**：星号模式曾尝试实现自定义视觉（彩色星号替代列表圆点），因与 Obsidian 原生渲染冲突而放弃。详见 [ADR 0005](adr/0005-asterisk-decoration-abandoned.md)。

## 8. 国际化

- 建立中英文文案资源。
- 用户可见文案跟随 Obsidian 当前语言。
- 设置项、命令名、按钮、空状态等文案都进入 i18n。

完成标准：

- 中文 Obsidian 环境显示中文。
- 英文 Obsidian 环境显示英文。

## 9. 验证

- 运行单元测试。
- 运行生产构建。
- 在 Obsidian 开发 vault 中手动测试。

手动检查：

- 插件可以加载。
- TextPlan View 可以打开。
- 默认 `textplan` 目录会被创建。
- **兼容模式**：开启后从 Daily Notes / Periodic Notes 读取配置，新建日记应用模板。
- **Todo 语法模式**：默认 Markdown 原生，可切换星号或自定义，切换后编辑器扩展立即更新。
- 点击日期可以创建或打开预期日记文件。
- 月历只显示未完成 todo（根据当前语法模式）。
- 嵌套 todo 能正确显示和切换。
- `CMD+D` 可以切换当前行和选区内 todo 行（根据当前语法模式）。
- `CMD+SHIFT+A` 可以将已完成 todo 归档到 `## Done`（跨语法模式识别）。
- 归档按钮行为与快捷键一致。
- 设置重载后仍然保留。
- UI 文案能按 Obsidian 语言显示中文或英文。

---

# 第二迭代（2026-09-06）

需求来源：`02 Projects/TextPlan/textplan 2026-09-06 迭代`。

## 10. 左侧边栏默认视图

- `openTextPlanView` 从 `workspace.getLeaf("split", "vertical")` 改为 `workspace.getLeftLeaf(false)`。
- 在 `onload` 中通过 `workspace.onLayoutReady()` 自动创建并激活 TextPlan View。
- 已存在 TextPlan View 时不重复创建，不改动用户调整过的位置。
- `openMarkdownFileBeside` 相应调整为在主区域打开日记文件，避免复用侧边栏 leaf。

完成标准：

- 首次启用插件后，TextPlan 出现在左侧边栏并成为激活标签。
- 重启 Obsidian 后不产生重复视图。
- 把视图拖到主区域后重启，位置保持用户的选择。

## 11. 归档修复

三个独立缺陷，一起修：

- **目标文件解析**：新增 `lastActiveMarkdownFile` 跟踪，监听 `workspace.on("active-leaf-change")`。归档目标按「当前活动 Markdown 文件 → 最近活动 Markdown 文件 → 提示无可归档文件」解析。移除对 `activeDailyFile` 的依赖。
- **区块模型**：`archiveCompletedTodos` 改为先划分 Done 区块（`## Done` 标题到下一个 `##`/`#` 或文件末尾），归档 Done 区块**之外**的所有已完成 todo，不再用行号大小比较。
- **Done 区域格式**：写回时保证 `## Done` 标题上下各有一个空行。

同时放宽解析正则，允许标记后文本为空的已完成任务被识别。

完成标准：

- 单元测试覆盖：Done 标题在文件中间、已完成任务写在 Done 之后、无 Done 标题、多次归档幂等、空文本任务。
- 焦点在 TextPlan View 上点击归档按钮，能正确归档最近打开的 Markdown 文件。
- 在任意非日记 Markdown 文件上按 `CMD+SHIFT+A` 能归档该文件。
- 一次归档后，Done 区块外不再残留任何已完成 todo。

## 12. 打开 TextPlan 快捷键

- 为 `open-textplan` 命令注册默认快捷键 `CMD+SHIFT+T`。
- 新增快捷键冲突检测：在 `onLayoutReady` 后读取 `app.hotkeyManager`，检查三个默认快捷键是否已被其他命令占用。
- 检测到冲突时通过 Notice 告知用户组合、冲突命令和修改入口；只读检查，不改用户配置；同一会话不重复提示。
- `hotkeyManager` 非公开 API，读取失败时静默跳过。
- 冲突提示文案进入 i18n。

完成标准：

- `CMD+SHIFT+T` 能打开或激活 TextPlan View。
- 快捷键可在 Obsidian 快捷键设置中修改。
- 人为制造冲突时能看到提示，且提示不影响插件其余功能。

## 13. 日历显示适配

- 任务溢出折叠：渲染后测量日期格可用高度与单行高度，算出可容纳行数，最后一行渲染 `+x`（x = 未显示数量）。
- `+x` 绑定与日期格相同的点击行为：打开或创建当天日记文件。
- 通过 `ResizeObserver` 在容器尺寸变化时重算，视图卸载时断开。
- 移动端适配：尺寸相关的值抽成 CSS 变量，移动端使用更小字号和更紧凑行高。

完成标准：

- 任务多而高度不足时不出现文字堆叠、半行截断或行高压缩到不可读。
- 缩放侧边栏宽度或窗口高度时，`+x` 的数量随之正确更新。
- 移动端日期数字和任务文本完整显示。

## 14. 周视图

- 新增 `src/core/weekGrid.ts`：`createWeekGrid(date, weekStartDay)` 返回 7 个与月视图同构的 `DayCell`（长度固定为 7）。
- `TextPlanView` 新增 `viewMode: "month" | "week"` 状态，初值取自新设置项 `defaultCalendarMode`。
- 工具栏新增月/周分段控件；切换时分别重置到当前月或当前周。
- 抽出共用的 `renderDayCell()`，三种布局均复用。
- **纵向布局**：7 天从上到下排列，每天占满面板宽度，7 行等分可用高度，每行显示「日期数字 + 星期名 + 任务列表」。
- **横向布局（默认）**：7 天排成一行，固定 7 列不换行，该行占满全部可用高度。
- 周视图布局由 `weekViewLayout: "vertical" | "horizontal"` 决定，默认 `"horizontal"`，只在设置页配置。
- 上一个/下一个按钮在月模式翻到相邻月份，在周模式翻到相邻周。
- 新增两个设置项：「默认日历模式」（`defaultCalendarMode`）和「周视图布局」（`weekViewLayout`）。

完成标准：

- 单元测试覆盖 `createWeekGrid` 的周起始日、跨月、跨年边界。
- 月/周切换后任务筛选、点击、选中高亮、`+x` 折叠行为完全一致。
- 纵向和横向布局均可正确渲染，样式不互相污染。

## 15. 日历分页与窗口占满

见 [ADR 0009](adr/0009-paged-calendar-fill-viewport.md)。本节曾实现为连续滚动（ADR 0008），因实际使用中布局失去自适应、观感变差而回退为分页。

- 视图状态收敛为单一 `displayedDate`：月模式表示当前月份，周模式表示当前周内任意一天；一次只渲染一个完整周期。
- 日历容器用 CSS Grid 铺满工具栏以下全部高度并 `overflow: hidden`，任何模式下都不出现滚动条：
  - 月视图 `auto repeat(6, minmax(0, 1fr))`——列头 + 6 个等高周行
  - 周视图·横向 `auto minmax(0, 1fr)`——列头 + 1 个占满高度的周行
  - 周视图·纵向 `repeat(7, minmax(0, 1fr))`——7 天等分，无列头
- 行高一律由 `1fr` 等分决定，不使用固定像素行高。
- 月视图固定 6 行（`createMonthGrid` 的 42 格），用上下月日期补齐首尾不完整的周，保证翻页时布局不跳动。
- 上一个 / 下一个按钮直接修改 `displayedDate` 后重新渲染：月 `addMonths(±1)`，周 `addDays(±7)`。
- 不注册任何 `touchstart` / `touchmove` / `touchend` / `wheel` 导航监听。

完成标准：

- 月视图窗口内始终显示一个完整月份，周视图始终显示一个完整周，均无滚动条。
- 缩放窗口高度或侧边栏宽度时，日期格随之等比缩放，`+x` 数量正确重算。
- 上一个 / 下一个按钮按模式正确翻月或翻周，「今天」回到今天所在周期。
- 月/周切换后重置到当前月 / 当前周。
- 视图关闭后无残留观察器或监听。

## 16. 已完成任务删除线

- 在 `todoDecorations.ts` 中为所有语法模式的已完成任务**文本部分**添加 `Decoration.mark({ class: "textplan-editor-done-text" })`。
- CSS 只施加 `text-decoration: line-through` 和文本弱化，不设置任何 padding / margin / display。
- 装饰区间只覆盖文本，不覆盖标记，避免影响 checkbox 和列表标记的原生渲染。

完成标准：

- 三种语法模式下已完成任务都显示删除线和弱化。
- 列表缩进、标记与文本的间距与修改前完全一致（对照截图验证）。
- 切换语法模式后装饰立即更新。

## 17. 第二迭代验证

手动检查：

- 插件启用后 TextPlan 自动出现在左侧边栏。
- `CMD+SHIFT+T` 打开 TextPlan，冲突时有提示。
- 月/周切换正常，默认月视图。
- 窗口内始终只展示一个完整月或一周，铺满高度，无滚动条。
- 任务溢出显示 `+x`，点击行为与日期格一致。
- 上一个 / 下一个按钮翻月或翻周。
- 已完成任务显示删除线，排版无回归。
- 在任意 Markdown 文件上归档成功，无遗漏，`## Done` 后有空行。
- 移动端文案完整显示。

# 工程基建

## 18. 版本控制与发布流程

见 [ADR 0010](adr/0010-version-control-and-release.md)。

### 18.1 仓库合规

- 新增 `LICENSE`（MIT，与 `package.json` 声明一致），社区市场上架的硬性要求。
- `.gitignore` 增补 `main.js`、`*.js.map`、`.claude/settings.local.json`、编辑器目录和 `coverage/`。
- 首次提交纳入全部源码、测试、文档和构建配置；排除 `TextPlan PRD.md`、`node_modules/`、`main.js`。

### 18.2 版本号同步

- 新增 `version-bump.mjs`：从 `npm_package_version` 读新版本号，写 `manifest.json.version`，向 `versions.json` 追加 `{ 版本号: minAppVersion }`。
- `package.json` 增加 `version` 钩子脚本，串联 bump 与 `git add`。
- 新增 `.npmrc` 设 `tag-version-prefix=""`，保证 tag 是纯版本号。

### 18.3 CI

- `.github/workflows/ci.yml`：push 到 `main` 和所有 PR 触发，跑 `npm ci` → `npm test` → `npm run build`。
- `.github/workflows/release.yml`：push 匹配 `[0-9]+.[0-9]+.[0-9]+` 的 tag 触发，构建后用 `gh release create` 平铺发布 `main.js`、`manifest.json`、`styles.css`。

### 18.4 验证

- `npm test` 与 `npm run build` 无回归。
- `git ls-files` 中不含 `main.js` 和 `TextPlan PRD.md`。
- `npm version patch --no-git-tag-version` 后三个文件版本一致（验证完还原）。
- push 后 GitHub Actions 首次运行通过。
- 打一个真实 tag，确认 Release 产生且三个附件平铺可下载。

# 第三迭代

## 19. 三态任务模型、日记复用、ICS 日历、交互改进

见 [ADR 0011](adr/0011-three-state-todo-model.md)、[ADR 0012](adr/0012-cross-plugin-daily-note-reuse.md)、[ADR 0013](adr/0013-ics-readonly-calendar.md)。

### 19.1 三态任务模型

- `Todo.state: "open" | "done" | "abandoned"` 三态；`completed` 保留为 `state !== "open"` 的派生布尔值（向后兼容装饰层）。
- 切换环：`open → done → abandoned → open`，点击和 `CMD+D` 走同一路径。
- 各语法模式放弃标记：星号模式 `* x todo`，Markdown 原生 `- [-] todo`，自定义模式未配置时降级为 `- [-]`。
- 切换到放弃时移除 `@done(...)` 时间戳。
- `todoArchive.ts` 归档条件改为 `state === "done"`，放弃任务留在原位置不进 `## Done`。
- `todoDecorations.ts` 已放弃任务同已完成一样显示删除线 + 弱化，日历不显示放弃任务。
- 新增 `tests/todoArchive.test.ts` 四条边界测试（星号放弃、Markdown 放弃、整篇只有放弃、跨语法模式放弃）。

完成标准：

- 三次点击任务标记完成一次完整循环，放弃标记语法正确。
- `CMD+SHIFT+A` 归档后，放弃任务留在原位置，`## Done` 里不含放弃任务。
- 日历只显示未完成任务，放弃任务不占日历格。

### 19.2 跨插件日记文件复用

- `src/core/dailyNoteMatch.ts` 新增 `matchDailyNote(input)`，三层查找：精确路径 → 配置目录同名文件 → 其他目录反推日期。
- `MatchDailyNoteInput` 同时接收 `formatFileName`（格式化函数）和 `fileNameFormat`（原始格式串，如 `"YYYYMMDD"`），两者都必须传，理由见 ADR 0012 的「代价」一节。
- 多候选按路径字母序取第一份为主匹配，其余记入 `alternatives`。
- `vaultStore.ts` 调用时传入 `fileNameFormat: format`。
- `tests/dailyNoteMatch.test.ts` 10 个用例，覆盖精确路径、同目录同名、跨目录反推、多候选排序、格式模式隔离。

完成标准：

- vault 中已有其他目录的同日期文件时，点击日期打开已有文件而非新建。
- 换目录或格式后，历史文件仍可被找到。

### 19.3 ICS 只读日历集成

- `src/core/ics.ts`：纯文本解析，支持折行、全天/带时刻事件、UTC 换算、跨天展开、RRULE 四种基础频率（DAILY/WEEKLY/MONTHLY/YEARLY）含 COUNT/UNTIL/EXDATE，`MAX_OCCURRENCES = 400`，`MAX_SPAN_DAYS = 60`。
- 全天事件 DTEND 按 RFC 5545 排他，带时刻事件 DTEND 包含，`getSpanDays(start, end)` 区分两者。
- 不支持的 RRULE 降级为只显示起始一次，不丢弃事件。
- `src/obsidian/icsClient.ts`：用 `requestUrl`（非 `fetch`）绕过 CORS，缓存 TTL 15 分钟，单源失败用上次缓存并上报失败源名。
- 设置项 `icsSources: IcsSource[]`，每条含 `id / name / url / enabled`。
- 日历格内显示 ICS 事件，参与 `+x` 溢出折叠，有单独样式区分 todo 与日程。
- `tests/ics.test.ts` 9 个用例。

完成标准：

- 配置有效 .ics 地址后，事件出现在对应日期格。
- 全天跨天事件在覆盖的每一天各显示一条，不多一天、不少一天。
- 源拉取失败时不清空日历，提示失败源名。

### 19.4 缺失日记行为（missingNoteBehavior）

- `missingNoteBehavior: "create" | "ask"` 设置项，默认 `"create"`（与原有行为一致）。
- `"ask"` 时，点击日历弹出 `src/ui/CreateDailyNoteModal.ts`，用户确认后创建，取消则不创建不报错。
- Modal 文案进入 i18n，支持中英文。

完成标准：

- 默认模式行为无变化（直接创建）。
- `"ask"` 模式弹出 Modal，取消后日历无变化。

### 19.5 标签页标题日期装饰（showDateInTabTitle）

- `showDateInTabTitle: boolean` 设置项，默认 `false`。
- `src/obsidian/tabTitle.ts` 通过 patch `MarkdownView.prototype.getDisplayText` 实现，用 `__textplanPatched` 标志防止重复 patch，插件卸载时还原。
- 只对被识别为 TextPlan 日记的文件生效，其余文件 fallback 到原始方法。

完成标准：

- 开启后，日记文件标签页显示日期（如 `2026-09-19`）而非文件名。
- 关闭后恢复文件名显示。
- 非日记文件标签页不受影响。

### 19.6 验证（第三迭代）

```bash
npm test
npm run build
```

- 53 个测试全绿（含第三迭代新增的 `dailyNoteMatch`、`ics`、`todoArchive` 三态边界用例）。
- `npm run build` 无类型错误，无 esbuild 报错。
- 手动在真实 Obsidian 中验证 §19.1–19.5 完成标准。

