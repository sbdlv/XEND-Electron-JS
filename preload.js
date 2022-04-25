const { contextBridge, ipcRenderer } = require('electron')

async function dsadsa(){
    let messagesManager = await ipcRenderer.invoke('get:mgr');
    console.log(messagesManager);
}

dsadsa();


contextBridge.exposeInMainWorld('xendAPI', {
    chatWith: (user, msg) => ipcRenderer.invoke('chat:send', user, msg),
    addEvent: (eFun) => ipcRenderer.invoke("mgr:adde", eFun)
})