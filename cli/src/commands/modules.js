import ora from 'ora';
import { api } from '../lib/api.js';
import { heading, label, table, handleError } from '../lib/output.js';

export function registerModulesCommand(program) {
  const cmd = program
    .command('modules')
    .description('模块管理');

  cmd
    .command('list')
    .description('列出所有可用模块')
    .action(async () => {
      const spinner = ora('获取模块列表...').start();
      try {
        const data = await api.get('/modules');
        spinner.stop();
        const modules = data.modules || data;
        if (!modules.length) {
          heading('📦 暂无可用模块');
          return;
        }
        heading('📦 可用模块');
        table(
          ['ID', '名称', '类别', '价格'],
          modules.map(m => [m.id, m.name, m.category || '-', m.price ? `¥${m.price}` : '-'])
        );
      } catch (err) {
        spinner.fail('获取失败');
        handleError(err);
      }
    });

  cmd
    .command('info <id>')
    .description('查看模块详情')
    .action(async (id) => {
      const spinner = ora('获取模块信息...').start();
      try {
        const m = await api.get(`/modules/${id}`);
        spinner.stop();
        heading(`📦 模块: ${m.name}`);
        label('ID', m.id);
        label('名称', m.name);
        label('类别', m.category || '-');
        label('描述', m.description || '-');
        label('价格', m.price ? `¥${m.price}` : '-');
        label('打印时间', m.printTime || '-');
        label('材料', m.material || '-');
        console.log();
      } catch (err) {
        spinner.fail('获取失败');
        handleError(err);
      }
    });
}
