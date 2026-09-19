CREATE TABLE IF NOT EXISTS meta(key TEXT PRIMARY KEY,value TEXT);
INSERT OR IGNORE INTO meta VALUES('version','1');
CREATE TABLE IF NOT EXISTS staff(id INTEGER PRIMARY KEY AUTOINCREMENT,affiliation TEXT NOT NULL,name TEXT NOT NULL,work_types TEXT NOT NULL DEFAULT 'T',memo TEXT,hourly INTEGER NOT NULL DEFAULT 40000,fee INTEGER NOT NULL DEFAULT 8000,deleted INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS shops(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,phone TEXT,memo TEXT,deleted INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS attendance(id INTEGER PRIMARY KEY AUTOINCREMENT,day TEXT NOT NULL,staff_id INTEGER NOT NULL,sequence INTEGER NOT NULL,check_in_time TEXT NOT NULL,status TEXT NOT NULL DEFAULT '대기',manager TEXT,memo TEXT);
CREATE TABLE IF NOT EXISTS jobs(id INTEGER PRIMARY KEY AUTOINCREMENT,day TEXT NOT NULL,staff_id INTEGER NOT NULL,shop_id INTEGER NOT NULL,status TEXT,shop_name_snapshot TEXT,choice_at TEXT,choice_time TEXT,start_at TEXT,start_time TEXT,end_at TEXT,end_time TEXT,duration_units INTEGER DEFAULT 0,t_units REAL DEFAULT 0,r_units REAL DEFAULT 0,j_units REAL DEFAULT 0,payment_type TEXT,settlement_memo TEXT,manager TEXT,total INTEGER DEFAULT 0,hold_amount INTEGER DEFAULT 0,staff_pay INTEGER DEFAULT 0,ting_amount INTEGER DEFAULT 0,balance_amount INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS manager_presence(manager TEXT PRIMARY KEY,last_seen TEXT NOT NULL);
INSERT OR IGNORE INTO manager_presence VALUES('실장A',datetime('now','-1 day'));
INSERT OR IGNORE INTO manager_presence VALUES('실장B',datetime('now','-1 day'));
INSERT OR IGNORE INTO manager_presence VALUES('실장C',datetime('now','-1 day'));
/* 기존 DB는 없는 열만 1회 실행:
ALTER TABLE staff ADD COLUMN work_types TEXT NOT NULL DEFAULT 'T';
ALTER TABLE staff ADD COLUMN memo TEXT;
ALTER TABLE attendance ADD COLUMN memo TEXT;
ALTER TABLE jobs ADD COLUMN choice_at TEXT;
ALTER TABLE jobs ADD COLUMN choice_time TEXT;
ALTER TABLE jobs ADD COLUMN duration_units INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN t_units REAL DEFAULT 0;
ALTER TABLE jobs ADD COLUMN r_units REAL DEFAULT 0;
ALTER TABLE jobs ADD COLUMN j_units REAL DEFAULT 0;
ALTER TABLE jobs ADD COLUMN payment_type TEXT;
ALTER TABLE jobs ADD COLUMN settlement_memo TEXT;
*/

/* v019 기존 DB 추가 열 - 각각 없는 경우 1회 실행
ALTER TABLE jobs ADD COLUMN hold_amount INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN ting_amount INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN balance_amount INTEGER DEFAULT 0;
*/


CREATE TABLE IF NOT EXISTS settlement_archives(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 day TEXT NOT NULL,
 archive_type TEXT NOT NULL DEFAULT 'staff',
 staff_id INTEGER,
 staff_name TEXT,
 payload TEXT NOT NULL,
 total INTEGER DEFAULT 0,
 hold_amount INTEGER DEFAULT 0,
 settlement_amount INTEGER DEFAULT 0,
 ting_amount INTEGER DEFAULT 0,
 balance_amount INTEGER DEFAULT 0,
 created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_settlement_archives_day ON settlement_archives(day);


/* v025 기존 DB 추가 열 - 1회 실행
ALTER TABLE jobs ADD COLUMN shop_name_snapshot TEXT;
*/
