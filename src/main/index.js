import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { spawn } from 'child_process'

import icon from '../../resources/icon.png?asset'

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 760,
    height: 570,
    resizable: false,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })
  // Create the splash window
  const splashWindow = new BrowserWindow({
    width: 500,
    height: 400,
    transparent: true,
    alwaysOnTop: true,
    frame: false
  })

  splashWindow.loadFile('src/renderer/splash.html')
  splashWindow.center

  mainWindow.on('ready-to-show', () => {
    setTimeout(() => {
      if (!splashWindow.isDestroyed()) {
        splashWindow.close()
      }
      if (mainWindow) {
        mainWindow.show()
      }
    }, 3000)
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}
function initiateMonitoringModule() {
  const python = spawn('python', [
    './src/external/py-monitoring/initiate-monitoring-module.py',
    '--state',
    'true'
  ])
  python.stdout.on('data', (data) => {
    console.log(data.toString())
  })
  python.on('error', (err) => {
    reject(`Failed to start Python process: ${err.message}`)
  })
}
function initiateIPCListener() {
  // Listen for toggle startup change
  ipcMain.on('ipc-run-at-startup', (event, state) => {
    console.log(`State Startup: ${state}`)
    const python = spawn('python', [
      './src/external/py-monitoring/startup-monitoring-module.py',
      '--state',
      state
    ])
    python.stdout.on('data', (data) => {
      console.log(data.toString())
    })
    python.on('error', (err) => {
      reject(`Failed to start Python process: ${err.message}`)
    })
  })
  // Listen for toggle start monitoring
  ipcMain.handle('ipc-start-monitoring', async (event, args) => {
    return new Promise((resolve, reject) => {
      console.log(`Start Monitoring: ${args.state}`)

      const python = spawn('python', [
        './src/external/py-monitoring/initiate-monitoring-module.py',
        '--state',
        args.state
      ])

      let output = ''
      let error = ''

      python.stdout.on('data', (data) => {
        output += data.toString() // accumulate output
      })

      python.stderr.on('data', (data) => {
        error += data.toString() // accumulate errors
      })

      python.on('close', (code) => {
        if (code === 0) {
          resolve(output) // return to renderer
        } else {
          reject(error || `Python exited with code ${code}`)
        }
      })

      python.on('error', (err) => {
        reject(`Failed to start Python process: ${err.message}`)
      })
    })
  })
  // Listen for populate table call
  ipcMain.handle('ipc-populate-table-request', async (event) => {
    return new Promise((resolve, reject) => {
      const python = spawn('python', ['./src/external/py-monitoring/monitor-module.py'])

      let output = ''
      let error = ''

      python.stdout.on('data', (data) => {
        output += data.toString() // accumulate output
      })

      python.stderr.on('data', (data) => {
        error += data.toString() // accumulate errors
      })

      python.on('close', (code) => {
        if (code === 0) {
          resolve(output) // return to renderer
        } else {
          reject(error || `Python exited with code ${code}`)
        }
      })

      python.on('error', (err) => {
        reject(`Failed to start Python process: ${err.message}`)
      })
    })
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()
  initiateIPCListener()
  initiateMonitoringModule()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
