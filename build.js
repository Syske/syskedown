var electronInstaller = require('electron-winstaller');
var path = require("path");

resultPromise = electronInstaller.createWindowsInstaller({
    appDirectory: path.join('./out/syskedown-editer-win32-x64'), //入口
    outputDirectory: path.join('./installer/installer64'),     //出口
    authors: 'syske',
    exe: 'syskedown-editer.exe',        //名称
    setupIcon: path.join('./icon.ico'),//安装图标，必须本地
    iconUrl: 'https://blog-static.cnblogs.com/files/caoleiCoding/icon.ico',//程序图标，必须url
    noMsi: true,
    setupExe:'syskedown-editer-installer.exe',
    title:'syskedown-editer',
    description: "syskedown-editer"
  });

  
resultPromise.then(() => console.log("It worked!"), (e) => console.log(`No dice: ${e.message}`));