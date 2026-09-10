import { describe, expect, it } from 'vitest';

import { enUS } from './en-US';
import { zhCN } from './zh-CN';

const screenshotKeys = [
  'tabConfig',
  'tabExecution',
  'code',
  'codeFilterPlaceholder',
  'name',
  'nameFilterPlaceholder',
  'workflowType',
  'workflowTypeFilterPlaceholder',
  'taskQueue',
  'taskQueueFilterPlaceholder',
  'status',
  'configListTitle',
  'createConfig',
  'cronExpr',
  'timeoutSeconds',
  'action',
  'edit',
  'disable',
  'enable',
  'trigger',
  'delete',
] as const;

describe('task i18n namespace', () => {
  it('registers zh-CN and en-US task modules', () => {
    expect(zhCN.task).toBeDefined();
    expect(enUS.task).toBeDefined();
  });

  it('translates the task schedule page keys shown in the sidebar view', () => {
    for (const key of screenshotKeys) {
      expect(zhCN.task[key]).toBeTruthy();
      expect(zhCN.task[key]).not.toBe(key);
      expect(enUS.task[key]).toBeTruthy();
      expect(enUS.task[key]).not.toBe(key);
    }
    expect(zhCN.task.tabConfig).toBe('任务配置');
    expect(zhCN.task.configListTitle).toBe('任务配置');
    expect(zhCN.task.createConfig).toBe('新增任务');
  });
});
