// main.js
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, ipcRenderer } = require('electron')
const path = require('path')

//XMPP imports
const { client, xml } = require("@xmpp/client");
const { jid } = require("@xmpp/jid");
const debug = require("@xmpp/debug");

//Properties
let xmpp_connection;

const createWindow = () => {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        minWidth: 550,
        minHeight: 550,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: true,
        }
    })

    // and load the index.html of the app.
    mainWindow.loadFile('chat.html')

    mainWindow.webContents.openDevTools()

    return mainWindow;

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Algunas APIs pueden solamente ser usadas despues de que este evento ocurra.
app.whenReady().then(() => {
    xmpp_connection = client({
        service: "xmpp://localhost:5222",
        domain: "xend",
        username: "usuario1",
        password: "usuario",
    });

    xmpp_connection.on("online", () => {
        xmpp_connection.send(xml("presence"));
        console.log("XMPP connection successful!");
        let mainWindow = createWindow(xmpp_connection);

        //Redirect incoming messages to renderer
        xmpp_connection.on("stanza", async (stanza) => {
            if(stanza.is("message")){
                let processedMessage = {
                    from: stanza.attrs.from.substr(0, stanza.attrs.from.indexOf("/")),
                    body: stanza.children[0].children[0]
                }
                mainWindow.webContents.send("new-message", processedMessage);
            }
        });
    });

    // xmpp_connection.on("input", async (stanza) => {
    //     console.log("NEW INPUT:");
    //     console.log(stanza);
    // });

    app.on('activate', () => {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })

    //Register IPC Handlers
    ipcMain.handle("chat:send", handleChatSend);

    xmpp_connection.start().catch(console.error);
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})

// IPC Handler functions
function handleChatSend(username, msg) {
    let JID = jid(`${username}@xend`);

    return xmpp_connection.send(xml("message", {
        to: JID,
        type: "chat"
    }, xml("body", {}, msg))).catch((e) => {
        console.log("ERROR SENDING MSG:");
        console.log(e);
    });
}