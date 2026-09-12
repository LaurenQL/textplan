import { Compartment } from "@codemirror/state";
import { Decoration, EditorView, ViewPlugin, ViewUpdate, type DecorationSet } from "@codemirror/view";
import type { TodoSyntaxConfig } from "../settings/types";

interface TodoDecorationConfig {
  syntaxConfig: TodoSyntaxConfig;
}

const todoDecorationCompartment = new Compartment();

export function createTodoDecorationExtension(getConfig: () => TodoDecorationConfig) {
  return todoDecorationCompartment.of(
    ViewPlugin.fromClass(
      class {
        decorations: DecorationSet;
        config: TodoDecorationConfig;

        constructor(view: EditorView) {
          this.config = getConfig();
          this.decorations = buildDecorations(view, this.config);
        }

        update(update: ViewUpdate): void {
          const newConfig = getConfig();
          const configChanged = newConfig.syntaxConfig.mode !== this.config.syntaxConfig.mode;

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
    ),
  );
}

export function reconfigureTodoDecorations(view: EditorView, getConfig: () => TodoDecorationConfig) {
  view.dispatch({
    effects: todoDecorationCompartment.reconfigure(
      ViewPlugin.fromClass(
        class {
          decorations: DecorationSet;
          config: TodoDecorationConfig;

          constructor(view: EditorView) {
            this.config = getConfig();
            this.decorations = buildDecorations(view, this.config);
          }

          update(update: ViewUpdate): void {
            const newConfig = getConfig();
            const configChanged = newConfig.syntaxConfig.mode !== this.config.syntaxConfig.mode;

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
      ),
    ),
  });
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
    const doneMatch = /^(\s*-\s+\[x\])\s*(.*)$/i.exec(text);
    if (doneMatch) {
      decorations.push({
        from: lineFrom,
        to: lineFrom,
        decoration: Decoration.line({ class: "textplan-editor-line is-textplan-done" }),
      });
      const textStart = lineFrom + doneMatch[1].length;
      const textEnd = lineFrom + text.length;
      if (textStart < textEnd) {
        decorations.push({
          from: textStart,
          to: textEnd,
          decoration: Decoration.mark({ class: "textplan-editor-done-text" }),
        });
      }
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
    const doneMatch = /^(\s*\*(?:\s*✓|\[x\]))\s*(.*)$/i.exec(text);
    if (doneMatch) {
      decorations.push({
        from: lineFrom,
        to: lineFrom,
        decoration: Decoration.line({ class: "textplan-editor-line is-textplan-done" }),
      });
      const textStart = lineFrom + doneMatch[1].length;
      const textEnd = lineFrom + text.length;
      if (textStart < textEnd) {
        decorations.push({
          from: textStart,
          to: textEnd,
          decoration: Decoration.mark({ class: "textplan-editor-done-text" }),
        });
      }
      return;
    }

    const openMatch = /^(\s*)\*(?!\s*\[[ xX]\])(?!\s*✓)\s*\S/.exec(text);
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
    const escapedDone = escapeRegex(config.syntaxConfig.customDone);
    const donePattern = new RegExp(`^(\\s*${escapedDone})\\s*(.*)$`);
    const doneMatch = donePattern.exec(text);
    if (doneMatch) {
      decorations.push({
        from: lineFrom,
        to: lineFrom,
        decoration: Decoration.line({ class: "textplan-editor-line is-textplan-done" }),
      });
      const textStart = lineFrom + doneMatch[1].length;
      const textEnd = lineFrom + text.length;
      if (textStart < textEnd) {
        decorations.push({
          from: textStart,
          to: textEnd,
          decoration: Decoration.mark({ class: "textplan-editor-done-text" }),
        });
      }
      return;
    }

    const escapedOpen = escapeRegex(config.syntaxConfig.customOpen);
    const openPattern = new RegExp(`^(\\s*${escapedOpen})\\s*\\S`);
    const openMatch = openPattern.exec(text);
    if (openMatch) {
      decorations.push({
        from: lineFrom,
        to: lineFrom,
        decoration: Decoration.line({ class: "textplan-editor-line is-textplan-open" }),
      });
    }
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
