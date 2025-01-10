import { app, BrowserWindow, ipcMain, protocol, net } from 'electron'
import { ChatCompletion } from '@baiducloud/qianfan'
import OpenAI from 'openai'
import path from 'path'
import fs from 'fs/promises'
import url from 'url'
import util from 'util'
import 'dotenv/config'
import { CreateChatProps } from './types'
import { convertMessages } from './helper'
import { createProvider } from './providers/createProvider'
import { configManager } from './config'
import { createMenu, updateMenu, createContextMenu } from './menu'

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}
const createWindow = async () => {
  // 初始化配置
  await configManager.load()

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Create application menu
  createMenu(mainWindow)

  // Add context menu handler
  ipcMain.on('show-context-menu', (event, id) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return
    createContextMenu(win, id)
  })

  protocol.handle('safe-file', async (request) => {
    console.log(request.url)
    const filePath = decodeURIComponent(request.url.slice('safe-file://'.length))
    console.log(filePath)
    // const data = await fs.readFile(filePath)
    // return new Response(data, {
    //   status: 200,
    //   headers: {
    //     'Content-Type': lookup(filePath) as string
    //   }
    // })
    const newFilePath = url.pathToFileURL(filePath).toString()
    console.log(newFilePath)
    return net.fetch(newFilePath)
  })
  ipcMain.handle('copy-image-to-user-dir', async (event, sourcePath: string) => {
    const userDataPath = app.getPath('userData')
    const imagesDir = path.join(userDataPath, 'images')
    await fs.mkdir(imagesDir, { recursive: true })
    const fileName = path.basename(sourcePath)
    const destPath = path.join(imagesDir, fileName)
    await fs.copyFile(sourcePath, destPath)
    return destPath
  })
  ipcMain.on('start-chat', async (event, data: CreateChatProps ) => {
    console.log('hey', data)
    const { providerName, messages, messageId, selectedModel } = data
    try {
      const provider = createProvider(providerName)
      const stream = await provider.chat(messages, selectedModel)
      for await (const chunk of stream) {
        console.log('the chunk', chunk)
        const content = {
          messageId,
          data: chunk
        }
        mainWindow.webContents.send('update-message', content)
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorContent = {
        messageId,
        data: {
          is_end: true,
          result: error instanceof Error ? error.message : '与AI服务通信时发生错误',
          is_error: true
        }
      }
      mainWindow.webContents.send('update-message', errorContent)
    }
  })
  // 添加配置相关的 IPC 处理程序
  ipcMain.handle('get-config', () => {
    return configManager.get()
  })

  ipcMain.handle('update-config', async (event, newConfig) => {
    const updatedConfig = await configManager.update(newConfig)
    // 如果语言发生变化，更新菜单
    if (newConfig.language) {
      updateMenu(mainWindow)
    }
    return updatedConfig
  })

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
