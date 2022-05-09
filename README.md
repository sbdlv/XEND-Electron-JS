# XEND-Electron-JS

## DB

```sql
CREATE TABLE local_user (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
  	jid TEXT UNIQUE
);

CREATE TABLE chat (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
  	local_user INTEGER,
  	remote_jid TEXT,
  	UNIQUE(remote_jid, local_user)
);

CREATE TABLE message (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
  	chat INTEGER,
  	body TEXT,
  	date integer,
  	sentLocally INTEGER
);
```