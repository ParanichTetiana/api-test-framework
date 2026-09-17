const apiClient = require('../../utils/apiClient');
const { expectDbFieldsToMatch, booleanToYesNo } = require('../../utils/dbCompare');
const { TEST_TIMEOUT_MS } = require('../constants');
const patientTemplate = require('../testdata/erdx_74752_tc_06_1.json');
const { buildPayloadFromTemplate } = require('../testdata/payloadHelpers');
const { initPool, closePool } = require('../db/connections');
const { fetchVaccinationDetailByCorrelationId } = require('../db/vaccinationDetailRepository');
const { fetchOrderItemByCorrelationId } = require('../db/erxOrderRepository');

// Values persist exactly as sent (no case normalization) when only the field values are lowercase.
const EXPECTED_FIELDS_BY_COLUMN_LOWERCASE_VALUES = {
  REFUSAL: booleanToYesNo(false),
  MISSED_APT: booleanToYesNo(false),
  IS_ADMINISTERED: booleanToYesNo(true),
  CONSENT_TO_REPORT: booleanToYesNo(true),
  ADMINISTERING_SITE: 'ld',
  ROUTE_OF_ADMINISTRATION: 'c28161',
  ADMINISTRATION_DATE: '08/14/2026',
  DOSE_NUMBER: '1',
  SERIES_COMPLETE: 'yes',
  LOT_NUMBER: 'flu24a01',
  EXPIRATION_DATE: '08/14/2027',
  VTRCKS_PROVIDER_PIN: 'oh123456',
  COMORBIDITY_STATUS: 'no',
  SEROLOGY_RESULTS: 'unk',
  FUNDING_SOURCE: 'vxc1',
  VFC_STATUS: 'v03',
  TARGET_POPULATION: 'tpv65',
  PROVIDER_F_NAME: 'john',
  PROVIDER_L_NAME: 'smith',
  PROVIDER_ID: '1234567890',
  ADMINISTERING_PROVIDER_SUFFIX: 'rph',
  LOCATION_TYPE: '17',
  LOCATION_ID: '1234567890',
  LOCATION_NAME: 'main street pharmacy',
  LOCATION_ADDRESS_1: '123 main st',
  LOCATION_ADDRESS_2: 'suite 200',
  LOCATION_ZIPCODE: '43085',
  LOCATION_CITY: 'columbus',
  LOCATION_STATE: 'oh',
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

  it('TC6 — Field values sent entirely lowercase persist exactly as sent, everything else valid', async () => {
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

      // Lowercase coded/text values are not case-normalized — they persist exactly as sent.
      expectDbFieldsToMatch(row, EXPECTED_FIELDS_BY_COLUMN_LOWERCASE_VALUES);
    } catch (error) {
      console.log('NewRx error response:', error.response?.data);
      throw error;
    }
  }, TEST_TIMEOUT_MS);
});
