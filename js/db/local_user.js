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
     * @param {{jid: string, password: string, server: string, port: number, active: boolean}} local_user 
     * @returns 
     */
    async insert(local_user) {
        return await this.db.run(`INSERT INTO ${TABLE_NAME} (jid, password, server, port, active) VALUES (?, ?, ?, ?, ?)`, local_user.jid, local_user.password, local_user.server, local_user.port, local_user.active);
    }

    /**
     * 
     * @param {{jid: string, password: string, server: string, port: number, active: boolean}} local_user 
     * @returns 
     */
    async updateInsert(local_user) {
        return await this.db.run(`INSERT INTO ${TABLE_NAME} (jid, password, server, port, active) VALUES (?, ?, ?, ?, ?) ON CONFLICT(jid) DO UPDATE SET password = ?, active = ?`, local_user.jid, local_user.password, local_user.server, local_user.port, local_user.active, local_user.password, local_user.active);
    }

    /**
     * 
     * @param {{id: number, jid: string, password: string, active: boolean}} local_user 
     * @returns 
     */
    async update(local_user) {
        return await this.db.run(`UPDATE ${TABLE_NAME} SET jid = @jid, password = @password, active = @active WHERE id = @id`, local_user);
    }
    
    async create() {
        return await this.db.exec("CREATE TABLE IF NOT EXISTS local_user ( id INTEGER PRIMARY KEY AUTOINCREMENT, jid TEXT UNIQUE, password TEXT, server TEXT, port INTEGER, active INTEGER );");
    }
    
    async getID(jid) {
        return await this.db.get(`SELECT id FROM ${TABLE_NAME} WHERE jid = ?`, jid);
    }

    async getActiveUser() {
        return await this.db.get(`SELECT * FROM ${TABLE_NAME} WHERE active = 1`);
    }
    
    async setNotActive(jid){
        return await this.db.run(`UPDATE ${TABLE_NAME} SET active = 0 WHERE jid = ?`, jid);
    }

    async delete(local_user_id) {
        return await this.db.run(`DELETE FROM ${TABLE_NAME} WHERE id = ?`, local_user_id);
    }

}