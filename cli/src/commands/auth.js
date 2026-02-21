import inquirer from 'inquirer';
import ora from 'ora';
import { api } from '../lib/api.js';
import { setAuth, clearAuth, getAuth } from '../lib/config.js';
import { success, error, info, handleError } from '../lib/output.js';

export function registerAuthCommand(program) {
  const cmd = program
    .command('auth')
    .description('账号认证');

  cmd
    .command('login')
    .description('登录')
    .action(async () => {
      try {
        const answers = await inquirer.prompt([
          { type: 'input', name: 'email', message: '邮箱:', validate: v => v.includes('@') || '请输入有效邮箱' },
          { type: 'password', name: 'password', message: '密码:', mask: '*' },
        ]);

        const spinner = ora('登录中...').start();
        const data = await api.post('/auth/login', {
          body: { email: answers.email, password: answers.password },
          auth: false,
        });
        spinner.stop();

        setAuth({ token: data.token || data.access_token, email: answers.email, userId: data.userId });
        success(`登录成功！欢迎回来 👋`);
      } catch (err) {
        handleError(err);
      }
    });

  cmd
    .command('register')
    .description('注册新账号')
    .action(async () => {
      try {
        const answers = await inquirer.prompt([
          { type: 'input', name: 'username', message: '用户名:', validate: v => v.trim().length >= 2 || '至少2个字符' },
          { type: 'input', name: 'email', message: '邮箱:', validate: v => v.includes('@') || '请输入有效邮箱' },
          { type: 'password', name: 'password', message: '密码:', mask: '*', validate: v => v.length >= 6 || '至少6个字符' },
          { type: 'password', name: 'confirmPassword', message: '确认密码:', mask: '*' },
        ]);

        if (answers.password !== answers.confirmPassword) {
          error('两次密码不一致');
          process.exit(1);
        }

        const spinner = ora('注册中...').start();
        const data = await api.post('/auth/register', {
          body: { username: answers.username, email: answers.email, password: answers.password },
          auth: false,
        });
        spinner.stop();

        setAuth({ token: data.token || data.access_token, email: answers.email, userId: data.userId });
        success('注册成功！🎉');
      } catch (err) {
        handleError(err);
      }
    });

  cmd
    .command('logout')
    .description('退出登录')
    .action(() => {
      clearAuth();
      success('已退出登录');
    });

  cmd
    .command('whoami')
    .description('查看当前登录状态')
    .action(() => {
      const auth = getAuth();
      if (auth?.email) {
        info(`当前登录: ${auth.email}`);
      } else {
        info('未登录。使用 rwc auth login 登录');
      }
    });
}
