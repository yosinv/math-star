// Test family only (never real names). Kid code 123456 → Tal, valid 60 minutes.
import { createHash } from 'node:crypto';
const h = (s) => createHash('sha256').update(s).digest('hex');
console.log(`INSERT INTO families (id, auth_user_id) VALUES ('fam1','user_prod_1');
INSERT INTO children (id, family_id, display_name, avatar_object_key, grade_band) VALUES ('c1','fam1','Tal','char:lion','4'),('c3','fam1','Noa','emoji:🦊','2');
CREATE TABLE IF NOT EXISTS kid_connect_codes (code_hash TEXT PRIMARY KEY, family_id TEXT NOT NULL, child_id TEXT NOT NULL, expires_at TEXT NOT NULL);
INSERT OR REPLACE INTO kid_connect_codes VALUES ('${h('kid-connect:123456')}','fam1','c1',datetime('now','+60 minutes'));`);
