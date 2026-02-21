import fs from 'fs';
import path from 'path';
import ora from 'ora';
import { api } from '../lib/api.js';
import { success, handleError, error } from '../lib/output.js';

export function registerPrintCommand(program) {
  program
    .command('print <stl-file>')
    .description('发送打印任务')
    .option('-p, --printer <id>', '指定打印机ID')
    .option('-m, --material <type>', '材料类型 (PLA/ABS/PETG)', 'PLA')
    .option('-q, --quality <level>', '打印质量 (draft/normal/fine)', 'normal')
    .action(async (stlFile, opts) => {
      const filePath = path.resolve(stlFile);
      if (!fs.existsSync(filePath)) {
        error(`文件不存在: ${filePath}`);
        process.exit(1);
      }
      if (!filePath.toLowerCase().endsWith('.stl') && !filePath.toLowerCase().endsWith('.3mf')) {
        error('仅支持 .stl 和 .3mf 文件');
        process.exit(1);
      }

      const spinner = ora('上传文件并创建打印任务...').start();
      try {
        const data = await api.post('/print', {
          formData: {
            filePath,
            fields: {
              printer_id: opts.printer || '',
              material: opts.material,
              quality: opts.quality,
            },
          },
        });
        spinner.succeed('打印任务已创建');
        success(`任务ID: ${data.jobId || data.id}`);
      } catch (err) {
        spinner.fail('创建打印任务失败');
        handleError(err);
      }
    });
}
