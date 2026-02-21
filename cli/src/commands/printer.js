import ora from 'ora';
import { api } from '../lib/api.js';
import { heading, label, table, handleError } from '../lib/output.js';
import chalk from 'chalk';

const statusColor = (s) => {
  if (s === 'online' || s === 'idle') return chalk.green(s);
  if (s === 'printing') return chalk.yellow(s);
  return chalk.red(s);
};

export function registerPrinterCommand(program) {
  const cmd = program
    .command('printer')
    .description('打印机管理');

  cmd
    .command('list')
    .description('列出连接的打印机')
    .action(async () => {
      const spinner = ora('获取打印机列表...').start();
      try {
        const data = await api.get('/printers');
        spinner.stop();
        const printers = data.printers || data;
        if (!printers.length) {
          heading('🖨️  暂无连接的打印机');
          return;
        }
        heading('🖨️  打印机列表');
        table(
          ['ID', '名称', '型号', '状态'],
          printers.map(p => [p.id, p.name, p.model || '-', statusColor(p.status)])
        );
      } catch (err) {
        spinner.fail('获取失败');
        handleError(err);
      }
    });

  cmd
    .command('status <id>')
    .description('查看打印机详细状态')
    .action(async (id) => {
      const spinner = ora('获取打印机状态...').start();
      try {
        const p = await api.get(`/printers/${id}`);
        spinner.stop();
        heading(`🖨️  打印机: ${p.name}`);
        label('ID', p.id);
        label('型号', p.model || '-');
        label('状态', statusColor(p.status));
        label('喷嘴温度', p.nozzleTemp ? `${p.nozzleTemp}°C` : '-');
        label('热床温度', p.bedTemp ? `${p.bedTemp}°C` : '-');
        label('进度', p.progress != null ? `${p.progress}%` : '-');
        label('当前任务', p.currentJob || '-');
        console.log();
      } catch (err) {
        spinner.fail('获取失败');
        handleError(err);
      }
    });
}
