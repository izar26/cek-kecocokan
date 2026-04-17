import { DatabaseSync } from 'node:sqlite';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const testDbPath = join(__dirname, 'test.db');

try {
  const db = new DatabaseSync(testDbPath);
  db.exec('CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, val TEXT)');
  const insert = db.prepare('INSERT INTO test (val) VALUES (?)');
  insert.run('hello');
  const rows = db.prepare('SELECT * FROM test').all();
  console.log('Test result:', rows);
  console.log('SUCCESS');
} catch (err) {
  console.error('Test failed:', err);
  process.exit(1);
}
