const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('xendAPI', {
    sendMsg: (user, msg) => ipcRenderer.invoke('chat:send', user, msg),
    addNewMessageHandler: (fun) => {
        ipcRenderer.on('new-message', fun);
    },
    getVCard: (user) => ipcRenderer.invoke('xmpp:get:vcard', user),
    getLocalVCard: () => ipcRenderer.invoke('xmpp:get:vcard:local'),
    setVCard: (vCard) => ipcRenderer.invoke('xmpp:set:vcard', vCard),
    promptVCardImage: () => ipcRenderer.invoke('xmpp:prompt:vcard:image'),
    loginXMPP: (user, domain, password, server, port) => ipcRenderer.invoke('xmpp:login', user, domain, password, server, port),
    logoutXMPP: () => ipcRenderer.invoke('xmpp:logout'),
    getLastChattedUsers: ()=> ipcRenderer.invoke('chat:get:users'),
    getMessagesFrom: (remoteJID)=> ipcRenderer.invoke('chat:get:messages', remoteJID),
    getLocalUserJID: ()=> ipcRenderer.invoke('xmpp:get:user:jid'),
    loadSettings: ()=> ipcRenderer.send('screen:load:settings'),
    loadChat: ()=> ipcRenderer.send('screen:load:chat'),
})