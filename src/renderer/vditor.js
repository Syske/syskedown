// 渲染层入口（T-001 行为等价迁移自旧 src/vditor.js；T-003 将整体重写为 window.api 链路）
import Vditor from 'vditor'
import 'vditor/dist/index.css'
import $ from 'jquery'

window.$ = window.jQuery = $

// nodeIntegration 仍在（T-003 将关闭）：过渡期经 window.require 访问 electron / fs
const { ipcRenderer } = window.require('electron')
const fs = window.require('fs')

var vditor;

window.onload = function () {
  vditor = new Vditor('vditor', {
    cdn: '.',
    placeholder: 'Hello, Vditor!',
    typewriterMode: true,
    toolbar: [],
    toolbarConfig: {
      hide: true
    },
    counter: {
      enable: true,
      type: 'text',
    }
  });
}

ipcRenderer.on('save-file', (event, arg) => {
  fs.writeFile(arg, vditor.getValue(), "utf-8", (err) => {
    if (err) {
      event.sender.send("asynchronous-reply", "写入失败");
    } else {
      event.sender.send("asynchronous-reply", "写入成功");
    }
  })
});

ipcRenderer.on('open_file', (event, arg) => {
  vditor.setValue(arg);
});

ipcRenderer.on('file_name', (event, arg) => {
  var reg = /ir-(.*)_[0-9]{0,2}/;
  var match = reg.exec($("h1, h2, h3, h4, h5, h6, p")[0].id)
  var fileName = match[1]
  if (fileName == null || fileName == 'undefined' || fileName == '') {
    fileName = "Untitled"
  }
  event.sender.send('getFileName', fileName)
});

ipcRenderer.on('md-hot-key', (event, arg) => {
  vditor.processHeading(arg);
});

ipcRenderer.on('md-hot-key-no-value', (event, arg) => {
  if (arg === 'undo') {
    vditor.vditor.undo.undo(vditor.vditor)
  }
  if (arg === 'redo') {
    vditor.vditor.undo.redo(vditor.vditor)
  }

});

ipcRenderer.on('theme-chanage', () => {
  const isDarkMode = ipcRenderer.invoke('dark-mode:toggle')
  if (isDarkMode) {
    vditor.setTheme('dark', 'dark',  'native');
    document.querySelector('body').style.backgroundColor='#2f363d'
  } else {
    vditor.setTheme('light', 'light', 'github');
    document.querySelector('body').style.backgroundColor=''
  }
});
