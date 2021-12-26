import { app, BrowserWindow, nativeTheme, Menu } from 'electron'
import path from 'path'
import * as remoteMain from "@electron/remote/main";

try {
  if (process.platform === 'win32' && nativeTheme.shouldUseDarkColors === true) {
    require('fs').unlinkSync(require('path').join(app.getPath('userData'), 'DevTools Extensions'))
  }
} catch (_) { }

let mainWindow

function createWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    useContentSize: true,
    webPreferences: {
      contextIsolation: true,
      // More info: /quasar-cli/developing-electron-apps/electron-preload-script
      preload: path.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD),
      enableRemoteModule: true,
    },
  });

  mainWindow.loadURL(process.env.APP_URL);

  const cmdParamParser = app.commandLine.getSwitchValue("parser");
  const cmdParamDebug = app.commandLine.getSwitchValue("debug");

  // https://stackoverflow.com/questions/39349017/how-to-run-an-electron-app-with-arguments
  // https://stackoverflow.com/questions/37884130/electron-remote-is-undefined
  // https://stackoverflow.com/questions/68235611/electron-remote-is-undefined-even-enableremotemodule-is-true
  // https://stackoverflow.com/questions/69059668/enableremotemodule-is-missing-from-electron-v14-typescript-type-definitions/69059669#69059669
  remoteMain.initialize();
  remoteMain.enable(mainWindow.webContents);

  global.sharedObject = {
    cmdParams: {
      parser: cmdParamParser === "exceljs" ? "exceljs" : "xlsxextract",
      debug: cmdParamDebug === "true",
    },
  };

  if (process.env.DEBUGGING || cmdParamDebug === "true") {
    // if on DEV or Production with debug enabled
    mainWindow.webContents.openDevTools();
  } else {
    // we're on production; no access to devtools pls
    mainWindow.webContents.on("devtools-opened", () => {
      mainWindow.webContents.closeDevTools();
    });
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

// 隐藏菜单
Menu.setApplicationMenu(null)
