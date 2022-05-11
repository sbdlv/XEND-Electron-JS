const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('xendAPI', {
    sendMsg: (user, msg) => ipcRenderer.invoke('chat:send', user, msg),
    addNewMessageHandler: (fun) => {
        ipcRenderer.on('new-message', fun);
    },
    getVCard: (user) => ipcRenderer.invoke('xmpp:get:vcard', user),
    loginXMPP: (user, domain, password, server, port) => ipcRenderer.invoke('xmpp:login', user, domain, password, server, port),
    getLastChattedUsers: ()=> ipcRenderer.invoke('chat:get:users'),
    getMessagesFrom: (remoteJID)=> ipcRenderer.invoke('chat:get:messages', remoteJID),
})