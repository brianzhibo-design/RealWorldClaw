# 快速开始

3步让你的第一个RealWorldClaw设备运行起来。

## 第1步：克隆 & 安装

```bash
git clone https://github.com/brianzhibo-design/RealWorldClaw.git
cd RealWorldClaw
npm install -g @realworldclaw/cli
rwc --version
```

## 第2步：烧录Core模块

```bash
cd firmware/core
pio run --target upload
rwc status
```

## 第3步：打印 & 组装

### 自己打印

```bash
rwc print download desktop-ai-assistant
```

用PLA，0.2mm层高，20%填充。打印完成后磁吸组装即可！

### 通过Maker网络下单

```bash
rwc orders create --design desktop-ai-assistant --location "你的城市"
```

## 下一步

- **[安装配置 →](/zh/getting-started/installation)**
- **[第一个模块 →](/zh/getting-started/your-first-module)**
- **[模块概览 →](/zh/modules/overview)**
