# Java 版本检测和项目配置脚本
# 此脚本会检测系统中的 Java 版本并自动配置项目

Write-Host "检测 Java 安装..." -ForegroundColor Yellow

# 检查 JAVA_HOME 环境变量
$javaHome = $env:JAVA_HOME
if ($javaHome -and (Test-Path $javaHome)) {
    Write-Host "发现 JAVA_HOME: $javaHome" -ForegroundColor Green
    
    # 检测 Java 版本
    $javaExe = Join-Path $javaHome "bin\java.exe"
    if (Test-Path $javaExe) {
        $versionOutput = & $javaExe -version 2>&1
        $versionLine = $versionOutput | Select-String "version"
        
        if ($versionLine -match '"(\d+)\.(\d+)') {
            $majorVersion = [int]$matches[1]
            $minorVersion = [int]$matches[2]
            
            # Java 9+ 使用新的版本号格式
            if ($majorVersion -eq 1) {
                $javaVersion = $minorVersion
            } else {
                $javaVersion = $majorVersion
            }
            
            Write-Host "检测到 Java 版本: $javaVersion" -ForegroundColor Green
            
            # 根据 Java 版本配置项目
            if ($javaVersion -ge 17) {
                Write-Host "配置项目使用 Java 17..." -ForegroundColor Cyan
                
                # 更新 package.json 使用最新 Capacitor
                $packageJson = Get-Content "package.json" | ConvertFrom-Json
                $packageJson.dependencies.'@capacitor/core' = "latest"
                $packageJson.dependencies.'@capacitor/camera' = "latest"
                $packageJson.dependencies.'@capacitor/splash-screen' = "latest"
                $packageJson.devDependencies.'@capacitor/cli' = "latest"
                $packageJson.devDependencies.'@capacitor/android' = "latest"
                $packageJson | ConvertTo-Json -Depth 10 | Set-Content "package.json"
                
                Write-Host "✓ 已配置为使用最新 Capacitor 版本" -ForegroundColor Green
                
            } elseif ($javaVersion -ge 11) {
                Write-Host "配置项目使用 Java 11 兼容版本..." -ForegroundColor Cyan
                
                # 配置为 Capacitor 5.x
                $packageJson = Get-Content "package.json" | ConvertFrom-Json
                $packageJson.dependencies.'@capacitor/core' = "^5.7.8"
                $packageJson.dependencies.'@capacitor/camera' = "^5.0.9"
                $packageJson.dependencies.'@capacitor/splash-screen' = "^5.0.7"
                $packageJson.devDependencies.'@capacitor/cli' = "^5.7.8"
                $packageJson.devDependencies.'@capacitor/android' = "^5.7.8"
                $packageJson | ConvertTo-Json -Depth 10 | Set-Content "package.json"
                
                Write-Host "✓ 已配置为使用 Capacitor 5.x 版本" -ForegroundColor Green
                
            } elseif ($javaVersion -eq 8) {
                Write-Host "配置项目使用 Java 8 兼容版本..." -ForegroundColor Cyan
                
                # 配置为 Capacitor 4.x
                $packageJson = Get-Content "package.json" | ConvertFrom-Json
                $packageJson.dependencies.'@capacitor/core' = "^4.8.1"
                $packageJson.dependencies.'@capacitor/camera' = "^4.1.5"
                $packageJson.dependencies.'@capacitor/splash-screen' = "^4.2.0"
                $packageJson.devDependencies.'@capacitor/cli' = "^4.8.1"
                $packageJson.devDependencies.'@capacitor/android' = "^4.8.1"
                $packageJson | ConvertTo-Json -Depth 10 | Set-Content "package.json"
                
                Write-Host "✓ 已配置为使用 Capacitor 4.x 版本" -ForegroundColor Green
                
            } else {
                Write-Host "警告: Java 版本 $javaVersion 可能不兼容，建议升级到 Java 17" -ForegroundColor Red
            }
            
            Write-Host "`n下一步:" -ForegroundColor Yellow
            Write-Host "1. 运行 'npm install' 安装依赖"
            Write-Host "2. 运行 'npx cap sync android' 同步项目"
            Write-Host "3. 确保已安装 Android SDK"
            
        } else {
            Write-Host "无法检测 Java 版本" -ForegroundColor Red
        }
    } else {
        Write-Host "JAVA_HOME 路径中未找到 java.exe" -ForegroundColor Red
    }
} else {
    Write-Host "未找到有效的 JAVA_HOME 环境变量" -ForegroundColor Red
    Write-Host "`n请按照以下步骤安装 Java:" -ForegroundColor Yellow
    Write-Host "1. 访问 https://adoptium.net/temurin/releases/?version=17"
    Write-Host "2. 下载并安装 JDK 17"
    Write-Host "3. 配置 JAVA_HOME 环境变量"
    Write-Host "4. 重新运行此脚本"
}

Write-Host "`n按任意键继续..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')