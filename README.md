# TextPlan

<p align="center">
  <a href="README.en.md">English</a> · <b>简体中文</b>
</p>

<p align="center">
  <a href="https://github.com/LaurenQL/textplan/releases/latest"><img src="https://img.shields.io/github/v/release/LaurenQL/textplan?label=release" alt="Release"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/LaurenQL/textplan" alt="License"></a>
  <img src="https://img.shields.io/badge/Obsidian-%E2%89%A5%201.5.0-7c3aed" alt="Obsidian 1.5.0+">
</p>

Obsidian 里的每日 todo 插件，给又忙又懒的人用。待办就写在你自己 vault 的 Markdown 文件里，插件不建数据库，也不要你注册账号。左边是日历，右边是当天笔记，点一下格子就跳过去。

```md
- [ ] 交房租
- [x] 买牛奶
- [-] 健身房，不去了
```

## 为什么做这个

我每天要做的事其实不多，但常常忘。看过一些任务管理工具，大多要求先建项目、再建标签、配置一遍流程，光是搭结构就耗掉耐心，用两天就丢在一边。

Obsidian 里本来就有日记。那就顺手在日记里写待办，再给待办配一个日历看着，不用另外开一个应用。

所以 TextPlan 只做一件事，把每天的日记铺成月历。日记还是原来的日记，语法还是原来的 Markdown。

## 日历

月视图和周视图两种。窗口里永远完整显示一个月或者一周，铺满工具栏以下的高度，不会出现滚动条，靠工具栏的 ‹ › 翻页。

周视图可以切成横向或纵向。横向跟月视图的一行一样，纵向是七天上下排开，每天占满宽度，侧边栏窄的时候文字更好读。

格子里有 todo 或日程的时候，底色会深一点，哪天忙一眼能看出来。

## 任务

一条任务有三种状态。点标记，或者按 `CMD+D`，按「未完成 → 已完成 → 已放弃」循环。完成的和放弃都会划线弱化，区别在归档时，放弃的不会进 `## Done`。

日历上只显示未完成和已完成两种，放弃的不再占位置。格子里放不下的任务，最后一行会变成 `+x`，点它打开当天日记。

默认用 Markdown 原生语法，也就是 Obsidian 自己的 checkbox。

```md
- [ ] 未完成
- [x] 已完成
- [-] 已放弃
```

想换口味的话，星号模式长这样。

```md
* 未完成
* ✓ 已完成
* x 已放弃
```

都不合意就在设置里写自己的标记，比如 `>>`、`>>✓`、`>>x`。嵌套的 todo 在哪种模式下都认。

## 提前安排某天的事

日记里的 todo 默认属于当天。如果一件事要提前排，用三级标题给它指定日期，写成下面这样。

```md
### 2026-11-20
- [ ] 交房租
- [ ] 预约牙医
```

这一组会显示在 11 月 20 日，而不是你写它的那天，也不会重复出现在文件当天。标题必须写成 `### YYYY-MM-DD`，遇到下一个标题就结束。

## 外部日程

设置页里填一个 ICS 链接，日程就会以只读方式显示在格子里，和 todo 排在一起。

飞书、Google Calendar、iCloud 这些能导出 ICS 订阅地址的服务都能用。日程不会写进你的笔记，也改不了，TextPlan 只负责显示。

拉取结果缓存 15 分钟。某个源挂了会沿用它上次的结果并给出提示，不至于让日历突然空掉。

## 安装

需要 Obsidian 1.5.0 或以上，桌面端和移动端都行。社区插件市场还在审核，通过之后可以直接在 Obsidian 里搜到，现在先走下面三种。

### 用 BRAT，能自动更新

1. 装 [BRAT](https://github.com/TfTHacker/obsidian42-brat) 插件
2. BRAT 设置里选「Add Beta plugin」，填 `LaurenQL/textplan`
3. 启用 TextPlan

### 用命令行，最快

macOS 或 Linux 用这条，把路径换成你自己的 vault 路径。

```bash
mkdir -p "/path/to/vault/.obsidian/plugins/textplan" && cd "/path/to/vault/.obsidian/plugins/textplan" && for f in main.js manifest.json styles.css; do curl -fsSLO "https://github.com/LaurenQL/textplan/releases/latest/download/$f"; done
```

Windows 用 PowerShell，改一下路径再跑。

```powershell
$dir = "$HOME\Documents\YourVault\.obsidian\plugins\textplan"
New-Item -ItemType Directory -Force -Path $dir | Out-Null
"main.js","manifest.json","styles.css" | ForEach-Object {
  Invoke-WebRequest "https://github.com/LaurenQL/textplan/releases/latest/download/$_" -OutFile "$dir\$_"
}
```

跑完重启 Obsidian，在「设置 → 第三方插件」里启用。

### 手动下载

从 [Releases](https://github.com/LaurenQL/textplan/releases) 拿 `main.js`、`manifest.json`、`styles.css` 三个文件，丢进 `<你的 vault>/.obsidian/plugins/textplan/`，重启后启用。

### 以后怎么更新

BRAT 在设置里点「Check for updates」，命令行把上面那条再跑一遍，手动就用新文件覆盖旧的。三种方式都不要重新配置，你的笔记和设置都不会被动到。

## 快捷键

| 操作 | 键 |
| --- | --- |
| 打开 TextPlan | `CMD+SHIFT+T` |
| 切换任务状态 | `CMD+D` |
| 归档已完成任务 | `CMD+SHIFT+A` |

Windows 和 Linux 把 `CMD` 换成 `Ctrl`。

## 常见问题

**会把我的笔记改坏吗？**
不会。读写都走 Obsidian 的 `Vault.process()`，只动你自己写的 Markdown，不引入私有格式。卸载之后笔记照常打开。

**支持什么文件名？**
默认 `YYYYMMDD.md`，可以改成 `YYYY-MM-DD.md` 之类。开了兼容模式就直接跟 Daily Notes 或 Periodic Notes 的配置走。

**为什么有的任务不出现在日历里？**
放弃的任务不显示，`## Done` 下面的内容也不显示。

**夜间模式看不清字？**
0.1.1 修过这个问题，颜色现在全部跟随主题。用的还是旧版就更新一下。

**会联网吗？**
只有你自己填了 ICS 订阅地址才会去拉取，其他时候不发任何请求，也不收集数据。

## 文档

- [架构设计](docs/ARCHITECTURE.md)
- [实现计划](docs/IMPLEMENTATION_PLAN.md)
- [决策记录 ADR](docs/adr/)，14 篇，每篇写清了当时为什么这么选

## 许可

MIT。随便用，商用也行，保留版权声明就好，具体条文在 [LICENSE](LICENSE)。

## 开发

```bash
npm install
npm test
npm run build
```

TypeScript 加 esbuild。逻辑层放在 `src/core`，不依赖 Obsidian，可以单独跑测试，以后想做成独立应用也能复用。

## 关于作者

Lauren，一个人在做这个插件。

X 上叫 [Lauren_QL](https://x.com/Lauren_QL)，即刻上也叫 [Lauren](https://okjk.co/y9Z6lk)。用着有问题，或者想加点什么，来这两个地方找我都行。

---

用得上的话，点个 star 我会知道。
