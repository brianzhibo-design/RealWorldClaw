import ora from 'ora';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { api } from '../lib/api.js';
import { heading, label, table, success, handleError } from '../lib/output.js';

const statusEmoji = (s) => {
  const map = { pending: '⏳', printing: '🖨️', shipped: '📦', completed: '✅', cancelled: '❌' };
  return (map[s] || '❓') + ' ' + s;
};

export function registerOrdersCommand(program) {
  const cmd = program
    .command('orders')
    .description('订单管理');

  cmd
    .command('list')
    .description('查看我的订单')
    .option('-s, --status <status>', '按状态筛选')
    .option('-l, --limit <n>', '显示数量', '20')
    .action(async (opts) => {
      const spinner = ora('获取订单列表...').start();
      try {
        const query = { limit: opts.limit };
        if (opts.status) query.status = opts.status;
        const data = await api.get('/orders', { query });
        spinner.stop();
        const orders = data.orders || data;
        if (!orders.length) {
          heading('📋 暂无订单');
          return;
        }
        heading('📋 我的订单');
        table(
          ['订单号', '模块', '状态', '金额', '创建时间'],
          orders.map(o => [
            o.id,
            o.moduleName || o.module_id || '-',
            statusEmoji(o.status),
            o.totalPrice ? `¥${o.totalPrice}` : '-',
            o.createdAt ? new Date(o.createdAt).toLocaleDateString('zh-CN') : '-',
          ])
        );
      } catch (err) {
        spinner.fail('获取失败');
        handleError(err);
      }
    });

  cmd
    .command('create')
    .description('创建订单（交互式）')
    .action(async () => {
      try {
        const modulesSpinner = ora('获取可用模块...').start();
        const mData = await api.get('/modules');
        modulesSpinner.stop();
        const modules = mData.modules || mData;

        if (!modules.length) {
          heading('暂无可用模块');
          return;
        }

        const answers = await inquirer.prompt([
          {
            type: 'list',
            name: 'moduleId',
            message: '选择要订购的模块:',
            choices: modules.map(m => ({ name: `${m.name} (¥${m.price || '?'})`, value: m.id })),
          },
          {
            type: 'number',
            name: 'quantity',
            message: '数量:',
            default: 1,
            validate: v => v > 0 || '数量必须大于0',
          },
          {
            type: 'input',
            name: 'address',
            message: '收货地址:',
            validate: v => v.trim() ? true : '请输入收货地址',
          },
          {
            type: 'input',
            name: 'note',
            message: '备注（可选）:',
          },
          {
            type: 'confirm',
            name: 'confirm',
            message: '确认提交订单?',
          },
        ]);

        if (!answers.confirm) {
          console.log('已取消');
          return;
        }

        const spinner = ora('创建订单...').start();
        const order = await api.post('/orders', {
          body: {
            module_id: answers.moduleId,
            quantity: answers.quantity,
            address: answers.address,
            note: answers.note,
          },
        });
        spinner.succeed('订单创建成功');
        success(`订单号: ${order.id}`);
      } catch (err) {
        handleError(err);
      }
    });
}
