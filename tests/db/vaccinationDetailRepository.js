const { query } = require('./connections');
const { DB_QUERY_MAX_ATTEMPTS, DB_QUERY_RETRY_DELAY_MS } = require('../constants');

const VACCINATION_DETAIL_COLUMNS = [
  'REFUSAL',
  'MISSED_APT',
  'IS_ADMINISTERED',
  'ADMINISTERING_SITE',
  'ROUTE_OF_ADMINISTRATION',
  'ADMINISTRATION_DATE',
  'CONSENT_TO_REPORT',
  'DOSE_NUMBER',
  'SERIES_COMPLETE',
  'LOT_NUMBER',
  'EXPIRATION_DATE',
  'VTRCKS_PROVIDER_PIN',
  'COMORBIDITY_STATUS',
  'SEROLOGY_RESULTS',
  'FUNDING_SOURCE',
  'VFC_STATUS',
  'TARGET_POPULATION',
  'GUARDIAN_F_NAME',
  'GUARDIAN_L_NAME',
  'GUARDIAN_RELATION',
  'PROVIDER_F_NAME',
  'PROVIDER_L_NAME',
  'PROVIDER_ID',
  'ADMINISTERING_PROVIDER_SUFFIX',
  'LOCATION_TYPE',
  'LOCATION_ID',
  'LOCATION_NAME',
  'LOCATION_ADDRESS_1',
  'LOCATION_ADDRESS_2',
  'LOCATION_ZIPCODE',
  'LOCATION_CITY',
  'LOCATION_STATE',
  'LOCATION_COUNTY_CODE',
  'LOCATION_PHONE',
];

// Retries because the write pipeline may take a moment to persist before the row is queryable.
async function fetchVaccinationDetailByCorrelationId(correlationId) {
  let rows = [];
  for (let attemptNumber = 0; attemptNumber < DB_QUERY_MAX_ATTEMPTS && rows.length === 0; attemptNumber += 1) {
    if (attemptNumber > 0) {
      await new Promise((resolve) => setTimeout(resolve, DB_QUERY_RETRY_DELAY_MS));
    }
    rows = await query(
      `SELECT ${VACCINATION_DETAIL_COLUMNS.map((column) => `vd.${column}`).join(', ')}
       FROM TREXONE_DATA.EREFERRAL_ORDER eo
       JOIN TREXONE_DATA.EREFERRAL_ITEM ei ON ei.EREFERRAL_ORDER_NUM = eo.EREFERRAL_ORDER_NUM
       JOIN TREXONE_DATA.VACCINATION_DETAIL vd ON vd.RX_RECORD_NUM = ei.RX_RECORD_NUM
       WHERE eo.CORRELATION_ID = :correlationId`,
      [correlationId]
    );
  }
  return rows;
}

module.exports = { fetchVaccinationDetailByCorrelationId, VACCINATION_DETAIL_COLUMNS };
