# ADR 0005: 放弃星号模式编辑器视觉定制

## 状态

已接受

## 背景

在星号模式下，todo 语法为：

```md
* todo
* ✓ todo
```

由于 `*` 是 Markdown 无序列表标记，Obsidian 在编辑器中会：
1. 隐藏 `*` 字符本身
2. 渲染为列表圆点（`•`）
3. 应用列表的缩进和间距

用户期望的效果是：
- 显示 `*` 字符而非圆点
- `*` 使用主题的强调色（accent color）
- 保持与其他内容一致的排版

## 尝试过的方案

### 方案 1：CSS 覆盖

```css
.cm-line.textplan-editor-line .list-bullet {
  display: none !important;
}
.cm-line.textplan-editor-line .cm-formatting-list {
  display: inline !important;
  color: var(--text-accent) !important;
}
```

**结果**：失败。圆点隐藏了，但 `*` 字符也不显示——Obsidian 通过其他机制隐藏格式标记，`display: inline` 无法恢复。

### 方案 2：Decoration.replace + Widget

```typescript
decorations.push({
  from: markerStart,
  to: markerEnd,
  decoration: Decoration.replace({
    widget: new AsteriskWidget()  // 渲染 <span>*</span>
  })
});
```

**结果**：部分成功但有严重副作用。
- ✅ 星号正确显示为彩色
- ❌ 破坏了列表布局，文本与星号间距异常大
- ❌ 调整替换范围（包含/不包含空格）都无法解决间距问题
- ❌ 尝试用 CSS `padding-left: 0` 修正，导致整行左对齐失去缩进

### 方案 3：Decoration.mark + CSS

```typescript
decorations.push({
  from: markerStart,
  to: markerStart + 1,
  decoration: Decoration.mark({ class: "textplan-asterisk-marker" })
});
```

```css
.textplan-asterisk-marker {
  color: var(--text-accent) !important;
}
```

**结果**：失败。装饰确实生效（用背景色验证过），但由于 Obsidian 已经隐藏了 `*` 字符，给一个不可见元素改颜色没有效果。

### 方案 4：参考 obsidian-outliner 插件

搜索发现 [obsidian-outliner](https://github.com/vslinko/obsidian-outliner) 通过 CSS 修改列表标记样式：

```css
.cm-formatting-list-ul { margin-right: 0.3em; }
.list-bullet::after {
  width: 0.4em;
  height: 0.4em;
  background-color: var(--text-muted);
}
```

**关键发现**：该插件是**修改圆点的样式**（大小、颜色），而不是**替换为其他字符**。它接受了 Obsidian 的列表渲染机制，只做微调。

## 决策

**放弃星号模式的编辑器视觉定制**，保持 Obsidian 原生列表渲染。

### 理由

1. **技术风险高**
   - 与 Obsidian 核心渲染逻辑对抗
   - 每次 Obsidian 更新都可能破坏定制
   - CodeMirror 6 装饰系统与 Obsidian 的 Markdown 渲染层交互复杂

2. **投入产出比低**
   - 核心功能（解析、切换、归档、月历显示）已完整可用
   - 视觉差异不影响功能使用
   - 已投入大量时间尝试多种方案均失败

3. **有替代方案**
   - 用户可以选择 Markdown 原生模式，获得完美的视觉体验（原生 checkbox）
   - 星号模式适合追求输入速度的用户，他们对视觉要求相对较低

4. **稳定性优先**
   - 保持原生渲染意味着不会因 Obsidian 更新而崩溃
   - 减少了维护负担

### 实现

`src/obsidian/todoDecorations.ts` 中：

```typescript
function buildDecorations(view, config) {
  if (config.syntaxConfig.mode === "markdown") {
    return Decoration.none;  // Obsidian 原生支持
  }
  
  if (config.syntaxConfig.mode === "asterisk") {
    return Decoration.none;  // 保持原生渲染
  }
  
  // 只有自定义模式添加装饰
  // ...
}
```

`styles.css` 中移除所有星号模式相关的 CSS 规则。

## 后果

### 正面

- 代码简化，减少维护负担
- 不会因 Obsidian 更新而失效
- 星号模式功能完整可用

### 负面

- 星号模式的视觉体验不如预期
- 用户可能感到失望

### 缓解措施

- 文档明确说明星号模式的视觉表现（显示为列表圆点）
- 推荐追求视觉效果的用户使用 Markdown 原生模式
- 在设置页可以添加说明文字

## 决策的边界（2026-09-06 补充）

被放弃的是**替换标记字符**和**改动列表布局**这两类做法，不是"星号模式下不许有任何装饰"。

判断标准是：这个装饰是否与 Obsidian 的渲染层争夺同一块职责。

| 做法 | 是否在放弃范围内 | 原因 |
|---|---|---|
| `Decoration.replace` 换掉列表标记 | 是 | 与 Obsidian 的列表标记渲染直接冲突 |
| 修改 `padding` / `margin` / 缩进 | 是 | 与 Obsidian 的列表布局直接冲突 |
| 隐藏 `.list-bullet` 再自己画 | 是 | 同上 |
| 给**文本区间**加删除线、弱化、颜色 | **否** | 纯叠加，不涉及标记字符和布局 |
| 加行级 class 供 CSS 着色 | **否** | 只要不改布局属性即可 |

因此第二迭代中"已完成任务显示删除线"的需求可以实现，且必须遵守：

- 装饰区间只覆盖任务**文本**，不覆盖标记（`- [x]`、`* ✓`）
- CSS 只写 `text-decoration` 和颜色/透明度，不写 `padding`、`margin`、`display`、`position`
- 改动后必须对照截图确认列表缩进与标记间距无回归

这一条是本 ADR 的实际可操作产出：**装饰系统做加法可以，做替换不行。**

## 经验教训

1. **不要与框架的核心机制对抗**
   - Obsidian 的 Markdown 渲染是深度集成的
   - 装饰系统适合"增强"而非"替换"原生行为

2. **先验证再实现**
   - 用简单的方式（如背景色）先验证装饰是否生效
   - 避免在错误的方向上投入过多时间

3. **参考成熟插件的做法**
   - obsidian-outliner 选择微调而非替换，这是更务实的策略
   - 应该更早搜索社区实践

4. **及时止损**
   - 多次尝试失败后应该重新评估必要性
   - 功能完整 > 视觉完美

## 相关决策

- [ADR 0002: 完成标记 `* ✓`](0002-asterisk-check-mark-completed.md)
- [ADR 0003: 多语法模式支持](0003-multiple-syntax-modes.md)
