const apiClient = require('../../utils/apiClient');
const { expectDbFieldsToMatch } = require('../../utils/dbCompare');
const { TEST_TIMEOUT_MS } = require('../constants');
const patientTemplate = require('../testdata/erdx_74752_tc_01.json');
const { buildExpectedVaccinationFields } = require('../testdata/vaccinationDataMapper');
const { buildPayloadFromTemplate } = require('../testdata/payloadHelpers');
const { initPool, closePool } = require('../db/connections');
const { fetchVaccinationDetailByCorrelationId } = require('../db/vaccinationDetailRepository');

describe('NewRx Submission', () => {
  beforeAll(async () => {
    await initPool();
  });

  afterAll(async () => {
    await closePool();
  });

  it('TC1_01 — Full valid payload (happy path round-trip)', async () => {
    try {
      const payload = buildPayloadFromTemplate(patientTemplate);
      const submitResponse = await apiClient.post('', payload);

      expect(submitResponse.status).toBe(200);
      console.log('Submit Response Data:', submitResponse.data);
      expect(submitResponse.data.status).toBe('SUCCESS');
      expect(submitResponse.data.data[0].errors).toEqual([]);

      const { correlationId } = submitResponse.data;
      const expectedFieldsByColumn = buildExpectedVaccinationFields(payload.RxInformation[0].VaccinationData);

      const rows = await fetchVaccinationDetailByCorrelationId(correlationId);
      expect(rows.length).toBeGreaterThan(0);
      expectDbFieldsToMatch(rows[0], expectedFieldsByColumn);
    } catch (error) {
      console.log('NewRx error response:', error.response?.data);
      throw error;
    }
  }, TEST_TIMEOUT_MS);
});
