import chalk from 'chalk';
import Table from 'cli-table3';

export function success(msg) {
  console.log(chalk.green('✔'), msg);
}

export function error(msg) {
  console.error(chalk.red('✖'), msg);
}

export function warn(msg) {
  console.log(chalk.yellow('⚠'), msg);
}

export function info(msg) {
  console.log(chalk.blue('ℹ'), msg);
}

export function heading(msg) {
  console.log(chalk.bold.cyan(`\n${msg}`));
}

export function label(key, value) {
  console.log(`  ${chalk.gray(key + ':')} ${value}`);
}

export function table(head, rows) {
  const t = new Table({
    head: head.map(h => chalk.cyan.bold(h)),
    style: { head: [], border: ['gray'] },
  });
  rows.forEach(r => t.push(r));
  console.log(t.toString());
}

export function handleError(err) {
  if (err.name === 'ApiError') {
    if (err.status === 401) {
      error('未登录或登录已过期，请运行 rwc auth login');
    } else {
      error(`API错误 (${err.status}): ${err.message}`);
    }
  } else {
    error(err.message || '未知错误');
  }
  process.exit(1);
}
