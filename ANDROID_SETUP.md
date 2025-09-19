# Android 开发环境配置指南

## 前提条件

要构建Android版本的TV投屏接收器，您需要安装以下工具：

### 1. Java Development Kit (JDK)
- **要求版本**: JDK 11 或更高版本
- **推荐**: Oracle JDK 11 或 OpenJDK 11
- **下载地址**: https://adoptium.net/

### 2. Android Studio 和 Android SDK
- **下载地址**: https://developer.android.com/studio
- **最低要求**: Android Studio Arctic Fox 或更新版本
- **SDK要求**: Android SDK 34 (API Level 34)

## 配置步骤

### 步骤 1: 安装 Android Studio
1. 从官网下载并安装 Android Studio
2. 启动 Android Studio 并完成初始设置
3. 确保安装了 Android SDK 34

### 步骤 2: 配置环境变量

#### Windows:
```bash
# 设置 ANDROID_HOME 环境变量
set ANDROID_HOME=C:\Users\%USERNAME%\AppData\Local\Android\Sdk
set PATH=%PATH%;%ANDROID_HOME%\tools;%ANDROID_HOME%\platform-tools
```

#### macOS/Linux:
```bash
# 添加到 ~/.bashrc 或 ~/.zshrc
export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
# export ANDROID_HOME=$HOME/Android/Sdk        # Linux
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

### 步骤 3: 配置项目
1. 复制 `android/local.properties.example` 到 `android/local.properties`
2. 编辑 `local.properties` 文件，设置正确的 SDK 路径：
   ```
   sdk.dir=C:\\Users\\YourUsername\\AppData\\Local\\Android\\Sdk
   ```

### 步骤 4: 构建项目
```bash
cd android
./gradlew clean build
```

## 常见问题

### Q: "SDK location not found" 错误
**解决方案**: 确保 `local.properties` 文件中的 `sdk.dir` 路径正确指向您的 Android SDK 安装目录。

### Q: Java 版本不兼容
**解决方案**: 确保使用 JDK 11。可以通过以下命令检查：
```bash
java -version
javac -version
```

### Q: Gradle 构建失败
**解决方案**: 
1. 清理项目：`./gradlew clean`
2. 重新构建：`./gradlew build`
3. 如果仍然失败，删除 `.gradle` 文件夹后重试

## 支持的 Android 版本

- **最低支持**: Android 6.0 (API Level 23)
- **目标版本**: Android 14 (API Level 34)
- **推荐测试**: Android 8.0+ 的设备或模拟器

## 开发建议

1. **使用真实设备测试**: TV投屏功能在真实设备上测试效果更好
2. **网络权限**: 确保设备连接到与发送端相同的WiFi网络
3. **防火墙设置**: 可能需要配置防火墙允许应用的网络访问

## 技术支持

如果遇到配置问题，请检查：
1. Android Studio 版本是否为最新
2. SDK 工具是否完整安装
3. 环境变量是否正确设置
4. 项目依赖是否完整下载