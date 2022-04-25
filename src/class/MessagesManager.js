'use strict';

/**
 * @fires MessagesManager#incoming
 */
module.exports = class MessagesManager extends EventTarget {
    data = {};
    event;

    /**
     * 
     * @param {import("@xmpp/client").Client} xmpp_connection 
     */
    constructor(xmpp_connection) {
        super();
        xmpp_connection.on("stanza", this.#onIncoming);
    }

    async #onIncoming(stanza) {
        console.log("NEW STANZA ####: ");
        console.log(stanza);


        this.dispatchEvent("incoming");
    }

}
