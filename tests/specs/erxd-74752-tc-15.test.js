const apiClient = require('../../utils/apiClient');
const { expectDbFieldsToMatch, expectDbFieldsToBeBlank } = require('../../utils/dbCompare');
const patientTemplate = require('../testdata/erdx_74752_tc_15.json');
const { buildPayloadFromTemplate } = require('../testdata/payloadHelpers');
const { initPool, closePool } = require('../db/connections');
const { fetchVaccinationDetailByCorrelationId, VACCINATION_DETAIL_COLUMNS } = require('../db/vaccinationDetailRepository');
const { fetchOrderItemByCorrelationId } = require('../db/erxOrderRepository');
const { TEST_TIMEOUT_MS } = require('../constants');

// Boolean flags are derived from truthy/falsy request values, not from coded-value validation,
// so they persist as Y regardless of every other rotatable field being invalid.
const VALID_COLUMNS = ['REFUSAL', 'MISSED_APT', 'IS_ADMINISTERED', 'CONSENT_TO_REPORT', 'ADMINISTERING_SITE'];

describe('NewRx Submission', () => {
  beforeAll(async () => {
    await initPool();
  });

  afterAll(async () => {
    await closePool();
  });

  it('TC15 — Only AdministeringSite valid, all other rotatable fields invalid', async () => {
    try {
      const payload = buildPayloadFromTemplate(patientTemplate);
      const submitResponse = await apiClient.post('', payload);
      console.log('Submit Response Data:', submitResponse.data);

      // REQ-SUCCESS: the request succeeds despite every other rotatable field being invalid.
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

      // AdministeringSite persists its valid value; boolean flags persist Y regardless of
      // validity elsewhere — proves per-field validation isn't skipped once an earlier field fails.
      expectDbFieldsToMatch(row, {
        ADMINISTERING_SITE: 'LD',
        REFUSAL: 'Y',
        MISSED_APT: 'Y',
        IS_ADMINISTERED: 'Y',
        CONSENT_TO_REPORT: 'Y',
      });

      // Every other rotatable field is invalid and persists blank.
      const blankColumns = VACCINATION_DETAIL_COLUMNS.filter((column) => !VALID_COLUMNS.includes(column));
      expectDbFieldsToBeBlank(row, blankColumns);
    } catch (error) {
      console.log('NewRx error response:', error.response?.data);
      throw error;
    }
  }, TEST_TIMEOUT_MS);
});
