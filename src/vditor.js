const path = require('path')
const fs = require("fs");
const storage = require('electron-localstorage')
const { ipcRenderer } = require('electron')
window.$ = window.jQuery = require("jquery");
// 用户数据存储
storage.setStoragePath(path.join(__dirname, './dist/db.json'))

// vditor配置方法
const initVditor = (language) => {
  window.vditor = new Vditor('vditor', {
    cdn: './vditor',
    placeholder: 'syskedown!',
    typewriterMode: true,
    mode: "ir",
    toolbar: [],
    toolbarConfig: {
      hide: true
    },
    counter: {
      enable: true,
      type: 'text',
    }
  });
};

// vditor初始化
$(function () {
  initVditor('zh_CN')
  window.setLang = (language) => {
    window.vditor.destroy()
    initVditor(language);
    vditor.setValue(initContent);
  }
});

// 保存文件监听
ipcRenderer.on('save-file', (event, arg) => {
  console.log(vditor.getValue());
  fs.writeFile(arg, vditor.getValue(), "utf-8", (err) => {
    if (err) {
      event.sender.send("asynchronous-reply", "写入失败");
    } else {
      event.sender.send("asynchronous-reply", "写入成功");
    }
  })
});

// 打开文件监听
ipcRenderer.on('open-file', (event, arg) => {
  console.log(arg);
  console.log(vditor);
  vditor.setValue(arg);
})

// 初始化文件显示（如果是右键通过本软件打开）
ipcRenderer.on('init-content', (event, arg) => {
  console.log("arg: ", arg)
  localStorage.setItem('vditorvditor', arg)
})

// 获取文件名
ipcRenderer.on('get-file-name', (event, arg) => {
  console.log(arg)
  var reg = /ir-(.*)_[0-9]{0,2}/;
  var match = reg.exec($("h1, h2, h3, h4, h5, h6")[0].id);
  var fileName;
  if (match == null || match.length == 0) {
    console.log(match)
    fileName = match[1]
    if (fileName == null || fileName == 'undefined' || fileName == '') {
      fileName = "Untitled";
    }
  } else {
    fileName = "Untitled";
  }
  // 调用保存文件消息接口
  event.sender.send('saveFile', fileName)
});
// md编辑器h1-h6快捷键监听
ipcRenderer.on('md-hot-key', (event, arg) => {
  console.log(event)
  console.log(arg)
  vditor.processHeading(arg);
});
// md编辑器无值快捷键监听
ipcRenderer.on('md-hot-key-no-value', (event, arg) => {
  console.log(arg)
  console.log(event)
  // 撤销 ctrl-z
  if (arg === 'undo') {
    vditor.vditor.undo.undo(vditor.vditor)
  }
  // 重做 ctrl-y
  if (arg === 'redo') {
    vditor.vditor.undo.redo(vditor.vditor)
  }
  // 侧边栏处理
  if (arg === 'sidebar') {
    var siderbar_show = $('.vditor-outline').css('display')
    if (siderbar_show === 'none') {
      $('.vditor-outline').css('display', 'block');
    } else {
      $('.vditor-outline').css('display', 'none');
    }
  }

});

// 主题变更监听
ipcRenderer.on('theme-chanage', () => {
  const isDarkMode = ipcRenderer.invoke('dark-mode:toggle')
  console.log("isDarkMode:", isDarkMode);
  if (isDarkMode) {
    window.vditor.setTheme('dark', 'dark', 'native');
    document.querySelector('body').style.backgroundColor = '#2f363d'
  } else {
    window.vditor.setTheme('light', 'light', 'github');
    document.querySelector('body').style.backgroundColor = ''
  }
});