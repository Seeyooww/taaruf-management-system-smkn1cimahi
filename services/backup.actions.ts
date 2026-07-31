"use server";

import {
  exportDatabaseToJSON,
  resetDummyData,
  restoreDatabaseFromJSON,
  runSimulationDayOne,
  seedDummyData,
  toggleLockEventMode,
} from "@/services/backup.service";

export async function exportDatabaseAction() {
  return await exportDatabaseToJSON();
}

export async function restoreDatabaseAction(jsonData: any) {
  return await restoreDatabaseFromJSON(jsonData);
}

export async function seedDummyDataAction() {
  return await seedDummyData();
}

export async function resetDummyDataAction() {
  return await resetDummyData();
}

export async function runSimulationDayOneAction() {
  return await runSimulationDayOne();
}

export async function toggleLockEventAction(locked: boolean) {
  return await toggleLockEventMode(locked);
}
