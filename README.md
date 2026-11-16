# TextPlan

<p align="center">
  <a href="README.en.md">English</a> · <b>简体中文</b>
</p>

<p align="center">
  <a href="https://github.com/LaurenQL/textplan/releases/latest"><img src="https://img.shields.io/github/v/release/LaurenQL/textplan?label=release" alt="Release"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/LaurenQL/textplan" alt="License"></a>
  <img src="https://img.shields.io/badge/Obsidian-%E2%89%A5%201.5.0-7c3aed" alt="Obsidian 1.5.0+">
</p>

一个给 **又忙又懒的人** 用的 Obsidian 每日 todo 插件。数据就是你的 Markdown 文件，没有数据库、没有订阅、没有账号。左边日历，右边笔记，点一下格子就是那天。

```md
- [ ] 交房租
- [x] 买牛奶
- [-] 健身房（不去了）
```

## 是什么

TextPlan 把「今天的待办」放进一个一目了然的月历里。点开某一天，就是当天的日记文件；在日记里写 `- [ ] 任务`，它就出现在日历格子上。

不引入任何新格式，不锁数据。哪天不想用了，删掉插件，你的笔记还是你的笔记。

## 功能

- **日历视图**：月视图 + 周视图（横向 / 纵向两种布局），一屏完整展示一个月或一周，铺满窗口高度，没有滚动条
- **有内容的格子更醒目**：当天有 todo 或日程时格子底色加深
- **三态任务**：未完成 → 已完成 → 已放弃，点标记或 `CMD+D` 循环切换；已完成的划线弱化显示，已放弃的不占日历位
- **任务溢出折叠**：格子放不下时显示 `+x`，点它打开当天日记
- **按日期分组**：在日记里写 `### 2026-11-20`，这一组 todo 就显示在 11 月 20 日，适合提前安排几天后的事
- **外部日历**：添加 ICS 订阅地址，飞书 / Google Calendar / iCloud 的日程和 todo 一起显示在格子里（只读，不回写）
- **多语法模式**：Markdown 原生（默认）/ 星号 / 自定义
- **Daily Notes 兼容**：复用 Daily Notes 或 Periodic Notes 的目录、格式和模板
- **全局归档**：`CMD+SHIFT+A` 把任意 Markdown 文件里的已完成任务收进 `## Done`
- **移动端与夜间模式**：跟随 Obsidian 主题，任何模式下字都看得清

## 安装

> 需要 **Obsidian 1.5.0 或更高版本**。桌面端和移动端都支持。

社区插件市场正在提交审核，通过后可以直接在 Obsidian 里搜索安装。

### 方式一：BRAT（推荐，可自动更新）

1. 安装 [BRAT](https://github.com/TfTHacker/obsidian42-brat) 插件
2. BRAT 设置里「Add Beta plugin」，填入 `LaurenQL/textplan`
3. 启用 TextPlan

### 方式二：命令行（最快）

**macOS / Linux** —— 把 `/path/to/vault` 换成你的 vault 路径：

```bash
mkdir -p "/path/to/vault/.obsidian/plugins/textplan" && cd "/path/to/vault/.obsidian/plugins/textplan" && for f in main.js manifest.json styles.css; do curl -fsSLO "https://github.com/LaurenQL/textplan/releases/latest/download/$f"; done
```

**Windows PowerShell**：

```powershell
$dir = "$HOME\Documents\YourVault\.obsidian\plugins\textplan"
New-Item -ItemType Directory -Force -Path $dir | Out-Null
"main.js","manifest.json","styles.css" | ForEach-Object {
  Invoke-WebRequest "https://github.com/LaurenQL/textplan/releases/latest/download/$_" -OutFile "$dir\$_"
}
```

然后重启 Obsidian，在「设置 → 第三方插件」里启用 TextPlan。

### 方式三：手动下载

从 [Releases](https://github.com/LaurenQL/textplan/releases) 下载 `main.js`、`manifest.json`、`styles.css`，放进 `<你的 vault>/.obsidian/plugins/textplan/`，重启 Obsidian 后启用。

### 升级

- **BRAT**：设置里点「Check for updates」，或等它自动检查
- **命令行**：把上面那条命令再跑一次，然后重启 Obsidian
- **手动**：用新版本覆盖三个文件，重启 Obsidian

升级不会动你的笔记，也不会重置设置。

## 用法

打开 TextPlan 后：

- **点日历格子** —— 打开或创建那天（默认直接创建，可在设置里改成先询问，或只选中不新建）
- **点任务标记或按 `CMD+D`** —— 切换任务状态
- **`CMD+SHIFT+T`** —— 打开 TextPlan
- **`CMD+SHIFT+A`** —— 归档已完成任务

> Windows / Linux 用户把 `CMD` 换成 `Ctrl`。

### 语法

**Markdown 原生（默认）**

```md
- [ ] 未完成
- [x] 已完成
- [-] 已放弃
```

**星号模式**

```md
* 未完成
* ✓ 已完成
* x 已放弃
```

**自定义模式**

在设置里定义自己的开 / 完成 / 放弃标记，例如 `>>` / `>>✓` / `>>x`。

### 提前安排某天的事

```md
### 2026-11-20
- [ ] 交房租
- [ ] 预约牙医
```

这组 todo 会显示在 11 月 20 日，而不是你写它的那天。标题必须是 `### YYYY-MM-DD`，遇到下一个标题时分组结束。

### 外部日历

设置页「日程订阅源」里添加 ICS 链接即可。进程内缓存 15 分钟，拉取失败时沿用上次结果并提示，不会让日历突然空掉。

> 日程只读：TextPlan 不创建、不修改、不删除任何外部事件，也不把它们写进 vault 文件。

## 常见问题

**会不会破坏我的笔记？**
不会。TextPlan 只通过 Obsidian 的 `Vault.process()` 读写你已有的 Markdown 文件，不新增私有格式。卸载插件后笔记照常可用。

**支持哪些日记文件命名？**
默认 `YYYYMMDD.md`，可在设置里改成 `YYYY-MM-DD.md` 等；开启兼容模式后直接沿用 Daily Notes / Periodic Notes 的配置。

**为什么日历里看不到某些任务？**
已放弃的任务（`- [-]` / `* x`）不显示在日历里；`## Done` 区块内的内容也不会显示。

**夜间模式下字看不清？**
v0.1.1 已修复，所有颜色跟随主题变量。如果你用的是旧版，更新到最新 Release。

**TextPlan 会联网吗？**
不会，除非你自己配置了 ICS 日程订阅。插件本身不收集任何数据、不发起任何网络请求。

## 文档

- [架构设计](docs/ARCHITECTURE.md)
- [实现计划](docs/IMPLEMENTATION_PLAN.md)
- [决策记录（ADR）](docs/adr/) —— 14 篇，记录每个关键取舍的原因

## 许可

[MIT](LICENSE)。随便用、随便改、可以商用，保留版权声明即可。

## 开发

```bash
npm install
npm test
npm run build
```

插件是 TypeScript + esbuild，逻辑层（`src/core`）不依赖 Obsidian，可单独测试和复用。

## 关于作者

**Lauren** —— 在做一个「用最少动作管住每天」的小工具。

- X：[@@Lauren_QL](https://x.com/Lauren_QL)
- 即刻：[Lauren](https://okjk.co/y9Z6lk)

有想法、发现 bug，或者只是想说这个插件帮到你了，都欢迎来聊。

---

<p align="center">
  如果 TextPlan 对你有用，给个 ⭐ 是最好的鼓励。
</p>
