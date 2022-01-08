const path = require('path')
const fs = require("fs");
const storage = require('electron-localstorage')
window.$ = window.jQuery = require("jquery");

storage.setStoragePath(path.join(__dirname, './dist/db.json'))

// new VConsole()
const initVditor = (language) => {
  window.vditor = new Vditor('vditor', {
    cdn: './vditor',
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
};

$(function() {
  initVditor('zh_CN')
  window.setLang = (language) => {
    window.vditor.destroy()
    initVditor(language)
  }
});


const { ipcRenderer } = require('electron')

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

ipcRenderer.on('open_file', (event, arg) => {
  console.log(arg);
  console.log(event);
  vditor.setValue(arg);
  const storagePath = storage.getStoragePath();
  const sessionId = storage.getItem('sessionId');
  console.log(sessionId);
  console.log(storagePath);
  console.log(storage.getItem("file-name"))
})

ipcRenderer.on('file_name', (event, arg) => {
  console.log(arg) // prints "ping"
  var reg = /ir-(.*)_[0-9]{0,2}/;
  var match = reg.exec($("h1, h2, h3, h4, h5, h6, p")[0].id)
  console.log(match)
  var fileName = match[1]
  if (fileName == null || fileName == 'undefined' || fileName == '') {
    fileName = "Untitled"
  }
  event.sender.send('getFileName', fileName)
});

ipcRenderer.on('md-hot-key', (event, arg) => {
  console.log(event)
  console.log(arg)
  vditor.processHeading(arg);
});

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

ipcRenderer.on('theme-chanage', () => {
  const isDarkMode = ipcRenderer.invoke('dark-mode:toggle')
  console.log("isDarkMode:", isDarkMode);
  if (isDarkMode) {
    window.vditor.setTheme('dark', 'dark',  'native');
    document.querySelector('body').style.backgroundColor='#2f363d'
  } else {
    window.vditor.setTheme('light', 'light', 'github');
    document.querySelector('body').style.backgroundColor=''
  }
});