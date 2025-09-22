# Android TV投屏接收器 - 构建指南

## 项目概述

这是一个专为Android TV设计的DLNA投屏接收器应用，支持从手机等设备投屏视频、音频和图片到电视。

## 🚀 GitHub Actions自动构建

### 构建流程

项目已配置完整的CI/CD流程，推送代码到GitHub后会自动构建APK：

1. **触发条件**：
   - 推送到 `main` 或 `master` 分支
   - 创建Pull Request
   - 手动触发 (workflow_dispatch)

2. **构建步骤**：
   - 设置Node.js 20环境
   - 设置Java 17环境
   - 配置Android SDK
   - 安装依赖并构建Web资源
   - 同步Capacitor
   - 构建Debug和Release版本APK

3. **输出产物**：
   - Debug APK: `android-tv-debug-apk`
   - Release APK: `android-tv-release-apk`
   - 自动创建GitHub Release

### 使用方法

1. **上传代码到GitHub**：
   ```bash
   git add .
   git commit -m "Update TV receiver app"
   git push origin main
   ```

2. **查看构建状态**：
   - 访问GitHub仓库的Actions页面
   - 查看构建进度和日志

3. **下载APK**：
   - 从Actions页面下载Artifacts
   - 或从Releases页面下载正式版本

## 🔧 已解决的技术问题

### Kotlin版本冲突

项目已解决Kotlin标准库版本冲突问题：

- **问题**：不同模块使用了不同版本的kotlin-stdlib (1.6.21 vs 1.8.22)
- **解决方案**：
  - 在根项目`build.gradle`中添加全局依赖解析策略
  - 强制所有模块使用kotlin-stdlib 1.8.22
  - 在app模块中排除冲突的依赖

### Java版本兼容性

- **配置**：统一使用Java 17
- **范围**：所有子项目强制使用相同Java版本

### Android Gradle Plugin兼容性

- **版本**：使用7.4.2版本确保与Capacitor兼容
- **SDK版本**：compileSdk和targetSdk设置为34

## 📱 安装和使用

### 在Android TV上安装

1. **启用未知来源**：
   - 进入设置 > 设备偏好设置 > 安全和限制
   - 启用"未知来源"安装

2. **安装APK**：
   - 通过U盘传输APK到TV
   - 或使用文件管理器从网络下载
   - 点击APK文件进行安装

3. **启动应用**：
   - 在应用列表中找到"DLNA Cast TV Receiver"
   - 启动应用并等待初始化完成

### 投屏使用

1. **网络连接**：确保TV和手机在同一WiFi网络

2. **手机端操作**：
   - 使用支持DLNA的播放器（如VLC、MX Player等）
   - 选择要投屏的媒体文件
   - 点击投屏/Cast按钮
   - 选择"DLNA Cast TV Receiver"设备

3. **TV端显示**：
   - 应用会自动接收并播放投屏内容
   - 支持视频、音频、图片格式
   - 可使用遥控器控制播放

## 🛠️ 本地开发（可选）

如果需要本地开发和调试：

### 环境要求

- Node.js 20+
- Java 17
- Android SDK (API 34)
- Android Studio (推荐)

### 构建步骤

```bash
# 安装依赖
npm install

# 构建Web资源
npm run build

# 同步到Android
npx cap sync android

# 在Android Studio中打开项目
npx cap open android
```

### 注意事项

- 本地构建需要配置Android SDK路径
- 推荐使用GitHub Actions进行生产构建
- 本地主要用于开发和调试

## 📋 功能特性

- ✅ DLNA/UPnP协议支持
- ✅ 多媒体格式支持（视频、音频、图片）
- ✅ Android TV优化界面
- ✅ 自动设备发现
- ✅ 遥控器友好操作
- ✅ 启动画面和加载提示
- ✅ 网络状态监控
- ✅ 错误处理和恢复

## 🔍 故障排除

### 构建失败

1. **检查GitHub Actions日志**
2. **确认所有依赖版本兼容**
3. **查看具体错误信息**

### 投屏连接问题

1. **确认网络连接**：TV和手机在同一WiFi
2. **重启应用**：关闭并重新打开TV应用
3. **检查防火墙**：确保网络端口未被阻止
4. **更新播放器**：使用最新版本的DLNA播放器

### 播放问题

1. **格式支持**：确认媒体格式被支持
2. **网络带宽**：检查WiFi信号强度
3. **重新投屏**：断开并重新连接

## 📞 技术支持

如遇到问题，请：

1. 查看GitHub Issues
2. 提供详细的错误日志
3. 说明使用环境和复现步骤

---

**项目状态**：✅ 生产就绪  
**最后更新**：2024年1月  
**构建方式**：GitHub Actions自动化构建