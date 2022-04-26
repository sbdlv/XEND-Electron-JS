const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('xendAPI', {
    chatWith: (user, msg) => ipcRenderer.invoke('chat:send', user, msg),
    addNewMessageHandler: (fun) => {
        ipcRenderer.on('new-message', fun);
    }
})

// Estas mirando a ver por q messagesManager.addNewMessageHandler is not a function