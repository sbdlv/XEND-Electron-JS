const TABLE_NAME = "chat";

module.exports = class {

    /**
     * 
     * @param {import('sqlite').Database} db 
     */
    constructor(db) {
        this.db = db;
        this.create();
    }

    /**
     * 
     * @param {{local_user: integer, remote_jid: string}} chat 
     * @returns 
     */
    async insert(chat) {
        return await this.db.run(`INSERT INTO ${TABLE_NAME} (local_user, remote_jid) VALUES (?, ?)`, chat.local_user, chat.remote_jid);
    }

    async create(){
        await this.db.exec("CREATE TABLE IF NOT EXISTS chat ( id INTEGER PRIMARY KEY AUTOINCREMENT, local_user INTEGER, remote_jid TEXT, UNIQUE(remote_jid, local_user));");
    }

    async getChatsAndLastMessage(){
        return await this.db.all("SELECT DISTINCT chat.remote_jid, message.body, message.sentLocally, MAX(date) as date FROM chat LEFT JOIN message ON chat.id = message.chat ORDER BY date DESC");
    }
}