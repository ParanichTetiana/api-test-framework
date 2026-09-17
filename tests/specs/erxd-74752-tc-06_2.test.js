const apiClient = require('../../utils/apiClient');
const { expectDbFieldsToMatch, expectDbFieldsToBeBlank, booleanToYesNo } = require('../../utils/dbCompare');
const { TEST_TIMEOUT_MS } = require('../constants');
const patientTemplate = require('../testdata/erdx_74752_tc_06_2.json');
const { buildPayloadFromTemplate } = require('../testdata/payloadHelpers');
const { initPool, closePool } = require('../db/connections');
const { fetchVaccinationDetailByCorrelationId } = require('../db/vaccinationDetailRepository');
const { fetchOrderItemByCorrelationId } = require('../db/erxOrderRepository');

// Values persist exactly as sent (no case normalization) when only the field values are uppercase.
const EXPECTED_FIELDS_BY_COLUMN_UPPERCASE_VALUES = {
  REFUSAL: booleanToYesNo(false),
  MISSED_APT: booleanToYesNo(false),
  IS_ADMINISTERED: booleanToYesNo(true),
  CONSENT_TO_REPORT: booleanToYesNo(true),
  ADMINISTERING_SITE: 'RD',
  ROUTE_OF_ADMINISTRATION: 'C28161',
  ADMINISTRATION_DATE: '08/14/2026',
  DOSE_NUMBER: '1',
  SERIES_COMPLETE: 'YES',
  LOT_NUMBER: 'FLU24A01',
  EXPIRATION_DATE: '08/14/2027',
  VTRCKS_PROVIDER_PIN: 'OH123456',
  COMORBIDITY_STATUS: 'NO',
  SEROLOGY_RESULTS: 'UNK',
  FUNDING_SOURCE: 'VXC1',
  VFC_STATUS: 'V03',
  TARGET_POPULATION: 'TPV65',
  PROVIDER_F_NAME: 'JOHN',
  PROVIDER_L_NAME: 'SMITH',
  PROVIDER_ID: '1234567890',
  LOCATION_TYPE: '17',
  LOCATION_ID: '1234567890',
  LOCATION_NAME: 'MAIN STREET PHARMACY',
  LOCATION_ADDRESS_1: '123 MAIN ST',
  LOCATION_ADDRESS_2: 'SUITE 200',
  LOCATION_ZIPCODE: '43085',
  LOCATION_CITY: 'COLUMBUS',
  LOCATION_STATE: 'OH',
  LOCATION_COUNTY_CODE: '39049',
  LOCATION_PHONE: '6145551212',
};

describe('NewRx Submission', () => {
  beforeAll(async () => {
    await initPool();
  });

  afterAll(async () => {
    await closePool();
  });

  it('TC6 — Field values sent entirely uppercase persist exactly as sent, everything else valid', async () => {
    try {
      const payload = buildPayloadFromTemplate(patientTemplate);
      const submitResponse = await apiClient.post('', payload);
      console.log('Submit Response Data:', submitResponse.data);

      expect(submitResponse.status).toBe(200);
      expect(submitResponse.data.status).toBe('SUCCESS');
      expect(submitResponse.data.data[0].errors).toEqual([]);

      const { correlationId } = submitResponse.data;

      // Confirms the legacy flow still processed the Rx as before.
      const orderItemRows = await fetchOrderItemByCorrelationId(correlationId);
      expect(orderItemRows.length).toBeGreaterThan(0);

      const vaccinationRows = await fetchVaccinationDetailByCorrelationId(correlationId);
      expect(vaccinationRows.length).toBeGreaterThan(0);
      const [row] = vaccinationRows;

      // Uppercase coded/text values are not case-normalized — they persist exactly as sent.
      expectDbFieldsToMatch(row, EXPECTED_FIELDS_BY_COLUMN_UPPERCASE_VALUES);

      // Suffix is matched against a case-sensitive code list — 'RPH' isn't recognized, so it persists blank.
      expectDbFieldsToBeBlank(row, ['ADMINISTERING_PROVIDER_SUFFIX']);
    } catch (error) {
      console.log('NewRx error response:', error.response?.data);
      throw error;
    }
  }, TEST_TIMEOUT_MS);
});



