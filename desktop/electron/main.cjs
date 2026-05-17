const { app, BrowserWindow, shell } = require("electron");
const path = require("node:path");

const isDev = !app.isPackaged;
const appIcon = path.join(__dirname, "../../icons/icon.png");

function createWindow() {
  const win = new BrowserWindow({
    width: 1360,
    height: 920,
    minWidth: 980,
    minHeight: 680,
    title: "Episteme",
    backgroundColor: "#f4f4f2",
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 16, y: 16 },
    icon: appIcon,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  if (isDev) {
    win.loadURL("http://127.0.0.1:5173?desktop=1");
  } else {
    win.loadFile(path.join(__dirname, "../../dist/index.html"), { query: { desktop: "1" } });
  }
}

app.whenReady().then(() => {
  if (process.platform === "darwin" && app.dock) {
    app.dock.setIcon(appIcon);
  }
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
