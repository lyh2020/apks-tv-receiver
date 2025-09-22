# Android 开发环境配置指南

## 前提条件

要构建Android版本的TV投屏接收器，您需要安装以下工具：

### 1. Java Development Kit (JDK)
- **当前状态**: 需要安装 Java
- **推荐版本**: Eclipse Temurin JDK 17 (OpenJDK)
- **兼容版本**: JDK 8 或更高版本
- **下载地址**: https://adoptium.net/temurin/releases/

**安装步骤**:

#### 选项 1: 安装 Java 17 (推荐)
1. 访问 https://adoptium.net/temurin/releases/?version=17
2. 选择 Windows x64 版本的 JDK 17
3. 下载 `.msi` 安装程序
4. 运行安装程序，选择默认安装路径
5. 安装完成后，配置环境变量：
   ```cmd
   # 设置 JAVA_HOME
   setx JAVA_HOME "C:\Program Files\Eclipse Adoptium\jdk-17.0.9.9-hotspot"
   
   # 添加到 PATH
   setx PATH "%PATH%;%JAVA_HOME%\bin"
   ```
6. 重启命令行工具并验证：`java -version`

#### 选项 2: 安装 Java 8 (最低要求)
1. 访问 https://adoptium.net/temurin/releases/?version=8
2. 下载并安装 JDK 8
3. 配置环境变量指向 JDK 8 安装目录

**重要提示**: 安装完成后，可以运行自动配置脚本来检测并配置项目：
```powershell
# 在项目根目录运行
.\setup-java.ps1
```

此脚本会：
- 自动检测系统中的 Java 版本
- 根据 Java 版本配置相应的 Capacitor 版本
- 提供下一步操作指导

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
1. 编辑 `android/local.properties` 文件，设置正确的 SDK 路径：
   ```
   sdk.dir=C:\\Users\\YourUsername\\AppData\\Local\\Android\\Sdk
   ```

2. 编辑 `android/gradle.properties` 文件，配置 Java 17 路径：
   ```
   # 取消注释并设置正确的 Java 17 路径
   org.gradle.java.home=C:\\Program Files\\Java\\jdk-17
   ```
   
   **注意**: 如果系统默认 Java 版本不是 17，必须配置此项。

### 步骤 4: 构建项目
```bash
cd android
./gradlew clean build
```

## 常见问题

### Q: "SDK location not found" 错误
**解决方案**: 确保 `local.properties` 文件中的 `sdk.dir` 路径正确指向您的 Android SDK 安装目录。

### Q: Java 未安装或未正确配置
如果运行 `java -version` 命令时出现 "无法将'java'项识别为 cmdlet" 错误：

1. **确认 Java 17 已安装**:
   - 检查是否存在 JDK 安装目录（通常在 `C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot`）
   - 如果没有安装，请按照上述安装步骤重新安装

2. **配置环境变量**:
   ```cmd
   # 设置 JAVA_HOME（替换为实际安装路径）
   setx JAVA_HOME "C:\Program Files\Eclipse Adoptium\jdk-17.0.9.9-hotspot"
   
   # 添加到 PATH
   setx PATH "%PATH%;%JAVA_HOME%\bin"
   ```

3. **验证配置**:
   - 重启命令行工具
   - 运行 `java -version` 确认显示 Java 17
   - 运行 `echo %JAVA_HOME%` 确认环境变量设置正确

### Q: Java 版本不兼容
**解决方案**: 确保使用 JDK 17 或更高版本。可以通过以下命令检查：
```bash
java -version
javac -version
```

如果版本不正确，请：
1. 下载并安装 JDK 17
2. 设置 JAVA_HOME 环境变量
3. 更新 PATH 环境变量

**重要说明**：当前项目使用 Capacitor 5.x 和 Android Gradle Plugin 7.4.2，这些版本需要 Java 17 以支持最新的 Android API 特性。

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