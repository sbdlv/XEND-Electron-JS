process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

// Modules to control application life and create native browser window etc
const { app, BrowserWindow, ipcMain, ipcRenderer, dialog } = require('electron')
const path = require('path')
const fs = require('fs')

//XMPP imports
const { client, xml } = require("@xmpp/client");
const { jid } = require("@xmpp/jid");
const debug = require("@xmpp/debug");

//SQLite imports
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

//App constants
const APP_DATA_PATH = app.getPath('userData');
const APP_DB_FILE_PATH = path.join(APP_DATA_PATH, "db.sqlite");

//DB DAO
/** @type {import('./js/db/message')} */
let message_dao;
/** @type {import('./js/db/local_user')} */
let local_user_dao;
/** @type {import('./js/db/chat')} */
let chat_dao;

//Logging
const winston = require('winston');

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.cli(),
    transports: [new winston.transports.Console(), new winston.transports.File({ filename: path.join(APP_DATA_PATH, "main_log.log"), format: winston.format.timestamp() })],
});

//Properties
/**
 * @type {import('@xmpp/client').Client}
 */
let xmpp_connection;
let current_user_at;
let mainWindow;
let db;


function registerHandlers() {
    ipcMain.handle("chat:get:users", handleChatGetLastUsers);
    ipcMain.handle("chat:send", handleChatSend);
    ipcMain.handle("xmpp:get:vcard", handleGetVCard);
    ipcMain.handle("xmpp:login", handleXMPPLogin);
}

//Check for database file
const createWindow = () => {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        minWidth: 550,
        minHeight: 550,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: true,
        },
        icon: path.join(__dirname, 'img/logo.ico'),
    })

    // and load the index.html of the app.
    mainWindow.loadFile('login.html')

    mainWindow.webContents.openDevTools()

    return mainWindow;
}


// IPC Handler functions
async function handleChatSend(event, username, msg) {
    let JID = jid(username);

    return xmpp_connection.sendReceive(xml("message", {
        to: JID,
        type: "chat"
    }, xml(
        "body",
        {},
        msg
    )));
}

async function handleGetVCard(event, user) {
    return await xmpp_connection.sendReceive(xml(
        "iq",
        {
            from: current_user_at,
            id: 'v3',
            to: user,
            type: "get"
        },
        xml(
            "vCard",
            {
                xmlns: 'vcard-temp'
            }
        )
    ));
}

async function handleXMPPLogin(event, user, domain, password, server, port) {
    console.log(user);

    xmpp_connection = client({
        service: `xmpp://${server}:${port}`,
        domain: domain,
        username: user,
        password: password,
    });

    //Setup listeners

    xmpp_connection.on("online", () => {
        current_user_at = `${user}@${domain}`;
        xmpp_connection.send(xml("presence"));
        logger.info("XMPP connection successful!");
        //let mainWindow = createWindow(xmpp_connection);

        //Redirect incoming messages to renderer
        xmpp_connection.on("stanza", stanzaHandler);
    });

    await xmpp_connection.start();

    try {
        await local_user_dao.updateInsert({
            jid: `${user}@${domain}`,
            password: password,
            active: true
        })
    } catch (error) {
        logger.error("Error inserting local user. " + error)
    }

    mainWindow.loadFile("chat.html");

    return true;
}

async function handleChatGetLastUsers(event) {
    return await chat_dao.getChatsAndLastMessage();
}

//Init

async function init() {
    try {
        //Open creates the file if necessary
        db = await open(
            {
                filename: APP_DB_FILE_PATH,
                driver: sqlite3.Database
            }
        );

        //Init DAOs
        message_dao = new (require("./js/db/message"))(db);
        chat_dao = new (require("./js/db/chat"))(db);
        local_user_dao = new (require("./js/db/local_user"))(db);
    } catch (error) {
        dialog.showErrorBox("Fallo con la base de datos", "No se ha podido establecer una conexión.");
        logger.error("Couldn't make connection with the DB. " + error);
        app.exit(1);
    }

    //Setup app
    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Algunas APIs pueden solamente ser usadas despues de que este evento ocurra.
    app.whenReady().then(() => {
        app.on('activate', () => {
            // On macOS it's common to re-create a window in the app when the
            // dock icon is clicked and there are no other windows open.
            if (BrowserWindow.getAllWindows().length === 0) createWindow()
        })

        //Register IPC Handlers
        registerHandlers();

        createWindow();
    })

    // Quit when all windows are closed, except on macOS. There, it's common
    // for applications and their menu bar to stay active until the user quits
    // explicitly with Cmd + Q.
    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') app.quit()
    })
}

async function stanzaHandler(stanza) {
    if (stanza.is("message")) {
        let processedMessage = {
            from: stanza.attrs.from.substr(0, stanza.attrs.from.indexOf("/")),
            body: stanza.children[0].children[0]
        }
        mainWindow.webContents.send("new-message", processedMessage);

        logger.debug(stanza);

        /*let chat_id = chat_dao.get()
        message_dao.insert()*/
    } else {
        logger.silly("New UNKNOWN STANZA from XMPP Connection");
    }
}

init();