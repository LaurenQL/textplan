# ADR 0001：Obsidian Leaf 布局

## 状态

已接受。**实现方式部分被 [ADR 0006](0006-left-sidebar-default-placement.md) 取代**：TextPlan View 改为默认挂载在左侧边栏，而不是主区域的 split leaf。本 ADR 中"双 leaf 联动、不嵌入原生编辑器"的产品形态和约束继续有效。

## 背景

TextPlan 需要在日记 Markdown 编辑器旁边显示月历视图。产品目标是形成简单的“左侧月历 + 右侧编辑器”工作流。

Obsidian 原生 Markdown 编辑器以 workspace view 和 leaf 的形式存在。如果把它当作可嵌入组件塞进自定义 plugin view，就会依赖对 Obsidian 内部实现的不稳定假设。

## 决策

MVP 使用联动的双 leaf 工作区模型：

- 一个 TextPlan 自定义 view leaf，负责月历和控制按钮。
- 一个 Obsidian 原生 Markdown leaf，负责编辑选中日期的日记文件。

插件负责打开或创建日记文件，并请求 Obsidian 在 Markdown leaf 中显示。插件不嵌入、不替换、不重写 Obsidian Markdown 编辑器 UI。

## 影响

收益：

- 保留 Obsidian 原生编辑体验。
- 降低对私有编辑器内部实现的依赖。
- 更符合常见 Obsidian 插件实践。
- 降低 MVP 的实现和维护风险。

取舍：

- 右侧编辑器标题栏和内部 UI 由 Obsidian 控制。
- 设计稿中的部分视觉细节需要放在 TextPlan View，而不是编辑器 leaf 内。
- 工作区分栏由插件协调，但最终由 Obsidian workspace 管理。
