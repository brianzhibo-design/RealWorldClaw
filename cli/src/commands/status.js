import ora from 'ora';
import { api } from '../lib/api.js';
import { heading, label, handleError } from '../lib/output.js';

export function formatStatusJson(data) {
  return {
    server: data.server || '在线',
    version: data.version || 'unknown',
    printersOnline: data.printersOnline ?? 0,
    activeOrders: data.activeOrders ?? 0,
    modulesCount: data.modulesCount ?? 0,
  };
}

export function registerStatusCommand(program) {
  program
    .command('status')
    .description('显示系统状态（连接的打印机、活动订单等）')
    .option('--json', '以 JSON 格式输出')
    .action(async (options) => {
      const spinner = ora('获取系统状态...').start();
      try {
        const data = await api.get('/status');
        const formatted = formatStatusJson(data);
        spinner.stop();

        if (options.json) {
          console.log(JSON.stringify(formatted, null, 2));
          return;
        }

        heading('🏭 RealWorldClaw 系统状态');
        label('服务器', formatted.server);
        label('版本', formatted.version);
        label('打印机在线', String(formatted.printersOnline));
        label('活动订单', String(formatted.activeOrders));
        label('可用模块', String(formatted.modulesCount));
        console.log();
      } catch (err) {
        spinner.fail('获取状态失败');
        handleError(err);
      }
    });
}
