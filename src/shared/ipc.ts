// IPC channel names shared between the main process and the preload script.

export const IPC = {
  openCard: 'charcraft:openCard',
  openFile: 'charcraft:openFile',
  saveFile: 'charcraft:saveFile',
  aiChat: 'charcraft:aiChat',
  listModels: 'charcraft:listModels',
  getConfig: 'charcraft:getConfig',
  setConfig: 'charcraft:setConfig',
  getDraft: 'charcraft:getDraft',
  setDraft: 'charcraft:setDraft',
} as const;
