// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.


const { ipcRenderer } = require('electron')
console.log(ipcRenderer.sendSync('synchronous-message', 'ping')) // prints "pong"
window.$ = window.jQuery = require("jquery");

ipcRenderer.on('asynchronous-reply', (event, arg) => {
  console.log(arg) // prints "pong"
})
ipcRenderer.send('asynchronous-message', 'ping')

ipcRenderer.on('open_file', (event, arg) => {
  console.log(arg) 
  console.log(event) 
  const html = marked.parse(arg);
  console.log(html);
  $('.editor').html(html);
  hljs.highlightAll();
  
});