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

    async delete(chat_id) {
        return await this.db.run(`DELETE FROM ${TABLE_NAME} WHERE id = ?`, chat_id);
    }

    async deleteFromLocalUser(local_user_id) {
        return await this.db.run(`DELETE FROM ${TABLE_NAME} WHERE local_user = ?`, local_user_id);
    }

    async deleteAll() {
        return await this.db.run(`DELETE FROM ${TABLE_NAME}`);
    }

    async create() {
        await this.db.exec("CREATE TABLE IF NOT EXISTS chat ( id INTEGER PRIMARY KEY AUTOINCREMENT, local_user INTEGER, remote_jid TEXT, UNIQUE(remote_jid, local_user), CONSTRAINT fk_user FOREIGN KEY (local_user) REFERENCES local_user(id) ON DELETE CASCADE );");
    }

    async getChatsAndLastMessage() {
        return await this.db.all("SELECT DISTINCT chat.id, chat.remote_jid, message.body, message.sentLocally, MAX(date) as date FROM chat LEFT JOIN message ON chat.id = message.chat ORDER BY date DESC");
    }

    /**
     * 
     * @param {number} local_id
     * @param {string} remote_jid 
     * @returns 
     */
    async get(local_id, remote_jid) {
        return await this.db.get(`SELECT * FROM ${TABLE_NAME} WHERE local_user = ? AND remote_jid = ?`, local_id, remote_jid);
    }

    async deleteFromLocalUser(local_id) {
        return await this.db.get(`SELECT * FROM ${TABLE_NAME} WHERE local_user = ?`, local_id);
    }
}