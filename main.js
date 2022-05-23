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
let messageDAO;
/** @type {import('./js/db/local_user')} */
let localUserDAO;
/** @type {import('./js/db/chat')} */
let chatDAO;

//Logging
const winston = require('winston');

//Utils
const { iqArrayToVCard } = require("./js/utils/ToolsvCard");

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    transports: [new winston.transports.Console({ format: winston.format.cli() }), new winston.transports.File({ filename: path.join(APP_DATA_PATH, "main_log.log"), format: winston.format.printf(info => `${new Date().toLocaleString()}\t[${info.level}]\t${info.message}`), })],
});

//Properties
/**
 * @type {import('@xmpp/client').Client}
 */
let xmppConnection;
let localUserJID;
let localUserID;
let mainWindow;
let db;


function registerHandlers() {
    ipcMain.handle("chat:get:users", handleChatGetLastUsers);
    ipcMain.handle("chat:get:messages", handleChatGetMessages);
    ipcMain.handle("chat:send", handleChatSend);
    ipcMain.handle("xmpp:get:vcard", handleGetVCard);
    ipcMain.handle("xmpp:set:vcard", handleSetVCard);
    ipcMain.handle("xmpp:get:user:jid", handleXMPPGetUserJID);
    ipcMain.handle("xmpp:login", handleXMPPLogin);
    ipcMain.handle("xmpp:prompt:vcard:image", handlePromptVCardImage);
    ipcMain.on("screen:load:settings", onScreenLoadSettings);
    ipcMain.on("screen:load:chat", onScreenLoadChat);
}

