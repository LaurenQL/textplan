import { Compartment, type Extension } from "@codemirror/state";
import { Decoration, EditorView, ViewPlugin, ViewUpdate, type DecorationSet } from "@codemirror/view";
import { getCustomAbandonedMarker } from "../core/todo";
import type { TodoSyntaxConfig } from "../settings/types";

interface TodoDecorationConfig {
  syntaxConfig: TodoSyntaxConfig;
}

const todoDecorationCompartment = new Compartment();

export function createTodoDecorationExtension(getConfig: () => TodoDecorationConfig) {
  return todoDecorationCompartment.of(createTodoDecorationPlugin(getConfig));
}

export function reconfigureTodoDecorations(view: EditorView, getConfig: () => TodoDecorationConfig) {
  view.dispatch({
    effects: todoDecorationCompartment.reconfigure(createTodoDecorationPlugin(getConfig)),
  });
}

function createTodoDecorationPlugin(getConfig: () => TodoDecorationConfig): Extension {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      config: TodoDecorationConfig;

      constructor(view: EditorView) {
        this.config = getConfig();
        this.decorations = buildDecorations(view, this.config);
      }

      update(update: ViewUpdate): void {
        const newConfig = getConfig();
        const configChanged = !isSameConfig(newConfig.syntaxConfig, this.config.syntaxConfig);

        if (configChanged) {
          this.config = newConfig;
          this.decorations = buildDecorations(update.view, this.config);
        } else if (update.docChanged || update.viewportChanged || update.selectionSet || update.focusChanged) {
          this.decorations = buildDecorations(update.view, this.config);
        }
      }
    },
    {
      decorations: (plugin) => plugin.decorations,
    },
  );
}

function isSameConfig(a: TodoSyntaxConfig, b: TodoSyntaxConfig): boolean {
  return (
    a.mode === b.mode &&
    a.customOpen === b.customOpen &&
    a.customDone === b.customDone &&
    a.customAbandoned === b.customAbandoned
  );
}

function buildDecorations(view: EditorView, config: TodoDecorationConfig): DecorationSet {
  const decorations: Array<{ from: number; to: number; decoration: Decoration }> = [];

  for (const { from, to } of view.visibleRanges) {
    let position = from;
    while (position <= to) {
      const line = view.state.doc.lineAt(position);
      addLineDecorations(decorations, line.from, line.text, config);
      position = line.to + 1;
    }
  }

  return Decoration.set(
    decorations
      .sort((a, b) => a.from - b.from)
      .map((d) => d.decoration.range(d.from, d.to)),
  );
}

// Decoration.mark() on text ranges only — additive, no layout changes (ADR 0005).
function addLineDecorations(
  decorations: Array<{ from: number; to: number; decoration: Decoration }>,
  lineFrom: number,
  text: string,
  config: TodoDecorationConfig,
): void {
  if (config.syntaxConfig.mode === "markdown") {
    // 已放弃：和已完成一样弱化 + 删除线，只是不进 ## Done
    const abandonedMatch = /^(\s*-\s+\[-\])\s*(.*)$/.exec(text);
    if (abandonedMatch) {
      addStruckLine(decorations, lineFrom, text, abandonedMatch[1].length, "is-textplan-abandoned");
      return;
    }

    const doneMatch = /^(\s*-\s+\[x\])\s*(.*)$/i.exec(text);
    if (doneMatch) {
      addStruckLine(decorations, lineFrom, text, doneMatch[1].length, "is-textplan-done");
      return;
    }

    const openMatch = /^(\s*-\s+\[\s\])/.exec(text);
    if (openMatch) {
      decorations.push({
        from: lineFrom,
        to: lineFrom,
        decoration: Decoration.line({ class: "textplan-editor-line is-textplan-open" }),
      });
    }
    return;
  }

  if (config.syntaxConfig.mode === "asterisk") {
    const abandonedMatch = /^(\s*\*\s*x)\s+(\S.*)$/.exec(text);
    if (abandonedMatch) {
      addStruckLine(decorations, lineFrom, text, abandonedMatch[1].length, "is-textplan-abandoned");
      return;
    }

    const doneMatch = /^(\s*\*(?:\s*✓|\[x\]))\s*(.*)$/i.exec(text);
    if (doneMatch) {
      addStruckLine(decorations, lineFrom, text, doneMatch[1].length, "is-textplan-done");
      return;
    }

    const openMatch = /^(\s*)\*(?!\s*\[[ xX]\])(?!\s*✓)(?!\s*x\s)(?!\s+x\s)\s*\S/.exec(text);
    if (openMatch) {
      decorations.push({
        from: lineFrom,
        to: lineFrom,
        decoration: Decoration.line({ class: "textplan-editor-line is-textplan-open" }),
      });
    }
    return;
  }

  if (config.syntaxConfig.mode === "custom" && config.syntaxConfig.customOpen && config.syntaxConfig.customDone) {
    const abandonedMarker = getCustomAbandonedMarker(config.syntaxConfig);
    if (abandonedMarker) {
      const abandonedMatch = new RegExp(`^(\\s*${escapeRegex(abandonedMarker)})\\s+(\\S.*)$`).exec(text);
      if (abandonedMatch) {
        addStruckLine(decorations, lineFrom, text, abandonedMatch[1].length, "is-textplan-abandoned");
        return;
      }
    }

    const escapedDone = escapeRegex(config.syntaxConfig.customDone);
    const doneMatch = new RegExp(`^(\\s*${escapedDone})\\s*(.*)$`).exec(text);
    if (doneMatch) {
      addStruckLine(decorations, lineFrom, text, doneMatch[1].length, "is-textplan-done");
      return;
    }

    const escapedOpen = escapeRegex(config.syntaxConfig.customOpen);
    const openMatch = new RegExp(`^(\\s*${escapedOpen})\\s*\\S`).exec(text);
    if (openMatch) {
      decorations.push({
        from: lineFrom,
        to: lineFrom,
        decoration: Decoration.line({ class: "textplan-editor-line is-textplan-open" }),
      });
    }
  }
}

/** 已完成 / 已放弃共用的整行弱化 + 正文删除线。 */
function addStruckLine(
  decorations: Array<{ from: number; to: number; decoration: Decoration }>,
  lineFrom: number,
  text: string,
  markerLength: number,
  stateClass: string,
): void {
  decorations.push({
    from: lineFrom,
    to: lineFrom,
    decoration: Decoration.line({ class: `textplan-editor-line ${stateClass}` }),
  });
  const textStart = lineFrom + markerLength;
  const textEnd = lineFrom + text.length;
  if (textStart < textEnd) {
    decorations.push({
      from: textStart,
      to: textEnd,
      decoration: Decoration.mark({ class: "textplan-editor-done-text" }),
    });
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
