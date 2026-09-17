const apiClient = require('../../utils/apiClient');
const { expectDbFieldsToMatch, expectDbFieldsToBeBlank } = require('../../utils/dbCompare');
const patientTemplate = require('../testdata/erdx_74752_tc_11.json');
const { buildPayloadFromTemplate } = require('../testdata/payloadHelpers');
const { initPool, closePool } = require('../db/connections');
const { fetchVaccinationDetailByCorrelationId, VACCINATION_DETAIL_COLUMNS } = require('../db/vaccinationDetailRepository');
const { fetchOrderItemByCorrelationId } = require('../db/erxOrderRepository');
const { TEST_TIMEOUT_MS } = require('../constants');

// Boolean flags are derived from truthy/falsy request values, not from coded-value validation,
// so they persist as Y regardless of every other field being unusable.
const BOOLEAN_FLAG_COLUMNS = ['REFUSAL', 'MISSED_APT', 'IS_ADMINISTERED', 'CONSENT_TO_REPORT'];

describe('NewRx Submission', () => {
  beforeAll(async () => {
    await initPool();
  });

  afterAll(async () => {
    await closePool();
  });

  it('TC11 — Every field invalid/unmappable (extreme case), well-formed JSON', async () => {
    try {
      const payload = buildPayloadFromTemplate(patientTemplate);
      const submitResponse = await apiClient.post('', payload);
      console.log('Submit Response Data:', submitResponse.data);

      // REQ-SUCCESS: the request succeeds despite essentially every field being unusable.
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

      // Boolean flags persist Y regardless of the invalid data elsewhere.
      expectDbFieldsToMatch(row, {
        REFUSAL: 'Y',
        MISSED_APT: 'Y',
        IS_ADMINISTERED: 'Y',
        CONSENT_TO_REPORT: 'Y',
      });

      // VfcStatus was present-but-invalid (not omitted), so it persists blank here rather than
      // falling back to its V01 default — contrast with TC8, where omission triggers the default.
      // Every other non-boolean field is likewise unusable and persists blank.
      const blankColumns = VACCINATION_DETAIL_COLUMNS.filter((column) => !BOOLEAN_FLAG_COLUMNS.includes(column));
      expectDbFieldsToBeBlank(row, blankColumns);
    } catch (error) {
      console.log('NewRx error response:', error.response?.data);
      throw error;
    }
  }, TEST_TIMEOUT_MS);
});
