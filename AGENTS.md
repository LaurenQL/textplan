# AGENTS.md

## 项目

TextPlan 是一个用于快速记录每日 todo 的 Obsidian 插件，数据存储在用户 vault 内的 Markdown 文件中。MVP 提供月历视图，并联动打开对应日期的日记文件。

如果本地存在 `TextPlan PRD.md`，在规划产品行为前必须先阅读。该文件仅用于本地协作和需求梳理，不允许提交到 Git。

每次开始工作前，必须阅读 `docs/HANDOFF.md` 了解当前进展、已知问题、测试 vault 和下一步待办。

## 协作语言

- 面向项目协作的文档默认使用中文，包括 `AGENTS.md`、架构文档、实现计划和 ADR。
- 面向用户或公开发布的文档应支持中英双语，例如 `README.md`。
- 插件 UI 需要支持中文和英文，并跟随 Obsidian 当前语言显示。

## 需求变更同步

- 开发讨论中如果产生需求变更、产品范围调整、交互规则变化或架构决策变化，必须同步更新相关文档。
- 如果本地存在 `TextPlan PRD.md`，产品需求变化必须先更新该 PRD。
- 影响架构边界或实现方式的变化，需要同步更新 `docs/ARCHITECTURE.md` 或新增/更新 ADR。
- 影响开发步骤、里程碑或验收标准的变化，需要同步更新 `docs/IMPLEMENTATION_PLAN.md`。
- 更新任何需求或工程文档前，必须先向用户列出拟更新的点，并询问是否确认更新。
- 只有在用户确认后，才可以修改 `TextPlan PRD.md`、`AGENTS.md`、`docs/ARCHITECTURE.md`、`docs/IMPLEMENTATION_PLAN.md` 或 ADR。
- 不要只把需求变化留在聊天记录里。

## 产品约束

- MVP 做成 Obsidian 插件。
- 通过隔离可复用核心逻辑，为未来独立版保留空间。
- 使用左侧 TextPlan 月历 view 联动右侧 Obsidian Markdown leaf 的工作区形态。
- 不嵌入、不替换、不重写 Obsidian 原生 Markdown 编辑器内部 UI。
- 日记文件以 Markdown 存储在用户 vault 中。
- 默认日记目录是 `textplan`。
- 默认文件名格式是 `YYYYMMDD.md`。
- 默认 todo 语法是 `* todo`，完成后写成 `*[x] todo`。
- 默认语法不应触发 Obsidian 原生 Markdown checkbox 渲染。
- 默认语法在 Obsidian 编辑器中不应显示为 Markdown 无序列表圆点；应显示为 TextPlan 任务标记。
- 已完成 TextPlan 任务应有弱化和删除线样式。
- 读取和切换时兼容未完成任务写法 `*todo`，但规范输出为 `* todo`。
- Markdown checkbox 只作为任务归档兼容格式处理，不作为默认模式的月历任务或切换对象。
- 识别嵌套 todo。
- 已完成 todo 在当前日记文件内归档到 `## Done`。

## 架构规则

- Obsidian 无关逻辑放在 `src/core`。
- Obsidian API 适配层放在 `src/obsidian`。
- 视图渲染和 DOM 交互放在 `src/ui`。
- `src/core` 不允许 import `obsidian`。
- todo 解析、日期处理、文件名生成、todo 切换、归档等逻辑优先写成纯函数。
- 用户 vault 文件必须通过 Obsidian `Vault` API 处理，不直接使用 Node `fs` 读写。
- 文件修改尽量使用 `Vault.process()`。
- 设置使用 `Plugin.loadData()` 和 `Plugin.saveData()`。
- 命令通过 Obsidian 插件命令 API 注册。
- 事件、DOM 监听等资源通过 Obsidian 生命周期管理和清理。
- 所有用户可见文案应进入 i18n 资源，不要散落硬编码。

## 预期结构

```text
src/
  main.ts
  constants.ts
  settings/
  core/
  obsidian/
  ui/
tests/
docs/
```

## 常用命令

当脚本存在时，使用：

```bash
npm install
npm test
npm run build
```

实现工作结束前，除非环境不允许，应运行相关测试和 `npm run build`。

## Git 规则

- 不提交 `TextPlan PRD.md`。
- 不提交构建产物 `main.js`，它只作为 GitHub Release 附件发布。
- 提交 `.gitignore`、源码、测试、公开文档、构建配置和 CI 配置。
- 避免无关重构。
- 未经明确要求，不回退用户已有修改。

### 分支策略

单人项目，采用 trunk-based：

- 日常改动直接提交 `main`。
- 较大改动开短生命周期 feature 分支，完成后合回 `main` 并删除。
- 不使用 `develop` / `release` 长期分支。

### 提交规范

使用 Conventional Commits，**英文 subject + 中文 body**：

```text
feat: add vertical week view layout

新增周视图纵向布局，每天占满面板宽度。
横向布局仍为默认，通过 weekViewLayout 设置项切换。
```

- subject 用英文并带 type 前缀（`feat` / `fix` / `docs` / `chore` / `refactor` / `test`），保证工具链可解析，便于日后自动生成 CHANGELOG。
- body 用中文说明动机和影响，与项目文档语言一致。
- 改动较小、subject 已说清时可以省略 body。

### 发布流程

版本号以 `package.json` 为唯一真相源，`manifest.json` 和 `versions.json` 由 `version-bump.mjs` 自动派生，不要手工改。

```bash
npm version patch   # 或 minor / major
git push --follow-tags
```

`npm version` 会同步三个文件、提交并打 tag；push tag 后 `.github/workflows/release.yml` 自动构建并创建 GitHub Release。

Git tag 必须是不带 `v` 前缀的纯版本号（由 `.npmrc` 的 `tag-version-prefix=""` 保证），这是 Obsidian 的硬要求。

详见 [ADR 0010](docs/adr/0010-version-control-and-release.md)。
