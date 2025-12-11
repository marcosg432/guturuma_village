// Wrapper para sql.js que simula a API do better-sqlite3
class SQLiteWrapper {
  constructor(db) {
    this.db = db;
  }

  prepare(sql) {
    const stmt = this.db.prepare(sql);
    return {
      run: (...params) => {
        stmt.run(params);
        return { lastInsertRowid: this.db.exec('SELECT last_insert_rowid()')[0].values[0][0] };
      },
      get: (...params) => {
        const result = stmt.getAsObject(params);
        return result || null;
      },
      all: (...params) => {
        return stmt.get(params).map(row => {
          const obj = {};
          stmt.getColumnNames().forEach((name, i) => {
            obj[name] = row[i];
          });
          return obj;
        });
      }
    };
  }

  exec(sql) {
    this.db.run(sql);
  }

  pragma(setting) {
    // SQL.js não suporta PRAGMA da mesma forma, mas podemos executar
    if (setting === 'foreign_keys = ON') {
      this.db.run('PRAGMA foreign_keys = ON');
    }
  }
}

module.exports = SQLiteWrapper;



