@echo off
set "PATH=%PATH%;C:\Program Files\nodejs"
node --watch "%~dp0src\index.js"
