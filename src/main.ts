import { app, BrowserWindow } from 'electron';
import { ChatCompletion } from '@baiducloud/qianfan'
import path from 'path'
import 'dotenv/config'
import OpenAI from 'openai'
import fs from 'fs/promises'

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = async () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
  const client = new OpenAI({
    apiKey: process.env['ALI_API_KEY'],
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
  })
  const imageBuffer = await fs.readFile('/Users/viking/Desktop/dog.jpeg')
  const base64Image = imageBuffer.toString('base64')
  console.log('base64', base64Image)
  const resp = await client.chat.completions.create({
    messages: [ {
      role: 'user',
      content: [
        { type: 'text', text: '图中是什么动物？'},
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}`}}
      ]
    }],
    model: 'qwen-vl-plus'
  })
  // const resp = await client.chat.completions.create({
  //   messages: [
  //     { role: 'system', content: '你现在是一只卡通片里面的可爱小狗，请模仿汪汪队长的口吻进行回答' },
  //     { role: 'user', content: '请问队长，老鼠为什么有害呢？' }
  //   ],
  //   model: 'qwen-turbo',
  // })
  // for await (const chunk of stream) {
  //   console.log(chunk.choices[0].delta)
  // }
  console.log('resp', resp.choices[0].message)
  // const client = new ChatCompletion()
  // const stream = await client.chat({
  //   messages: [
  //     {"role":"user","content":"你好"},
  //     {"role":"assistant","content":"如果您有任何问题，请随时向我提问。"},
  //     {"role":"user","content": "我在上海，周末可以去哪里玩？"},
  //     {"role":"assistant","content": "上海是一个充满活力和文化氛围的城市，有很多适合周末游玩的地方。"},
  //     {"role":"user","content": "周末这里的天气怎么样？"}
  //   ],
  //   stream: true
  // }, 'ERNIE-Speed-128K')
  // for await (const chunk of stream) {
  //   console.log(chunk)
  // }
};

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
