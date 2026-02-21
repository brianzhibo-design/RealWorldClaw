import { getConfig, setConfig, resetConfig, CONFIG_PATH } from '../lib/config.js';
import { heading, label, success, info } from '../lib/output.js';

export function registerConfigCommand(program) {
  const cmd = program
    .command('config')
    .description('管理CLI配置');

  cmd
    .command('show')
    .description('显示当前配置')
    .action(() => {
      const config = getConfig();
      heading('⚙️  配置');
      label('配置文件', CONFIG_PATH);
      for (const [key, value] of Object.entries(config)) {
        label(key, String(value));
      }
      console.log();
    });

  cmd
    .command('set <key> <value>')
    .description('设置配置项 (例: rwc config set apiUrl http://...)')
    .action((key, value) => {
      setConfig(key, value);
      success(`已设置 ${key} = ${value}`);
    });

  cmd
    .command('reset')
    .description('重置为默认配置')
    .action(() => {
      resetConfig();
      success('配置已重置');
    });

  // Default action when no subcommand
  cmd.action(() => {
    cmd.commands.find(c => c.name() === 'show')._actionHandler([]);
  });
}
