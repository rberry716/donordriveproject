import type { LayoutTemplate, SceneId } from "@/types/display";

export const SCENE_METADATA: Record<
  SceneId,
  {
    label: string;
    selectable: boolean;
    kind: "layout" | "override";
  }
> = {
  STANDBY: { label: "Standby", selectable: true, kind: "layout" },
  DONATIONS: { label: "Donations", selectable: true, kind: "layout" },
  TEAM_LEADERBOARD: { label: "Team Board", selectable: true, kind: "layout" },
  PARTICIPANT_LEADERBOARD: { label: "Participant Board", selectable: true, kind: "layout" },
  TOTAL: { label: "Total Reveal", selectable: false, kind: "override" },
  ANNOUNCEMENT: { label: "Announcement", selectable: false, kind: "override" },
  MILESTONE: { label: "Milestone", selectable: false, kind: "override" },
};

export const LAYOUT_SCENES = (Object.keys(SCENE_METADATA) as SceneId[]).filter(
  (scene) => SCENE_METADATA[scene].selectable,
) as Array<Exclude<SceneId, "TOTAL" | "ANNOUNCEMENT" | "MILESTONE">>;

export const TEMPLATE_METADATA: Array<{
  value: LayoutTemplate;
  label: string;
  slotCount: number;
  hasBar: boolean;
  columns: string[];
}> = [
  { value: "FULL_SCREEN", label: "Full Screen", slotCount: 1, hasBar: false, columns: ["100%"] },
  { value: "FULL_SCREEN_BAR", label: "Full + Rail", slotCount: 1, hasBar: true, columns: ["100%"] },
  { value: "THREE_COLUMN", label: "Three Column", slotCount: 3, hasBar: false, columns: ["33%", "34%", "33%"] },
  {
    value: "THREE_COLUMN_BAR",
    label: "Three Column + Rail",
    slotCount: 3,
    hasBar: true,
    columns: ["33%", "34%", "33%"],
  },
  { value: "MAIN_SIDEBAR", label: "Main + Sidebar", slotCount: 2, hasBar: false, columns: ["66%", "34%"] },
  {
    value: "MAIN_SIDEBAR_BAR",
    label: "Main + Sidebar + Rail",
    slotCount: 2,
    hasBar: true,
    columns: ["66%", "34%"],
  },
];

export const SLOT_COUNTS = TEMPLATE_METADATA.reduce<Record<LayoutTemplate, number>>((acc, template) => {
  acc[template.value] = template.slotCount;
  return acc;
}, {} as Record<LayoutTemplate, number>);

export function getTemplateMeta(template: LayoutTemplate) {
  return TEMPLATE_METADATA.find((entry) => entry.value === template) ?? TEMPLATE_METADATA[0];
}

export function getSceneLabel(scene: string) {
  return SCENE_METADATA[scene as SceneId]?.label ?? scene.replace(/_/g, " ");
}
