import { Settings } from "../models/Settings";

export interface UpdateSettingsInput {
  storeName?: string;
  supportEmail?: string;
}

async function getOrCreateSettings() {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }
  return settings;
}

export async function getSettings() {
  return getOrCreateSettings();
}

export async function updateSettings(changes: UpdateSettingsInput) {
  const settings = await getOrCreateSettings();
  Object.assign(settings, changes);
  await settings.save();
  return settings;
}
