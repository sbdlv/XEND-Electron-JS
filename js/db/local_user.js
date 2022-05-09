const TABLE_NAME = "local_user";

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
     * @param {{id: number, jid: string}} local_user 
     * @returns 
     */
    async insert(local_user) {
        return await this.db.run(`INSERT INTO ${TABLE_NAME} (id, jid) VALUES (?, ?)`, local_user.id, local_user.jid);
    }
    
    /**
     * 
     * @param {{jid: string, password: string, active: boolean}} local_user 
     * @returns 
     */
    async updateInsert(local_user) {
        return await this.db.run(`INSERT INTO ${TABLE_NAME} (jid, password, active) VALUES (@jid, @password, @active) ON CONFLICT(jid) DO UPDATE SET password = @password, active = @active`, local_user);
    }

    async create() {
        return await this.db.exec("CREATE TABLE IF NOT EXISTS local_user ( id INTEGER PRIMARY KEY AUTOINCREMENT, jid TEXT UNIQUE, password TEXT, active INTEGER );");
    }
}