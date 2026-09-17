const apiClient = require('../../utils/apiClient');
const { expectDbFieldsToMatch, expectDbFieldsToBeBlank } = require('../../utils/dbCompare');
const patientTemplate = require('../testdata/erdx_74752_tc_10.json');
const { buildPayloadFromTemplate } = require('../testdata/payloadHelpers');
const { buildExpectedVaccinationFields } = require('../testdata/vaccinationDataMapper');
const { initPool, closePool } = require('../db/connections');
const { fetchVaccinationDetailByCorrelationId } = require('../db/vaccinationDetailRepository');
const { fetchOrderItemByCorrelationId } = require('../db/erxOrderRepository');
const { TEST_TIMEOUT_MS } = require('../constants');

// The 6 deliberately invalid fields spread across separate VaccinationData groups.
const INVALID_FIELDS_COLUMNS = [
  'ADMINISTERING_SITE',
  'LOT_NUMBER',
  'SEROLOGY_RESULTS',
  'GUARDIAN_F_NAME',
  'LOCATION_ZIPCODE',
  'LOCATION_PHONE',
];

describe('NewRx Submission', () => {
  beforeAll(async () => {
    await initPool();
  });

  afterAll(async () => {
    await closePool();
  });

  it('TC10 — Mixed valid/invalid across multiple groups (isolation check)', async () => {
    try {
      const payload = buildPayloadFromTemplate(patientTemplate);
      const submitResponse = await apiClient.post('', payload);
      console.log('Submit Response Data:', submitResponse.data);

      // REQ-SUCCESS: the request as a whole succeeds despite the 6 invalid fields.
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

      // The 6 invalid fields persist blank rather than the sent (invalid) value.
      expectDbFieldsToBeBlank(row, INVALID_FIELDS_COLUMNS);

      // Every other field persists per its given valid value — failures are per-field, not
      // per-request or cascading to unrelated fields/groups.
      const expectedFieldsByColumn = buildExpectedVaccinationFields(payload.RxInformation[0].VaccinationData);
      const validFieldsByColumn = Object.fromEntries(
        Object.entries(expectedFieldsByColumn).filter(([column]) => !INVALID_FIELDS_COLUMNS.includes(column))
      );
      expectDbFieldsToMatch(row, validFieldsByColumn);
    } catch (error) {
      console.log('NewRx error response:', error.response?.data);
      throw error;
    }
  }, TEST_TIMEOUT_MS);
});
