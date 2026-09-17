const { query } = require('./connections');
const { DB_QUERY_MAX_ATTEMPTS, DB_QUERY_RETRY_DELAY_MS } = require('../constants');

// Retries because the write pipeline may take a moment to persist before the row is queryable.
async function fetchOrderItemByCorrelationId(correlationId) {
  let rows = [];
  for (let attemptNumber = 0; attemptNumber < DB_QUERY_MAX_ATTEMPTS && rows.length === 0; attemptNumber += 1) {
    if (attemptNumber > 0) {
      await new Promise((resolve) => setTimeout(resolve, DB_QUERY_RETRY_DELAY_MS));
    }
    rows = await query(
      `SELECT eo.EREFERRAL_ORDER_NUM, ei.RX_RECORD_NUM
       FROM TREXONE_DATA.EREFERRAL_ORDER eo
       JOIN TREXONE_DATA.EREFERRAL_ITEM ei ON ei.EREFERRAL_ORDER_NUM = eo.EREFERRAL_ORDER_NUM
       WHERE eo.CORRELATION_ID = :correlationId`,
      [correlationId]
    );
  }
  return rows;
}

module.exports = { fetchOrderItemByCorrelationId };
