#Requires -Version 7.4
param([string]$ElectronPath, [string]$DataDirectory, [int]$Port = 33105, [switch]$Stop)
$ErrorActionPreference = 'Stop'
& (Join-Path $PSScriptRoot '../studios/cineflow/scripts/start.ps1') @PSBoundParameters
