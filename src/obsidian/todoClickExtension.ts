import { EditorView } from "@codemirror/view";
import { parseTodoLine } from "../core/todo";
import { toggleTodoLine } from "../core/todoToggle";
import type { TextPlanSettings } from "../settings/types";

export function createTodoClickExtension(
  getSettings: () => TextPlanSettings,
  getDoneDate: () => string,
  onChanged: () => void,
): ReturnType<typeof EditorView.domEventHandlers> {
  return EditorView.domEventHandlers({
    mousedown(event, view) {
      const position = view.posAtCoords({ x: event.clientX, y: event.clientY });
      if (position === null) {
        return false;
      }

      const line = view.state.doc.lineAt(position);
      const lineText = line.text;
      const settings = getSettings();
      const markerRange = getClickableMarkerRange(lineText, settings);
      if (!markerRange) {
        return false;
      }

      const offset = position - line.from;
      if (offset < markerRange.from || offset >= markerRange.to) {
        return false;
      }

      const nextLine = toggleTodoLine(lineText, {
        recordCompletionTime: settings.recordCompletionTime,
        doneDate: getDoneDate(),
        syntaxConfig: settings.todoSyntax,
      });

      if (nextLine === lineText) {
        return false;
      }

      view.dispatch({
        changes: {
          from: line.from,
          to: line.to,
          insert: nextLine,
        },
      });
      onChanged();
      event.preventDefault();
      return true;
    },
  });
}

/**
 * 可点击的标记范围：从缩进结束到标记（含其后的空白）结束。
 *
 * 走 parseTodoLine 而不是自己写正则，这样三种语法模式（含自定义）以及新增的
 * 已放弃标记都自动覆盖 —— 点击 `- [-]` / `* x ` / 自定义放弃标记同样能循环状态。
 */
function getClickableMarkerRange(line: string, settings: TextPlanSettings): { from: number; to: number } | null {
  const todo = parseTodoLine(line, 0, false, settings.todoSyntax);
  if (!todo) {
    return null;
  }
  const markerStart = todo.indent.length;
  const markerEnd = markerStart + todo.marker.length;
  return { from: markerStart, to: markerEnd + 1 };
}