//Check for database file
const createWindow = () => {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        title: "XEND",
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

async function handlePromptVCardImage(event) {
    let file = await dialog.showOpenDialog({
        title: "Escoger imagen de perfil",
        filters: [
            {
                name: "Imágenes",
                extensions: ["jpg", "png"]
            }
        ]
    })

    if (file.canceled) {
        return false;
    } else {
        return fs.readFileSync(file.filePaths[0], { encoding: "base64" });
    }
}

async function onScreenLoadSettings(event) {
    mainWindow.loadFile("settings.html");
}

async function onScreenLoadChat(event) {
    mainWindow.loadFile("chat.html");
}

async function handleXMPPGetUserJID(event) {
    return localUserJID;
}

async function handleChatGetMessages(event, remoteJID) {
    logger.info("Querying messages with " + remoteJID);

    let chat_id = await chatDAO.get(localUserID, remoteJID);

    if (chat_id === undefined) {
        return [];
    } else {
        chat_id = chat_id.id;
    }

    return await messageDAO.getMessagesForChat(chat_id);
}

// IPC Handler functions
async function handleChatSend(event, remoteUser, msg) {
    logger.info("Outgoing message to " + remoteUser);
    let JID = jid(remoteUser);

    try {
        saveMessageOnDB(localUserID, remoteUser, msg, true);
    } catch (error) {
        logger.error(error);
    }

    return await xmppConnection.send(xml("message", {
        to: JID,
        type: "chat"
    }, xml(
        "body",
        {},
        msg
    )));
}

/**
 * 
 * @param {*} event 
 * @param {*} user 
 * @returns 
 * @see https://xmpp.org/extensions/xep-0054.html#sect-idm45828960584512
 */
async function handleGetVCard(event, user) {
    let vCard = await xmppConnection.sendReceive(xml(
        "iq",
        {
            from: localUserJID,
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

    return iqArrayToVCard(vCard.children[0].children);
}

/**
 * 
 * @param {*} event 
 * @param {*} vCard 
 * @returns 
 * @see https://xmpp.org/extensions/xep-0054.html#sect-idm45828960593504
 */
async function handleSetVCard(event, vCard) {
    return await xmppConnection.sendReceive(xml(
        "iq",
        {
            id: 'v2',
            type: "set"
        },
        xml(
            "vCard",
            {
                xmlns: 'vcard-temp'
            },
            xml(
                "FN",
                {},
                vCard.FN
            ),
            xml(
                "DESC",
                {},
                vCard.DESC
            ),
            xml(
                "PHOTO",
                {},
                xml(
                    "TYPE",
                    {},
                    "image/jpeg"
                ),
                xml(
                    "BINVAL",
                    {},
                    vCard.PHOTO_BASE_64
                )
            )
        )
    ));
}

async function handleXMPPLogin(event, user, domain, password, server, port) {
    xmppConnection = client({
        service: `xmpp://${server}:${port}`,
        domain: domain,
        username: user,
        password: password,
    });

    //Setup listeners
    xmppConnection.on("online", () => {
        localUserJID = `${user}@${domain}`;
        xmppConnection.send(xml("presence"));
        logger.info("XMPP connection successful!");

        //Redirect incoming messages to renderer
        xmppConnection.on("stanza", stanzaHandler);
    });

    try {
        await xmppConnection.start();

        try {
            localUserID = await localUserDAO.getID(`${user}@${domain}`);

            if (localUserID === undefined) {
                try {
                    localUserID = await localUserDAO.insert(
                        {
                            jid: `${user}@${domain}`,
                            password: password,
                            active: true
                        }
                    );

                    localUserID = localUserID.lastID;
                } catch (error) {
                    logger.error("Error inserting local user. " + error);
                    //TODO: Should prevent loading app?
                }
            } else {
                localUserID = localUserID.id;
            }
        } catch (error) {
            logger.error("Error inserting local user. " + error)
        }
        logger.info("User ID: " + localUserID);
    } catch (error) {
        logger.error("Error while login. " + error);
        return false;
    }

    mainWindow.loadFile("chat.html");
    return true;
}

async function handleChatGetLastUsers(event) {
    return await chatDAO.getChatsAndLastMessage();
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
        messageDAO = new (require("./js/db/message"))(db);
        chatDAO = new (require("./js/db/chat"))(db);
        localUserDAO = new (require("./js/db/local_user"))(db);
    } catch (error) {
        dialog.showErrorBox("Fallo con la base de datos", "No se ha podido establecer una conexión.");
        logger.error("Couldn't make connection with the DB. " + error);
        app.exit(1);
    }

    //Setup app
    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Algunas APIs pueden solamente ser usadas después de que este evento ocurra.
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
        if (process.platform !== 'darwin') {
            app.quit()
            if (xmppConnection != undefined) {
                xmppConnection.close();
            }
        }
    })
}

async function stanzaHandler(stanza) {
    if (stanza.is("message")) {
        let remoteJID = stanza.attrs.from.substr(0, stanza.attrs.from.indexOf("/"));
        logger.info("Incoming message from " + remoteJID);

        //Prevent stanzas with these childs: origin-id and displayed stanzas
        if (!stanza.children[0].name != "body") {
            return;
        }

        let processedMessage = {
            from: remoteJID,
            body: stanza.children[0].children[0]
        }
        mainWindow.webContents.send("new-message", processedMessage);

        try {
            saveMessageOnDB(localUserID, remoteJID, processedMessage.body, false);
        } catch (error) {
            logger.error(error);
        }

    } else {
        logger.info("New UNKNOWN STANZA from XMPP Connection");
    }
}

/**
 * 
 * @param {number} localUserID 
 * @param {string} remoteJID 
 * @param {string} body 
 * @param {boolean} sentLocally 
 * @throws
 */
async function saveMessageOnDB(localUserID, remoteJID, body, sentLocally) {
    let chatID = await chatDAO.get(localUserID, remoteJID);

    if (chatID === undefined) {
        try {
            chatID = await chatDAO.insert({ local_user: localUserID, remote_jid: remoteJID })
            chatID = chatID.lastID;
        } catch (error) {
            throw `Couldn't insert new chat between ${localUserJID} and ${remoteJID}. ` + error;
        }
    } else {
        chatID = chatID.id;
    }

    logger.info("Saving message for chat: " + chatID);

    try {
        await messageDAO.insert({ chat: chatID, body: body, date: new Date().getTime(), sentLocally: sentLocally });
    } catch (error) {
        throw `Couldn't insert incoming message for chat: ${chatID}. ` + error;
    }
}

init();