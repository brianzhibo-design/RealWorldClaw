import ora from 'ora';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { api } from '../lib/api.js';
import { heading, label, success, handleError } from '../lib/output.js';

export function registerMakerCommand(program) {
  const cmd = program
    .command('maker')
    .description('Maker（制造者）管理');

  cmd
    .command('register')
    .description('注册成为Maker')
    .action(async () => {
      try {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: 'Maker名称/工坊名:',
            validate: v => v.trim() ? true : '请输入名称',
          },
          {
            type: 'input',
            name: 'location',
            message: '所在城市:',
            validate: v => v.trim() ? true : '请输入城市',
          },
          {
            type: 'checkbox',
            name: 'printerTypes',
            message: '拥有的打印机类型:',
            choices: ['FDM', 'SLA', 'SLS', 'MJF', '其他'],
          },
          {
            type: 'input',
            name: 'description',
            message: '简介（可选）:',
          },
          {
            type: 'confirm',
            name: 'confirm',
            message: '确认注册为Maker?',
          },
        ]);

        if (!answers.confirm) {
          console.log('已取消');
          return;
        }

        const spinner = ora('注册中...').start();
        await api.post('/makers/register', {
          body: {
            name: answers.name,
            location: answers.location,
            printer_types: answers.printerTypes,
            description: answers.description,
          },
        });
        spinner.succeed('Maker注册成功！');
        success('你现在是RealWorldClaw的制造者了 🎉');
      } catch (err) {
        handleError(err);
      }
    });

  cmd
    .command('status')
    .description('查看Maker状态和收入')
    .action(async () => {
      const spinner = ora('获取Maker状态...').start();
      try {
        const data = await api.get('/makers/me');
        spinner.stop();
        heading('🔧 Maker状态');
        label('名称', data.name);
        label('状态', data.verified ? chalk.green('已认证 ✓') : chalk.yellow('待认证'));
        label('评分', data.rating ? `${data.rating}/5.0 ⭐` : '-');
        label('完成订单', String(data.completedOrders ?? 0));
        label('本月收入', data.monthlyIncome ? `¥${data.monthlyIncome}` : '¥0');
        label('总收入', data.totalIncome ? `¥${data.totalIncome}` : '¥0');
        console.log();
      } catch (err) {
        spinner.fail('获取失败');
        handleError(err);
      }
    });
}
