import ora from 'ora';
import { api } from '../lib/api.js';
import { heading, label, table, handleError, info } from '../lib/output.js';

export function registerStatusCommand(program) {
  program
    .command('status')
    .description('显示系统状态（连接的打印机、活动订单等）')
    .action(async () => {
      const spinner = ora('获取系统状态...').start();
      try {
        const data = await api.get('/status');
        spinner.stop();

        heading('🏭 RealWorldClaw 系统状态');
        label('服务器', data.server || '在线');
        label('版本', data.version || 'unknown');
        label('打印机在线', String(data.printersOnline ?? 0));
        label('活动订单', String(data.activeOrders ?? 0));
        label('可用模块', String(data.modulesCount ?? 0));
        console.log();
      } catch (err) {
        spinner.fail('获取状态失败');
        handleError(err);
      }
    });
}
