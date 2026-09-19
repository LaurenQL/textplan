# Handoff

## 当前状态

TextPlan Obsidian 插件 MVP 已完成核心功能实现，包括多语法模式支持和 Daily Notes 插件兼容。

已完成：

- Obsidian 插件工程骨架
- TextPlan 月历 view，采用清爽白色背景和明确分割线的视觉风格
- 点击日期创建或打开对应日记文件
- 三种 todo 语法模式：
  - **Markdown 原生模式**（默认）：`- [ ] todo` / `- [x] todo`
  - **星号模式**：`* todo` / `* ✓ todo` 或 `*[x] todo`
  - **自定义模式**：用户自定义开/完成标记
- Daily Notes / Periodic Notes 插件兼容模式：
  - 读取插件配置的日记目录、文件名格式、模板
  - 自动应用模板内容到新建日记
  - 编辑器识别插件配置目录下的文件为 TextPlan 日记
- Core 纯函数：日期、文件名、月历、todo 解析、todo 切换、归档
- Obsidian 适配层：vault 文件处理、workspace 打开文件、编辑器命令
- 设置页：日记目录、文件名格式、周起始日、完成时记录时间、语法模式、兼容模式开关
- i18n 基础：中文/英文文案，跟随 Obsidian 语言
- 命令和快捷键：
  - `Open TextPlan`
  - `CMD+D` 切换 todo（支持所有语法模式）
  - `CMD+SHIFT+A` 归档已完成 todo（跨语法模式识别）
  - `CMD+SHIFT+T` 打开 TextPlan（冲突时 Notice 提示，§12）
- 归档按钮
- 月历显示未完成 todo
- 编辑器内语法渲染和点击切换（Markdown 和自定义模式）
- CodeMirror 6 装饰系统，支持运行时动态切换语法模式
- **第二迭代已完成（2026-09-06）**：
  - §10 TextPlan 默认在左侧边栏，启用后自动显示
  - §11 归档修复（三个缺陷全部修复）
  - §12 `CMD+SHIFT+T` 打开快捷键，冲突检测
  - §16 已完成任务编辑器内删除线装饰
  - §14 周视图：工具栏月/周切换，纵向（每天全宽）+ 横向（7 列）两种布局，`weekViewLayout` 设置项，默认横向
  - §13 日历显示适配：任务溢出折叠为 `+x`（`ResizeObserver` 重算），尺寸抽成 CSS 变量，移动端缩小字号
  - §15 日历分页与窗口占满：一屏一个完整月或周，铺满可用高度，无滚动条，只通过按钮翻页，不提供滑动手势
  - 工具栏字体统一使用 Obsidian 界面字体和默认字号，并跟随语言显示（中文环境显示「今天」）
  - `CMD+SHIFT+A` 归档前强制刷盘，避免因编辑器防抖写盘导致的「归档 0 个」或结果被覆盖
- **版本控制与发布流程（2026-09-12）**：仓库此前零提交，现已纳入 Git 并建立发布流水线。见下方「发布流程」一节和 [ADR 0010](adr/0010-version-control-and-release.md)
- **第三迭代（2026-09-19）**：三态任务模型（`open / done / abandoned`）、跨插件日记复用 `matchDailyNote` 修复（elsewhere 分支 bug）、ICS 只读日历集成、缺失日记行为（`missingNoteBehavior` 设置）、标签页标题装饰（`showDateInTabTitle`）、归档放弃任务 bug 修复

当前验证：

```bash
npm test
npm run build
```

最近一次结果：

```text
所有测试通过
npm run build 成功
```

## 测试 Vault

测试 vault：

```text
/Users/lauren/Downloads/textpapertest
```

插件安装目录：

```text
/Users/lauren/Downloads/textpapertest/.obsidian/plugins/textplan
```

正式 vault：

```text
/Users/lauren/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian-iCloud
```

更新插件（以正式 vault 为例）：

```bash
cp main.js manifest.json styles.css "/Users/lauren/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian-iCloud/.obsidian/plugins/textplan/"
```

