const TABLE_NAME = "message";

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
     * @param {{chat: number, body: string, date: number, sentLocally: boolean}} message 
     * @returns 
     */
    async insert(message) {
        return await this.db.run(`INSERT INTO ${TABLE_NAME} (chat, body, date, sentLocally) VALUES (?, ?, ?, ?)`, message.chat, message.body, message.date, message.sentLocally);
    }

    async deleteAll() {
        return await this.db.run(`DELETE FROM ${TABLE_NAME}`);
    }

    async deleteFromChat(chat_id) {
        return await this.db.run(`DELETE FROM ${TABLE_NAME} WHERE chat = ?`, chat_id);
    }

    /**
     * ASC order
     * @param {number} chat_id 
     */
    async getMessagesForChat(chat_id) {
        return await this.db.all(`SELECT * FROM message WHERE chat = ? ORDER BY date ASC`, chat_id);
    }

    async create(){
        return await this.db.exec("CREATE TABLE IF NOT EXISTS message (id INTEGER PRIMARY KEY AUTOINCREMENT, chat INTEGER, body TEXT, date integer, sentLocally INTEGER);");
    }
}