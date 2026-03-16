# Bambu Studio 切片软件实战指南

专为 P2S + AMS 用户编写的简明操作手册

## 1. 完整打印流程（STL → 成品）

### 基础操作流程
1. **导入模型**：拖拽STL文件到Bambu Studio，或File > Add
2. **选择打印机**：Device页面选择P2S，确保已连接
3. **设置材料**：左侧Filament栏添加/选择要用的丝材
4. **调整模型**：缩放、旋转、移动到合适位置
5. **切片**：点击Slice Plate按钮，等待切片完成
6. **预览**：Preview页面检查路径、支撑、填充等
7. **发送打印**：Print Plate > Send to Printer
8. **监控**：通过Live View或Bambu Handy监控打印过程

### 关键检查点
- 支撑是否合理（过多浪费，过少失败）
- 首层粘附区域是否足够
- 预估时间和材料用量是否合理
- 多色换色点是否在理想位置

## 2. 切片参数速查表

### 原型件（快速验证）
```
层高: 0.28mm          速度: 80-100mm/s
填充: 10-15%          壁厚: 2层（0.8mm）
支撑: 45°触发         底面: 3层
顶面: 3层             温度: PLA 210/60°C
```

### 功能件（实用强度）
```
层高: 0.2mm           速度: 60-80mm/s  
填充: 20-40%          壁厚: 3-4层（1.2-1.6mm）
支撑: 50°触发         底面: 4层
顶面: 4层             温度: 按材料标准
```

### 外观件（精细表面）
```
层高: 0.12-0.16mm     速度: 40-60mm/s
填充: 15-25%          壁厚: 3层（1.2mm）
支撑: 60°触发         底面: 5层
顶面: 5层             Ironing: 启用
```

### P2S专用优化
- 使用Adaptive Layer Height自动优化层高
- 开启Arc Fitting提升曲线质量
- 启用Pressure Advance校准（PA值0.02-0.06）

## 3. 合盘打印技巧

### 自动排布
- **全局排布**：Arrange All Objects (快捷键A)
- **单盘排布**：选中plate，点击arrange图标 (Shift+A)
- **间距设置**：一般设置3-5mm，支撑件设置8-10mm

### 手动优化技巧
- **相似高度归类**：同高度零件放一起，减少Z轴移动
- **按打印时间排序**：长件先打，短件后打，方便取件
- **支撑策略**：无支撑件紧密排列，有支撑件留足间距
- **避让区域**：右下角校准区避免放置小件

### Multi-Plate管理
- 新建plate：右键plate标签 > Add Plate
- 跨plate移动：拖拽对象到目标plate标签
- 锁定plate：点击plate旁锁定图标，避免auto arrange影响

## 4. P2S速度模式选择

### Standard模式（默认推荐）
- **适用场景**：日常打印、首次尝试新材料
- **特点**：平衡速度与质量，最稳定的选择
- **层高**：0.2mm最佳，0.12-0.28mm可选

### Sport模式（追求速度）
- **适用场景**：原型验证、大批量生产、PLA/PETG
- **特点**：速度提升30-50%，质量略有下降
- **注意**：避免复杂支撑和悬垂结构

### Ludicrous模式（极限速度）
- **适用场景**：简单几何体、填充密度低的大件
- **特点**：最高速度，仅适合特定场景
- **限制**：复杂模型可能失败，建议先小批量测试

### 选择建议
- **新用户**：永远先用Standard
- **已验证模型**：可尝试Sport
- **简单大件**：可试试Ludicrous

## 5. AMS多色打印设置

### 基础配置
1. **连接AMS**：Device > Sync Info同步AMS信息
2. **加载材料**：按颜色顺序装入filament到AMS槽位
3. **同步filament列表**：Filament > Sync from AMS

### 颜色分配
- **方法1**：Object List中直接选择filament编号
- **方法2**：右键模型 > Change Filament
- **方法3**：快捷键1-9快速分配颜色
- **方法4**：Paint Tool精细涂色

### 换色优化
- **Flushing Volume**：深色到浅色增加冲洗量
- **Wipe Tower**：自动生成，位置可手动调整
- **支撑材料**：使用水溶性支撑提升复杂结构质量

### 实用技巧
- 相同材质不同颜色：Auto mapping会自动匹配
- 混用不同材质：关闭"Allow multiple materials"避免冲突
- 节约材料：合理设计换色点，减少wipe tower体积

## 6. LAN模式设置步骤

### 打印机端设置
1. **进入设置**：Settings → WLAN → LAN Only Mode
2. **开启LAN模式**：将"OFF"切换为"ON" 
3. **记录Access Code**：屏幕显示的8位访问码
4. **可选**：开启Developer Mode（第三方软件控制）

### Bambu Studio连接
1. **发现设备**：Device页面等待20-60秒自动发现
2. **识别LAN设备**：带锁图标的为LAN only模式
3. **输入密码**：点击设备，输入Access Code
4. **确认连接**：显示绿色WiFi信号即成功

### LAN模式限制
- **无法远程访问**：只能同局域网操作
- **Bambu Handy不可用**：手机App无法连接
- **无云端历史**：打印记录不同步云端
- **需要SD卡**：X1系列LAN打印必须插入microSD卡

## 7. CLI自动化切片

### 基本命令结构
```bash
./bambu-studio [选项] [输入文件]
```

### 常用参数
```bash
--load-settings "machine.json;process.json"    # 加载设备和工艺配置
--load-filaments "filament.json"               # 加载材料配置  
--slice 0                                      # 切片(0=所有plate)
--export-3mf output.3mf                        # 导出3MF文件
--orient                                       # 自动调整方向
--arrange 1                                    # 自动排布
--debug 2                                      # 调试级别
```

### 实用示例
```bash
# 基础STL切片
./bambu-studio --orient --arrange 1 \
  --load-settings "p2s-machine.json;standard-process.json" \
  --load-filaments "pla-filament.json" \
  --slice 0 --export-3mf output.3mf model.stl

# 批处理3MF文件  
./bambu-studio --slice 0 --debug 1 \
  --export-3mf batch-output.3mf input/*.3mf
```

### 配置文件获取
- Machine配置：从Bambu Studio导出或官方GitHub获取
- Process配置：基于预设profile修改
- Filament配置：从实际使用的材料导出

---

*本指南专注实战应用，详细参数说明请参考 [Bambu Lab官方Wiki](https://wiki.bambulab.com/)*