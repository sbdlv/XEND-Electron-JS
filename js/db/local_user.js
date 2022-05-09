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

    async create(){
        return await this.db.exec("CREATE TABLE IF NOT EXISTS local_user ( id INTEGER PRIMARY KEY AUTOINCREMENT, jid TEXT UNIQUE, password TEXT );");
    }
}