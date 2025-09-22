# 电视投屏接收器 APK 构建指南

## 概述

这个项目已经配置为可以打包成Android APK，专门为Android TV设计的投屏接收器应用。

## 前置要求

### 1. 安装Node.js
- 下载并安装 Node.js (版本 16 或更高)
- 验证安装: `node --version` 和 `npm --version`

### 2. 安装Android开发环境
- 安装 Android Studio
- 安装 Android SDK (API Level 21 或更高)
- 配置环境变量:
  - `ANDROID_HOME` 指向 Android SDK 路径
  - 将 `%ANDROID_HOME%\platform-tools` 添加到 PATH

### 3. 安装Java开发环境
- 安装 JDK 11 或更高版本
- 配置 `JAVA_HOME` 环境变量

## 构建步骤

### 1. 安装项目依赖
```bash
npm install
```

### 2. 初始化Android平台
```bash
npm run android:add
```

### 3. 同步项目文件
```bash
npm run android:sync
```

### 4. 构建APK
```bash
npm run build:apk
```

或者分步执行:
```bash
# 构建Web资源
npm run build

# 同步到Android项目
npm run android:sync

# 构建Android APK
npm run android:build
```

### 5. 打开Android Studio (可选)
```bash
npm run android:open
```

## APK文件位置

构建完成后，APK文件位于:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

## 安装到电视

### 方法1: ADB安装
1. 在电视上启用开发者选项和USB调试
2. 连接电视到电脑 (USB或网络ADB)
3. 安装APK:
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### 方法2: U盘安装
1. 将APK文件复制到U盘
2. 在电视上插入U盘
3. 使用文件管理器找到APK文件并安装

### 方法3: 网络安装
1. 将APK上传到网络存储或云盘
2. 在电视浏览器中下载APK
3. 使用文件管理器安装

## 应用特性

### 电视优化
- 横屏显示，适配电视屏幕
- 大字体和按钮，适合遥控器操作
- 支持Android TV Leanback界面
- 自动启动投屏服务

### 投屏功能
- 自动获取设备IP地址
- 支持视频和图片投屏
- 全屏播放控制
- 网络状态监控

### 兼容性
- Android 5.0 (API 21) 及以上
- 支持Android TV和普通Android设备
- 自适应不同屏幕尺寸

## 故障排除

### 构建失败
1. 检查Node.js和npm版本
2. 清理缓存: `npm cache clean --force`
3. 删除node_modules重新安装: `rm -rf node_modules && npm install`

### Android构建失败
1. 检查Android SDK和Java环境变量
2. 更新Android SDK工具
3. 清理Android项目: `cd android && ./gradlew clean`

### 安装失败
1. 检查电视是否允许安装未知来源应用
2. 确保APK文件完整未损坏
3. 检查电视Android版本兼容性

## 发布版本

要构建发布版APK:

1. 生成签名密钥:
```bash
keytool -genkey -v -keystore tv-receiver.keystore -alias tv-receiver -keyalg RSA -keysize 2048 -validity 10000
```

2. 配置签名信息在 `android/app/build.gradle`

3. 构建发布版:
```bash
cd android
./gradlew assembleRelease
```

## 技术支持

如果遇到问题，请检查:
1. 系统环境配置
2. 网络连接状态
3. 设备兼容性
4. 日志输出信息

---

**注意**: 这是专为电视设计的投屏接收器，安装后可以接收来自手机等设备的投屏内容。