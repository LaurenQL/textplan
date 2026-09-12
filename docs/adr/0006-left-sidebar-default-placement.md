# ADR 0006: TextPlan View 默认放置于左侧边栏

## 状态

已接受。部分取代 [ADR 0001](0001-obsidian-leaf-layout.md)。

## 背景

ADR 0001 确定了"TextPlan View + Markdown leaf 左右分栏"的工作区形态，实现上使用了 `workspace.getLeaf("split", "vertical")`，即在**主区域**里切出一个 split leaf。

实际使用后暴露三个问题：

1. **需要手动打开**：插件启用后什么都不显示，用户必须先执行「打开 TextPlan」命令。对一个"每天都要看一眼"的工具来说，这个门槛不合理。
2. **占用主区域**：TextPlan 是一个常驻的导航型面板，性质接近文件浏览器和搜索，而不是内容型标签页。放在主区域会挤占编辑空间，也会被用户在标签页之间切换时误关。
3. **与 Obsidian 惯例不符**：Calendar、Daily Notes 等同类插件都挂在侧边栏，用户的肌肉记忆是去侧边栏找它。

## 决策

TextPlan View 默认挂载在 **Obsidian 左侧边栏**，并在插件启用后自动创建和激活。

### 实现方案

```typescript
// onload 中
this.app.workspace.onLayoutReady(() => {
  void this.activateView();
});

async activateView() {
  const existing = this.app.workspace.getLeavesOfType(TEXTPLAN_VIEW_TYPE);
  if (existing.length > 0) {
    this.app.workspace.revealLeaf(existing[0]);
    return;
  }
  const leaf = this.app.workspace.getLeftLeaf(false);
  await leaf?.setViewState({ type: TEXTPLAN_VIEW_TYPE, active: true });
  if (leaf) this.app.workspace.revealLeaf(leaf);
}
```

关键约束：

- **必须等 `onLayoutReady`**。Obsidian 在启动时会恢复上次的工作区布局，如果在 `onload` 里直接创建 leaf，会与恢复出来的 leaf 重复，用户会看到两个 TextPlan。
- **必须先检查是否已存在**。`getLeavesOfType` 有结果就只 reveal，不创建。
- **不锁定位置**。用户可以把视图拖到主区域或右侧边栏，Obsidian 会记住这个选择，下次启动时恢复；插件只在完全不存在时才创建。

日记文件改为在**主区域** Markdown leaf 打开，`openMarkdownFileBeside` 需要排除侧边栏 leaf，避免把日记开到侧边栏里。

## 后果

### 正面

- 开箱即用，无需手动执行命令
- 符合 Obsidian 同类插件的惯例，用户找得到
- 不占用主区域编辑空间
- 与"左侧日历 + 右侧编辑器"的产品意图更贴合

### 负面

- 左侧边栏宽度远小于主区域，日历渲染必须在窄栏下保持可读——这是需求「日历显示适配」（`+x` 折叠、移动端字号）的直接来源
- 自动创建视图对用户来说是一种"未经请求的布局改动"，虽然只发生一次，但需要保证不覆盖用户后续的调整

### 缓解

- 只在不存在时创建，尊重用户的位置调整
- 日历渲染做窄栏适配和任务溢出折叠

## 与 ADR 0001 的关系

ADR 0001 中"左侧日历 + 右侧原生编辑器联动"的**产品形态**依然有效，被取代的只是**实现方式**：从主区域 split leaf 改为左侧边栏 leaf。ADR 0001 中"不嵌入、不重写 Obsidian 原生编辑器"的约束继续生效。

## 相关决策

- [ADR 0001: Obsidian Leaf 布局](0001-obsidian-leaf-layout.md)
- [ADR 0007: 月/周双日历模式](0007-month-week-calendar-modes.md)
