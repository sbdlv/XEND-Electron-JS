const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('xendAPI', {
    chatWith: (user, msg) => ipcRenderer.invoke('chat:send', user, msg),
    addNewMessageHandler: (fun) => {
        ipcRenderer.on('new-message', fun);
    },
    getVCard: (user) => ipcRenderer.invoke('xmpp:get:vcard', user),
})