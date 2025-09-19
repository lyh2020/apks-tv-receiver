# DLNA Cast TV Receiver - 智能投屏接收器

一个现代化的DLNA/UPnP投屏接收器，支持Web端和Android TV双平台，提供流畅的跨设备投屏体验。

## ✨ 最新特性 (v2.0)

- 🎯 **多协议支持** - DLNA、UPnP、mDNS设备发现
- 🚀 **快速启动** - 优化启动流程，添加加载界面
- 🎨 **现代化UI** - 参考乐播投屏的界面设计
- 📱 **跨平台兼容** - 支持手机、电脑、平板等设备
- 🔍 **智能发现** - 增强的网络设备发现和兼容性检测
- 📊 **实时状态** - 连接状态指示和设备兼容性显示
- 🎬 **丰富格式** - 支持更多视频、音频编解码器
- 📺 **Android TV优化** - 专为大屏设计的用户界面
- 🎮 **遥控器友好** - 完全支持TV遥控器操作

## 📱 支持的投屏源

- **Android手机** - 使用内置投屏功能或第三方DLNA应用
- **iPhone/iPad** - 使用支持DLNA的播放器应用
- **Windows/Mac** - 使用VLC、Windows Media Player等
- **其他DLNA设备** - 任何支持DLNA协议的设备

## 🛠️ 安装说明

### 方法一：从GitHub下载APK

1. 访问 [Releases页面](../../releases)
2. 下载最新版本的APK文件
3. 在Android TV上启用"未知来源"安装
4. 通过U盘或网络安装APK

### 方法二：自行构建

```bash
# 克隆仓库
git clone <repository-url>
cd tv-receiver

# 安装依赖
npm install

# 构建项目
npm run build

# 同步到Android
npx cap sync android

# 构建APK
cd android
./gradlew assembleDebug
```

## 🚀 使用方法

### 1. 启动应用
- 在Android TV上启动"DLNA Cast TV Receiver"
- 应用会自动启动DLNA服务
- 等待连接状态显示为"在线"

### 2. 连接网络
- 确保TV和手机在同一WiFi网络
- 应用会自动广播设备信息
- 手机端会自动发现TV设备

### 3. 开始投屏

#### Android手机投屏
1. 打开视频播放器（如MX Player、VLC等）
2. 选择"投屏"或"DLNA"功能
3. 选择"DLNA Cast TV Receiver"设备
4. 开始播放内容

#### iPhone投屏
1. 使用支持DLNA的播放器（如VLC、nPlayer等）
2. 在播放器中选择DLNA设备
3. 选择"DLNA Cast TV Receiver"
4. 开始投屏播放

#### 电脑投屏
1. 使用VLC媒体播放器
2. 选择"播放" → "渲染器" → "DLNA Cast TV Receiver"
3. 或使用Windows Media Player的"播放到"功能

## 🎮 遥控器操作

- **方向键** - 导航界面
- **确定键** - 选择/播放/暂停
- **返回键** - 返回上级界面
- **菜单键** - 显示更多选项
- **音量键** - 调节播放音量

## 🔧 技术架构

### 核心组件
- **Capacitor** - 跨平台应用框架
- **DLNA Service** - DLNA/UPnP协议实现
- **Network Discovery** - 网络设备发现服务
- **Media Player** - 多媒体播放引擎

### 支持的协议
- **UPnP/DLNA** - 设备发现和媒体传输
- **SSDP** - 简单服务发现协议
- **HTTP** - 媒体流传输
- **WebSocket** - 实时控制通信

## 📂 项目结构

```
tv-receiver/
├── src/
│   ├── index.html          # 主页面
│   ├── css/
│   │   └── tv-style.css    # TV专用样式
│   └── js/
│       ├── tv-receiver.js      # 主控制器
│       ├── dlna-service.js     # DLNA服务
│       └── network-discovery.js # 网络发现
├── android/                # Android项目
├── .github/workflows/      # GitHub Actions
└── README.md
```

## 🔍 故障排除

### 无法发现设备
1. 检查网络连接 - 确保TV和手机在同一WiFi
2. 重启应用 - 关闭并重新打开应用
3. 检查防火墙 - 确保网络允许DLNA通信
4. 重启路由器 - 刷新网络设备列表

### 投屏卡顿或中断
1. 检查网络信号强度
2. 关闭其他占用网络的应用
3. 降低视频质量或分辨率
4. 使用有线网络连接

### 音频无声音
1. 检查TV音量设置
2. 检查应用内音量控制
3. 确认音频格式支持
4. 重启音频服务

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

1. Fork本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

## 📄 许可证

本项目采用MIT许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- [Capacitor](https://capacitorjs.com/) - 跨平台应用框架
- [Android TV](https://developer.android.com/tv) - Android TV开发平台
- [UPnP Forum](https://openconnectivity.org/) - UPnP/DLNA协议标准

## 📞 支持

如有问题或建议，请：
- 提交 [Issue](../../issues)
- 发送邮件至开发者
- 查看 [Wiki](../../wiki) 获取更多信息

---

**享受大屏观影体验！** 🎬📺
