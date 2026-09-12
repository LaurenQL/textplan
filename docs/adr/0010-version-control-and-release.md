# ADR 0010: 版本控制与发布流程

## 状态

已接受

## 背景

项目开发到第二迭代完成，仓库却一直处于**零版本控制**状态：`git` 已初始化、remote 已指向 `https://github.com/LaurenQL/textplan.git`，但一次提交都没有，全部源码、测试和文档都是 untracked，误删即永久丢失。

同时存在三个结构性问题：

1. **版本号散落三处**：`package.json`、`manifest.json`、`versions.json` 各写一份 `0.1.0`，手工同步必然失步。Obsidian 用 `manifest.json` 判断插件版本、用 `versions.json` 判断某版本要求的最低 Obsidian 版本，任何一处漏改都会导致安装异常。
2. **缺少 LICENSE 文件**：`package.json` 声明 `MIT`，但仓库根目录没有对应文件。这是 Obsidian 社区插件市场的硬性审核要求。
3. **发布是纯手工的**：构建、拷贝三件套、传附件全靠人做，容易漏文件或传错版本。

产品决策上已确认 TextPlan 要上架 Obsidian 官方社区插件市场，因此流程必须一次做到符合官方规范，避免上架时返工。

## 决策

### 1. 构建产物 `main.js` 不入库

`main.js` 是 esbuild 的 bundle 产物（约 33KB，压缩后单行），提交它会让每次构建都产生巨大且无意义的 diff，污染提交历史和 code review。

加入 `.gitignore`，只作为 GitHub Release 附件分发。

**代价与缓解**：用户不能直接从仓库拷文件安装，必须走 Release 或 BRAT。本地开发不受影响——文件仍在工作区，`copy-to-test.sh` 和 HANDOFF 里的 `cp` 部署命令照常工作。

### 2. `package.json` 是版本号唯一真相源

新增 `version-bump.mjs`，通过 npm 的 `version` 生命周期钩子调用：

```json
"version": "node version-bump.mjs && git add manifest.json versions.json"
```

脚本从 `process.env.npm_package_version` 读取新版本号，写回 `manifest.json.version`，并向 `versions.json` 追加 `{ 新版本号: manifest.minAppVersion }`。

于是发版收敛成一条命令：

```bash
npm version patch
```

自动完成「升 `package.json` → 同步另外两个文件 → 提交 → 打 tag」。

这是 Obsidian 官方 sample plugin 的标准做法，社区工具链对此有预期。

### 3. Git tag 不带 `v` 前缀

Obsidian 按**纯版本号 tag**（`0.2.0`）定位 Release，`v0.2.0` 会导致拉取失败。

`npm version` 默认加 `v` 前缀，因此新增 `.npmrc`：

```
tag-version-prefix=""
```

### 4. CI 分成两条独立流水线

| Workflow | 触发 | 职责 |
|---|---|---|
| `.github/workflows/ci.yml` | push 到 `main`、所有 PR | `npm ci` → `npm test` → `npm run build` |
| `.github/workflows/release.yml` | push 匹配 `[0-9]+.[0-9]+.[0-9]+` 的 tag | 构建 + 测试 + 创建 Release |

拆开的理由：日常提交只要快速反馈，不该产生 Release；发版是低频、需要写权限（`contents: write`）的操作，权限面应当隔离。

`npm run build` 已包含 `tsc -noEmit -skipLibCheck`，类型检查随构建一起跑，不设独立 lint job。

Release 用 runner 自带的 `gh release create`，不引第三方 action，减少供应链面。

**三个附件必须平铺**（`main.js`、`manifest.json`、`styles.css`），不能打成 zip——Obsidian 和 BRAT 都是直接按文件名下载。

### 5. 分支与提交规范

单人项目，采用 trunk-based：日常直接提交 `main`，较大改动开短生命周期 feature 分支后合回。不引入 gitflow——`develop`/`release` 分支对单人项目只有维护成本。

提交信息用 Conventional Commits，**英文 subject + 中文 body**：subject 保持工具链可解析（便于日后自动生成 CHANGELOG），body 用中文说明动机和影响，与项目文档语言一致。

## 结果

- 全部源码、测试、文档纳入版本控制，有远程兜底
- 版本号不可能再失步
- 发版从「多步手工操作」变成「`npm version patch` + `git push --follow-tags`」
- 补齐 `LICENSE`，满足社区市场上架的合规要求

## 相关

- [ARCHITECTURE.md 打包一节](../ARCHITECTURE.md)
- [IMPLEMENTATION_PLAN.md 第 18 节](../IMPLEMENTATION_PLAN.md)
