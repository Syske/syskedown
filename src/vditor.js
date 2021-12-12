const path = require('path')
const fs = require("fs");
const storage = require('electron-localstorage')
window.$ = window.jQuery = require("jquery");

storage.setStoragePath(path.join(__dirname, './dist/db.json'))

// new VConsole()
var vditor;
window.onload = function () {
  vditor = new Vditor('vditor', {
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
  document.getElementById('vditor').append(vditor);
}

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
  var match = reg.exec($("h1, h2, h3, h4, h5, h6")[0].id)
  console.log(match)
  var fileName = match[1]
  if (fileName == null || fileName == 'undefined' || fileName == '') {
    fileName = "Untitled"
  }
  event.sender.send('getFileName', fileName)
});

ipcRenderer.on('md-hot-key', (event, arg) => {
  console.log(arg)
  vditor.processHeading(arg);
});