安装后需要在 Obsidian 中执行 `Reload plugins`。

注意：`main.js` 已加入 `.gitignore`，但**仍然存在于工作区**，上面的 `cp` 命令和 `copy-to-test.sh` 照常可用。只是它不再进入提交历史，正式分发走 GitHub Release。

## 发布流程

版本号以 `package.json` 为唯一真相源，`manifest.json` 和 `versions.json` 由 `version-bump.mjs` 自动派生，**不要手工改**。

发版两步：

```bash
npm version patch
git push --follow-tags
```

`npm version` 会同步三个文件、提交并打 tag（纯版本号，无 `v` 前缀，由 `.npmrc` 保证）。push tag 后 `.github/workflows/release.yml` 自动构建，并用 `gh release create` 平铺发布 `main.js`、`manifest.json`、`styles.css`。

三个附件必须平铺，不能打成 zip —— Obsidian 和 BRAT 按文件名直接下载。

日常 push 到 `main` 或开 PR 会触发 `.github/workflows/ci.yml`，跑 `npm ci` → `npm test` → `npm run build`。

分支策略是 trunk-based：日常直接提交 `main`，较大改动开短生命周期 feature 分支。提交信息用 Conventional Commits，英文 subject + 中文 body。细则见 `AGENTS.md` 的「Git 规则」。

### 上架社区插件市场

已确认要上架 Obsidian 官方社区插件市场，`LICENSE` 等合规文件已补齐。尚未提交上架申请。

## 已确认需求口径

### 语法模式

#### Markdown 原生模式（默认）

```md
- [ ] todo
- [x] todo
```

- Obsidian 原生支持，无需额外装饰
- 归档时移动到 `## Done` 下

#### 星号模式

```md
* todo
* ✓ todo
```

或旧版兼容：

```md
*todo
*[x] todo
```

规则：
- `* todo` 是未完成任务
- `*todo` 读取和切换时兼容，规范输出为 `* todo`
- `* ✓ todo` 是已完成任务
- 读取时兼容旧版 `*[x] todo`
- **编辑器内不做装饰改动**，保持 Obsidian 原生列表渲染
- 月历只显示未完成 TextPlan todo
- 归档时移动到 `## Done` 下

#### 自定义模式

用户在设置中自定义开/完成标记，例如：

```md
>> todo
>>x todo
```

### 兼容模式

开启后：
- 读取 Daily Notes 或 Periodic Notes 插件配置
- 新建日记使用插件配置的目录、格式和模板
- 编辑器识别插件配置目录下的文件

### 归档规则

第二迭代后的口径（PRD 6.4）：

- 归档作用于**任意 Markdown 文件**，不限于日记目录
- 目标文件：当前活动 Markdown 文件 → 最近活动过的 Markdown 文件 → 都没有则提示
- 归档 Done 区块**之外**的所有已完成 todo，位置无关，一次归干净
- Done 区块 = `## Done` 标题到下一个 `##`/`#` 或文件末尾
- `## Done` 标题上下各留一个空行
- 跨语法模式识别（可以在 Markdown 模式下归档星号模式的已完成任务）

代码已达到这个口径（三个缺陷均已修复，见下方「归档缺陷根因」的历史记录）。

## 第二迭代（2026-09-06）—— 代码已完成，待手动验证

需求来源：`02 Projects/TextPlan/textplan 2026-09-06 迭代`（Obsidian vault 内，不在本仓库）。

第 10–17 项代码均已实现，`npm test` 和 `npm run build` 通过，已部署到正式 vault。

