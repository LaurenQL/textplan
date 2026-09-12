import { MarkdownView, TFile, Workspace, WorkspaceLeaf } from "obsidian";
import { TEXTPLAN_VIEW_TYPE } from "../constants";

export async function openTextPlanView(workspace: Workspace): Promise<void> {
  let leaf: WorkspaceLeaf | null = null;
  const leaves = workspace.getLeavesOfType(TEXTPLAN_VIEW_TYPE);

  if (leaves.length > 0) {
    leaf = leaves[0];
  } else {
    leaf = workspace.getLeftLeaf(false);
    if (!leaf) {
      leaf = workspace.getLeaf("split", "vertical");
    }
    await leaf.setViewState({ type: TEXTPLAN_VIEW_TYPE, active: true });
  }

  workspace.revealLeaf(leaf);
}

export async function ensureTextPlanViewInLeftSidebar(workspace: Workspace): Promise<void> {
  // Guard: already mounted, nothing to do.
  if (workspace.getLeavesOfType(TEXTPLAN_VIEW_TYPE).length > 0) {
    return;
  }

  const leaf = workspace.getLeftLeaf(false);
  if (!leaf) {
    return;
  }

  await leaf.setViewState({ type: TEXTPLAN_VIEW_TYPE, active: false });
}

export async function openMarkdownFileBeside(workspace: Workspace, file: TFile): Promise<void> {
  const activeLeaf = workspace.activeLeaf;
  let leaf = findReusableMarkdownLeaf(workspace, activeLeaf);

  if (!leaf) {
    leaf = workspace.getLeaf("split", "vertical");
  }

  await leaf.openFile(file, { active: true });
}

export function getActiveMarkdownFile(workspace: Workspace): TFile | null {
  const view = workspace.getActiveViewOfType(MarkdownView);
  return view?.file ?? null;
}

function findReusableMarkdownLeaf(workspace: Workspace, excludedLeaf: WorkspaceLeaf | null): WorkspaceLeaf | null {
  const leaves = workspace.getLeavesOfType("markdown");
  return leaves.find((leaf) => leaf !== excludedLeaf) ?? null;
}

