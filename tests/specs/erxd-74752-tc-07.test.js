const apiClient = require('../../utils/apiClient');
const { expectDbFieldsToMatch } = require('../../utils/dbCompare');
const patientTemplate = require('../testdata/erdx_74752_tc_07.json');
const { buildPayloadFromTemplate } = require('../testdata/payloadHelpers');
const { buildExpectedVaccinationFields } = require('../testdata/vaccinationDataMapper');
const { initPool, closePool } = require('../db/connections');
const { fetchVaccinationDetailByCorrelationId } = require('../db/vaccinationDetailRepository');
const { TEST_TIMEOUT_MS } = require('../constants');

describe('NewRx Submission', () => {
  beforeAll(async () => {
    await initPool();
  });

  afterAll(async () => {
    await closePool();
  });

  it('TC7 — REQ-SUCCESS: contradictory boolean flags, all three persist as Y simultaneously', async () => {
    try {
      const payload = buildPayloadFromTemplate(patientTemplate);
      // REQ-SUCCESS: the request must succeed even though PreviouslyAdministered, VaccinationRefusal,
      // and MissedAppointment are all true — the API does not enforce mutual exclusion between them.
      const submitResponse = await apiClient.post('', payload);
      console.log('Submit Response Data:', submitResponse.data);

      expect(submitResponse.status).toBe(200);
      expect(submitResponse.data.status).toBe('SUCCESS');
      expect(submitResponse.data.data[0].errors).toEqual([]);

      const { correlationId } = submitResponse.data;
      const expectedFieldsByColumn = buildExpectedVaccinationFields(payload.RxInformation[0].VaccinationData);

      const rows = await fetchVaccinationDetailByCorrelationId(correlationId);
      expect(rows.length).toBeGreaterThan(0);
      const [row] = rows;

      // Scope deviation if the API rejects the request or silently "corrects" any one flag instead
      // of persisting all three as sent — that would need to be raised, not treated as a defect here.
      expectDbFieldsToMatch(row, { REFUSAL: 'Y', MISSED_APT: 'Y', IS_ADMINISTERED: 'Y' });

      // No mutual-exclusion enforced by the API: all three flags persist as sent.
      expectDbFieldsToMatch(row, expectedFieldsByColumn);
      console.log('db_row', row);
      console.log('expectedFieldsByColumn', expectedFieldsByColumn);
    } catch (error) {
      console.log('NewRx error response:', error.response?.data);
      throw error;
    }
  }, TEST_TIMEOUT_MS);
});
