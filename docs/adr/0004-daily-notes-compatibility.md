# ADR 0004: Daily Notes 插件兼容模式

## 状态

已接受

## 背景

Obsidian 社区已有成熟的日记管理插件：

- **Daily Notes**（官方内置）：基础日记功能，支持目录、格式、模板配置
- **Periodic Notes**（社区插件）：扩展的周期笔记功能，包含日、周、月、季、年

大量用户已经在使用这些插件管理日记，建立了稳定的工作流。如果 TextPlan 强制使用独立的日记目录和格式：

1. 用户需要维护两套日记系统（Daily Notes 的和 TextPlan 的）
2. 迁移到 TextPlan 需要重新组织文件结构
3. 无法与现有工作流集成

这增加了用户的采用成本，降低了 TextPlan 的实用性。

## 决策

提供"兼容 Obsidian 日记插件"模式，读取 Daily Notes / Periodic Notes 的配置，使用它们的日记目录、文件名格式和模板。

### 实现方案

**配置读取**：

通过 Obsidian App API 访问插件配置：

```typescript
// Daily Notes (内置插件)
const dailyNotesConfig = app.internalPlugins.plugins["daily-notes"]?.instance?.options;

// Periodic Notes (社区插件)
const periodicNotesConfig = app.plugins.plugins["periodic-notes"]?.settings?.daily;
```

优先使用 Periodic Notes 配置（如果已安装），因为它是 Daily Notes 的增强版。

**读取内容**：
- `folder`：日记目录（空字符串表示根目录）
- `format`：Moment.js 日期格式字符串
- `template`：模板文件路径

**文件路径解析**：

兼容模式下，`VaultStore.getDailyNotePath()` 的逻辑：

```typescript
if (settings.compatWithDailyNotes) {
  const config = getDailyNotesConfig(app);
  if (config) {
    const folder = config.folder || "";  // 空字符串 = 根目录
    const format = convertMomentFormatToTextPlan(config.format) || "YYYYMMDD.md";
    return folder ? `${folder}/${filename}` : filename;
  }
}
// fallback 到 TextPlan 自己的配置
```

关键点：不能用 `config.folder || settings.dailyNoteDirectory` 做 fallback，因为空字符串是有效值（表示根目录）。

**模板处理**：

读取模板文件内容，在创建新日记时插入：

```typescript
if (config.template) {
  const templateContent = await readTemplateContent(config.template);
  await vault.create(file, templateContent);
}
```

模板中的日期变量替换（如 `{{date}}`、`{{time}}`）由 Templater 等插件处理，TextPlan 不重复实现。

**编辑器识别**：

`textPlanEditorScope.ts` 中的文件识别逻辑：

```typescript
if (settings.compatWithDailyNotes) {
  const config = getDailyNotesConfig(app);
  if (config) {
    const folder = config.folder.replace(/^\/+|\/+$/g, "");
    if (folder) {
      return file.path.startsWith(`${folder}/`);
    }
    // 根目录情况：通过文件名格式判断
    return file.path.match(/^\d{4}-\d{2}-\d{2}\.md$/) !== null;
  }
}
```

### UI 交互

设置页中：
- 添加"兼容 Obsidian 日记插件"开关（默认关闭）
- 开启后，日记目录和文件名格式设置项变灰禁用
- 显示提示："使用 Daily Notes 或 Periodic Notes 插件的配置"

## 后果

### 正面

- 降低迁移成本，用户可以在现有日记系统中使用 TextPlan
- 与 Obsidian 生态深度集成
- 用户只需维护一套日记配置
- 模板、目录结构保持一致

### 负面

- 依赖第三方插件的 API（可能不稳定）
- 需要处理插件未安装或配置缺失的情况
- 增加了路径解析和文件识别的复杂度
- Moment.js 格式转换可能不完整（只覆盖常见情况）

### 风险缓解

- 配置读取做好容错，插件不存在时 fallback 到 TextPlan 配置
- 文档明确说明兼容模式的前提条件
- 只支持 daily 模式，不支持 weekly/monthly/yearly（降低复杂度）

### 未来考虑

如果 Daily Notes / Periodic Notes API 发生破坏性变更，可能需要：
1. 版本检测和兼容性处理
2. 提供手动配置映射选项
3. 或移除兼容模式，建议用户迁移到 TextPlan 独立配置

## 相关决策

无