| # | 需求 | 关键决策 |
|---|---|---|
| 10 | TextPlan 默认在左侧边栏，启用后自动显示 | 用 `getLeftLeaf()` + `onLayoutReady()`，已存在则不重复创建（ADR 0006） |
| 11 | 归档修复 | 三个独立缺陷，见下方「归档缺陷根因」 |
| 12 | 打开 TextPlan 快捷键 | 默认 `CMD+SHIFT+T`，冲突时 Notice 提示 |
| 13 | 日历显示适配 | 溢出折叠为 `+x`，点击行为同日期格；移动端缩小字号 ✅ |
| 14 | 周视图 | 纵向/横向两种布局，设置项 `weekViewLayout` 决定（默认横向），工具栏切换月/周，默认月（ADR 0007）✅ |
| 15 | 日历分页与窗口占满 | 一屏一个完整月/周，CSS Grid 铺满高度，无滚动条，只通过按钮翻页（ADR 0009）✅ |
| 16 | 已完成任务删除线 | 纯叠加装饰，不碰布局（ADR 0005 边界补充）✅ |
| 17 | 工具栏 i18n + 归档快捷键修复 | 工具栏字体统一 Obsidian 界面字体，中文显示「今天」；`CMD+SHIFT+A` 归档前强制刷盘 ✅ |

### 归档缺陷根因（历史记录，四个缺陷均已修复）

「归档有时候不成功」不是一个 bug，是四个：

1. **目标文件解析错误** —— `src/obsidian/editorCommands.ts` 用 `view?.file ?? fallbackFile`。点 TextPlan 视图里的归档按钮时焦点在视图上，`getActiveViewOfType(MarkdownView)` 返回 `null`，只能退到 `activeDailyFile`；插件刚重载时该字段为 `null`，于是静默失败。修法：维护 `lastActiveMarkdownFile`，监听 `active-leaf-change`。
2. **区块判断用了行号大小** —— `src/core/todoArchive.ts` 的 `index < doneStartIndex` 导致写在 `## Done` 之后的已完成任务永远不被归档。修法：改用 Done 区块模型（`## Done` 到下一个 `##`/`#` 或文件末尾），归档区块**之外**的所有已完成 todo。
3. **正则要求标记后必须有非空文本** —— `src/core/todo.ts` 的 `\s+(\S.*)`，空任务 `- [x]` 不匹配。
4. **快捷键归档时编辑器缓冲区未刷盘** —— `archiveActiveMarkdownFile` 使用 `vault.process()` 读磁盘，而编辑器写盘有约 2 秒防抖。在编辑器内用 `CMD+SHIFT+A` 归档时，焦点还在编辑器里，刚标完成的任务尚未落盘 → 读到旧内容 →「归档 0 个」；且编辑器随后刷盘会**覆盖**归档结果。修法：归档前对该文件所有打开的编辑器调用 `MarkdownView.save()` 强制落盘。

另外需求要求 `## Done` 标题下方有空行。

## 已解决 / 已放弃

### 1. 星号模式编辑器视觉优化 —— 已放弃 ⚠️

**问题**：用户希望星号模式下，编辑器内 `*` 显示为彩色星号而非圆点列表标记。

**尝试过的方案**：
- CSS 隐藏 `.list-bullet` + 强制显示 `.cm-formatting-list`
- `Decoration.replace` + widget 替换星号
- `Decoration.mark` 标记星号 + CSS 改色

**结论**：Obsidian 的列表渲染优先级和 CodeMirror 6 的装饰系统复杂度使得在不破坏排版的前提下难以实现。最终决定保持 Obsidian 原生渲染，不做装饰改动。

**边界（重要）**：放弃的只是"替换标记字符"和"改动列表布局"。删除线这类**纯叠加**装饰不在放弃范围内，第二迭代第 16 项会实现。判断标准见 ADR 0005 的「决策的边界」一节。

### 2. 月历视觉风格 —— 已改进 ✅

已将月历改为清爽白色背景风格：
- 纯白背景 `#ffffff`
- 清晰的格子边框 `1px solid #e5e7eb`
- 选中状态浅紫色高亮 `#ede9fe` + 紫色边框 `#a78bfa`
- hover 状态浅灰 `#f9fafb`

窄面板文字溢出和 todo 数量自适应已进入第二迭代第 13 项。

## 重要源码入口

插件入口：`src/main.ts`

