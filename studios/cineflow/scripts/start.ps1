#Requires -Version 7.4
param([string]$ElectronPath, [string]$DataDirectory, [int]$Port = 33105, [switch]$Stop)
$ErrorActionPreference = 'Stop'
$packageRoot = Split-Path $PSScriptRoot -Parent
$libraryRoot = Split-Path (Split-Path $packageRoot -Parent) -Parent
$appDirectory = Join-Path $packageRoot 'app'
if (-not $DataDirectory) {
  $DataDirectory = $env:DSH_STUDIO_CINEFLOW_DATA
  if (-not $DataDirectory) {
    $studioHome = if ($env:DSH_HOME) { $env:DSH_HOME } else { Join-Path $HOME '.dsh' }
    $DataDirectory = Join-Path $studioHome 'studio/cineflow'
  }
}
if (-not [IO.Path]::IsPathFullyQualified($DataDirectory)) { throw '影音数据目录必须是绝对路径。' }
if (-not $ElectronPath) {
  $ElectronPath = $env:DSH_STUDIO_ELECTRON
  if (-not $ElectronPath) { $ElectronPath = Join-Path (Split-Path $libraryRoot -Parent) 'deepseek-harness/apps/desktop/node_modules/electron/dist/electron.exe' }
}
$ElectronPath = [IO.Path]::GetFullPath($ElectronPath)
if (-not (Test-Path -LiteralPath $ElectronPath)) { throw '请通过 -ElectronPath 指定已安装的 Electron 程序。' }
New-Item -ItemType Directory -Force $DataDirectory | Out-Null
$lock = [IO.File]::Open((Join-Path $DataDirectory 'service.lock'), 'OpenOrCreate', 'ReadWrite', 'None')
try {
  $descriptorPath = Join-Path $DataDirectory 'bridge.json'
  $managed = $null
  if (Test-Path -LiteralPath $descriptorPath) {
    $descriptor = Get-Content -LiteralPath $descriptorPath -Raw | ConvertFrom-Json
    $candidate = Get-CimInstance Win32_Process -Filter ('ProcessId = ' + [int]$descriptor.pid)
    if ($candidate -and $candidate.ExecutablePath -eq $ElectronPath -and $candidate.CommandLine.Contains($appDirectory)) { $managed = $candidate }
  }
  if ($Stop) {
    if ($managed) { Stop-Process -Id $managed.ProcessId; Write-Output '影音工作室已停止' }
    return
  }
  if ($managed) {
    $health = Invoke-RestMethod -Uri ($descriptor.origin + '/health') -TimeoutSec 3
    if ($health.studio) { Write-Output '影音工作室已运行'; return }
    throw '影音工作室进程尚未就绪，请稍后重试。'
  }
  if (Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue) { throw ('端口 ' + $Port + ' 已被占用。') }
  if (-not (Test-Path -LiteralPath (Join-Path $appDirectory 'dist/index.html'))) { throw '请先构建影音工作室。' }
  $env:DSH_STUDIO_CINEFLOW_DATA = $DataDirectory
  $env:DSH_STUDIO_CINEFLOW_PORT = [string]$Port
  Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
  $arguments = '"' + $appDirectory + '"'
  $child = Start-Process -FilePath $ElectronPath -ArgumentList $arguments -WorkingDirectory $appDirectory -WindowStyle Hidden -RedirectStandardOutput (Join-Path $DataDirectory 'service.log') -RedirectStandardError (Join-Path $DataDirectory 'service.error.log') -PassThru
  [IO.File]::WriteAllText((Join-Path $DataDirectory 'process.json'), (@{pid=$child.Id;started=$child.StartTime.ToUniversalTime().Ticks;path=$ElectronPath} | ConvertTo-Json -Compress))
  $deadline = [DateTime]::UtcNow.AddSeconds(25)
  do {
    if ($child.HasExited) { throw '影音工作室启动失败，请检查服务日志。' }
    if (Test-Path -LiteralPath $descriptorPath) {
      $descriptor = Get-Content -LiteralPath $descriptorPath -Raw | ConvertFrom-Json
      if ($descriptor.pid -eq $child.Id) { Write-Output ('影音工作室已启动，端口 ' + $Port); return }
    }
    Start-Sleep -Milliseconds 250
  } while ([DateTime]::UtcNow -lt $deadline)
  throw '影音工作室启动超时，请检查端口和数据目录。'
} finally { $lock.Dispose() }
