// Modules to control application life and create native browser window
const {app, BrowserWindow} = require('electron')
const electron = require('electron');
const path = require('path');
const http = require('http');
const url = require('url');

const Tray = electron.Tray;
const Menu = electron.Menu;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var appTray = null;
let mainWindow

var port = 5237;

function createWindow () {

  port += 1;
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    title: 'GetMac',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  var MenuTemplate = [
    {
      label: '清除远程通讯程序',
      click: function () {
        app.killRemoteControl();
      }
    },
    {
      label: '关闭',
       click: function () {
         app.quit();
        app.quit();
      }
  },
  ];

  appTray = new Tray(path.join(__dirname, 'app.ico'));

  const contextMenu = Menu.buildFromTemplate(MenuTemplate);

  appTray.setToolTip('mac获取工具');
  appTray.setContextMenu(contextMenu);

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })

  var mac = null;

  require('getmac').getMac(function(err, macAddress){
    if (err)  throw err
    mac = macAddress;
  });

  http.createServer(function (req, resp) {
  const reqUrl = url.parse(req.url, true);
    if (reqUrl.pathname === '/mac' && req.method === 'GET') {
      resp.statusCode = 200;
      resp.setHeader('Content-Type', 'application/json');
      resp.setHeader('Access-Control-Allow-Origin', '*');
      resp.end(JSON.stringify({mac}));
    } else {
      resp.statusCode = 403;
      resp.setHeader('Content-Type', 'application/json');
      resp.end();
    }
  }).listen(port, '127.0.0.1', () => {
    console.log('server running at http://127.0.0.1:' + port);
  });


const process = require('process');
const netstat = require('node-netstat');
const ip = require('ip');
var cmd = process.platform === 'win32' ? 'tasklist': 'ps aux';
var exec = require('child_process').exec;
var excludeName = 'svchost';

// 关闭远程通讯程序
app['killRemoteControl'] = function () {
  var excludePid = [];
  var pids = [];
  exec(cmd, function (err, stdout, stderr){
      if(err) {
          return console.log(err);
      }
      stdout.split('\n').filter(function (line) {
          var p = line.trim().split(/\s+/), pname = p[0], pid = p[1];
          if (pname.toLowerCase().indexOf(excludeName) >= 0 && parseInt(pid)) {
              excludePid.push(+pid);
          }
      });
      var prekillPids = [...new Set(pids)];
      console.log(prekillPids);
      for (let i of prekillPids) {
        var index = excludePid.indexOf(i);
        if (index === -1) {
          try {
            process.kill(i);
          } catch (e) {
            console.log(i + 'cant be killed'); 
          }
        }
      }
  });

  netstat({
      filter: {
          local: {
              address: ip.address()
          },
          state: 'ESTABLISHED'
      }
  }, item => {
      pids.push(item.pid);
  });
}
  
  // 测试getMac库正常运行
  if ( require('getmac').isMac("e4:ce:8f:5b:a7:fc") ) {
      console.log('valid mac')
  }
  else {
      console.log('invalid mac')
  }

}

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
         mainWindow.restore();
      }
      mainWindow.focus();
    }
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
