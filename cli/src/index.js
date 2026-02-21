import { Command } from 'commander';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { registerStatusCommand } from './commands/status.js';
import { registerModulesCommand } from './commands/modules.js';
import { registerPrinterCommand } from './commands/printer.js';
import { registerPrintCommand } from './commands/print.js';
import { registerOrdersCommand } from './commands/orders.js';
import { registerMakerCommand } from './commands/maker.js';
import { registerAuthCommand } from './commands/auth.js';
import { registerConfigCommand } from './commands/config.js';

export function createProgram() {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));

  const program = new Command();

  program
    .name('rwc')
    .description('🏭 RealWorldClaw CLI - 3D打印共享制造平台')
    .version(pkg.version, '-v, --version', '显示版本号');

  registerStatusCommand(program);
  registerModulesCommand(program);
  registerPrinterCommand(program);
  registerPrintCommand(program);
  registerOrdersCommand(program);
  registerMakerCommand(program);
  registerAuthCommand(program);
  registerConfigCommand(program);

  return program;
}
