# RealWorldClaw CLI (`rwc`)

3D打印共享制造平台的命令行工具。

## 安装

```bash
cd cli
npm install
npm link   # 全局安装 rwc 命令
```

## 使用

```bash
rwc status                     # 系统状态
rwc modules list               # 列出模块
rwc modules info <id>          # 模块详情
rwc printer list               # 打印机列表
rwc printer status <id>        # 打印机状态
rwc print <file.stl>           # 发送打印任务
rwc orders list                # 我的订单
rwc orders create              # 创建订单（交互式）
rwc maker register             # 注册成为Maker
rwc maker status               # Maker状态和收入
rwc auth login                 # 登录
rwc auth register              # 注册
rwc auth logout                # 退出登录
rwc auth whoami                # 当前登录状态
rwc config show                # 查看配置
rwc config set <key> <value>   # 修改配置
rwc version                    # 版本号
```

## 配置

配置文件: `~/.rwc/config.json`

```bash
rwc config set apiUrl http://your-server:8000/api/v1
```

## 开发

```bash
node bin/rwc.js status    # 不全局安装直接运行
```