TextPlan 日历 view：`src/ui/TextPlanView.ts`

Core 层：
- `src/core/todo.ts` - 多语法模式 todo 解析
- `src/core/todoToggle.ts` - 语法感知的 todo 切换
- `src/core/todoArchive.ts` - 跨语法模式归档
- `src/core/monthGrid.ts` - 月历网格
- `src/core/weekGrid.ts` - 周网格（第二迭代新增，已实现）

Obsidian 适配层：
- `src/obsidian/vaultStore.ts` - 兼容模式文件路径和模板处理，含 `matchDailyNote` 跨目录查找
- `src/obsidian/dailyNotesCompat.ts` - Daily Notes 插件配置读取
- `src/obsidian/editorCommands.ts` - 切换和归档命令的入口
- `src/obsidian/workspace.ts` - leaf 创建和文件打开
- `src/obsidian/todoClickExtension.ts` - 编辑器点击切换
- `src/obsidian/todoDecorations.ts` - 编辑器装饰（含已放弃任务删除线）
- `src/obsidian/textPlanEditorScope.ts` - 文件识别和编辑器类添加
- `src/obsidian/icsClient.ts` - ICS 订阅拉取、缓存、失败降级（第三迭代新增）
- `src/obsidian/tabTitle.ts` - 标签页标题日期装饰（第三迭代新增）

UI：
- `src/ui/CreateDailyNoteModal.ts` - 缺失日记确认 Modal（第三迭代新增，`missingNoteBehavior = "ask"` 时触发）

设置：`src/settings/TextPlanSettingTab.ts`

样式：`styles.css`

## 下一步

**第三迭代代码已全部完成，53 个测试全绿，`npm run build` 通过。**

最优先：**在真实 Obsidian 中手动验证**（第 17 节验收清单仍适用，同时加验第三迭代新功能）：

第二迭代验收（§10–16）：
- 插件启用后 TextPlan 自动出现在左侧边栏
- `CMD+SHIFT+T` 打开 TextPlan，冲突时有提示
- 月/周切换正常，默认月视图；纵向和横向周布局都要看
- 任务多时显示 `+x`，点击行为与日期格一致
- 已完成任务显示删除线，排版无回归
- 在任意 Markdown 文件上归档成功，无遗漏，`## Done` 后有空行

第三迭代验收：
- 点击任务标记三态环：未完成 → 已完成 → 已放弃 → 未完成
- 放弃任务显示删除线弱化，但 `CMD+SHIFT+A` 归档时**不**进入 `## Done`
- 日历只显示未完成任务，已放弃不占位
- 跨插件日记复用：vault 中已有其他目录的同日期日记时，点击日期打开已存在的文件而非新建
- `missingNoteBehavior = "ask"` 时，点击日历弹出确认 Modal 而非直接创建
- `showDateInTabTitle = true` 时，日记文件标签页显示日期而非文件名
- ICS 设置里配置订阅地址后，日历格内显示日程事件（需有效的 .ics 地址）

先按「测试 Vault」一节把 `main.js` / `manifest.json` / `styles.css` 拷进插件目录并 `Reload plugins`。

版本控制收尾：

1. **推送到 GitHub**（本地已有初始提交，remote 已配置好）：

   ```bash
   git push -u origin main
   ```

   推送后到 GitHub Actions 页确认 CI 首次运行通过。

2. **端到端验证发版**（等手动验收通过、决定发 0.1.1 时做）：`npm version patch` → `git push --follow-tags` → 确认 Release 产生且三个附件平铺可下载。

## 协作注意事项

- 每次开始工作前，先读 `AGENTS.md`、`docs/HANDOFF.md`，如果存在本地 `TextPlan PRD.md` 也要读
- 需求变更不要只留在聊天里。按 `AGENTS.md` 规则，先列拟更新点并询问用户确认，再更新 PRD 和相关工程文档
- `TextPlan PRD.md` 是本地文件，不提交 Git
- 不要直接回退用户修改

