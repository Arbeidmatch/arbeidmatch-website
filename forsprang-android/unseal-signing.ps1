# Prints the sealed Forsprang signing env lines (KEY=VALUE) to stdout.
# The file is protected with DPAPI LocalMachine scope. Contains no secrets itself.
param([string]$Path = "$env:USERPROFILE\.forsprang-signing\signing.env.dpapi")
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Security
$raw = (Get-Content -Raw -LiteralPath $Path).Trim()
$prefix = 'dpapi-machine:'
if (-not $raw.StartsWith($prefix)) { throw "Unexpected format in $Path" }
$bytes = [Convert]::FromBase64String($raw.Substring($prefix.Length))
$plain = [Security.Cryptography.ProtectedData]::Unprotect($bytes, $null, [Security.Cryptography.DataProtectionScope]::LocalMachine)
[Text.Encoding]::UTF8.GetString($plain)
