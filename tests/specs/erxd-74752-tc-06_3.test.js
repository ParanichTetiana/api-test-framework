const apiClient = require('../../utils/apiClient');
const { expectDbFieldsToMatch, booleanToYesNo } = require('../../utils/dbCompare');
const { TEST_TIMEOUT_MS } = require('../constants');
const patientTemplate = require('../testdata/erdx_74752_tc_06_3.json');
const { buildPayloadFromTemplate } = require('../testdata/payloadHelpers');
const { initPool, closePool } = require('../db/connections');
const { fetchVaccinationDetailByCorrelationId } = require('../db/vaccinationDetailRepository');
const { fetchOrderItemByCorrelationId } = require('../db/erxOrderRepository');

// Every value in the payload is sent with leading/trailing whitespace; expected values here are trimmed.
const EXPECTED_FIELDS_BY_COLUMN_TRIMMED = {
  REFUSAL: booleanToYesNo(false),
  MISSED_APT: booleanToYesNo(false),
  IS_ADMINISTERED: booleanToYesNo(true),
  CONSENT_TO_REPORT: booleanToYesNo(true),
  ADMINISTERING_SITE: 'LD',
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
  PROVIDER_F_NAME: 'John',
  PROVIDER_L_NAME: 'Smith',
  PROVIDER_ID: '1234567890',
  ADMINISTERING_PROVIDER_SUFFIX: 'RPh',
  LOCATION_TYPE: '17',
  LOCATION_ID: '1234567890',
  LOCATION_NAME: 'Main Street Pharmacy',
  LOCATION_ADDRESS_1: '123 Main St',
  LOCATION_ADDRESS_2: 'Suite 200',
  LOCATION_ZIPCODE: '43085',
  LOCATION_CITY: 'Columbus',
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

  it('TC6.5 — Leading/trailing whitespace on every field is trimmed before validation and CTM mapping', async () => {
    try {
      const payload = buildPayloadFromTemplate(patientTemplate);
      const submitResponse = await apiClient.post('', payload);
      console.log('Submit Response Data:', submitResponse.data);

      // The request (and each whitespace-padded field within it) is not rejected solely due to
      // leading/trailing whitespace.
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

      // Whitespace is trimmed before validation/CTM code mapping, so the trimmed value persists.
      expectDbFieldsToMatch(row, EXPECTED_FIELDS_BY_COLUMN_TRIMMED);
    } catch (error) {
      console.log('NewRx error response:', error.response?.data);
      throw error;
    }
  }, TEST_TIMEOUT_MS);
});

