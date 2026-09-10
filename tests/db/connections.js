const oracledb = require('oracledb');
const config = require('../../core/config/env');

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

let pool;

async function initPool() {
  if (!pool) {
    pool = await oracledb.createPool({
      user: config.db.user,
      password: config.db.password,
      connectString: config.db.connectString,
      poolMin: 1,
      poolMax: 5,
      poolIncrement: 1,
    });
  }
  return pool;
}

async function query(sql, params = []) {
  const conn = await pool.getConnection();
  try {
    const result = await conn.execute(sql, params);
    return result.rows;
  } finally {
    await conn.close();
  }
}

async function closePool() {
  if (pool) {
    await pool.close(0);
    pool = null;
  }
}

module.exports = { initPool, query, closePool };
