import { AREA_DATA, STAGE_DATA } from './level-data.js';

function freeze(value) {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}
freeze(AREA_DATA);
export const AREA_IDS = Object.freeze(Object.keys(AREA_DATA).sort());
export const LEVEL_IDS = Object.freeze(STAGE_DATA.map(stage => stage.stage));
const levels = new Map(STAGE_DATA.map((stage, index) => {
  const [worldNumber, stageNumber] = stage.stage.split('-').map(Number);
  const areaIds = new Set([stage.area, ...(stage.introArea ? [stage.introArea] : [])]);
  for (const id of areaIds) for (const route of AREA_DATA[id].routes) if (route[1] === worldNumber) areaIds.add(route[2]);
  return [stage.stage, freeze({
    id: stage.stage, worldNumber, stageNumber, timer: stage.timer,
    startAreaId: stage.introArea ?? stage.area, mainAreaId: stage.area,
    primaryHard: false, secondaryHard: stage.secondaryHard, ending: stage.stage === '8-4',
    checkpointCameraPage: stage.checkpointCameraPage, nextLevelId: LEVEL_IDS[index + 1] ?? null,
    areaIds: [...areaIds], source: `smb1/levels.asm:World${worldNumber}Areas`
  })];
}));

export function getLevel(id) {
  const level = levels.get(id);
  if (!level) throw new RangeError(`Unknown Mario level: ${String(id)}`);
  return level;
}

export function getAreaData(id) {
  if (!Object.hasOwn(AREA_DATA, id)) throw new RangeError(`Unknown Mario area: ${String(id)}`);
  return AREA_DATA[id];
}
