const apiClient = require('../../utils/apiClient');
const { expectDbFieldsToMatch, expectDbFieldsToBeBlank } = require('../../utils/dbCompare');
const patientTemplate = require('../testdata/erdx_74752_tc_09.json');
const { buildPayloadFromTemplate } = require('../testdata/payloadHelpers');
const { buildExpectedVaccinationFields } = require('../testdata/vaccinationDataMapper');
const { initPool, closePool } = require('../db/connections');
const { fetchVaccinationDetailByCorrelationId } = require('../db/vaccinationDetailRepository');
const { fetchOrderItemByCorrelationId } = require('../db/erxOrderRepository');
const { TEST_TIMEOUT_MS } = require('../constants');

const GUARDIAN_COLUMNS = ['GUARDIAN_F_NAME', 'GUARDIAN_L_NAME', 'GUARDIAN_RELATION'];

describe('NewRx Submission', () => {
  beforeAll(async () => {
    await initPool();
  });

  afterAll(async () => {
    await closePool();
  });

  it('TC9 — Guardian fields omitted for a patient under 18', async () => {
    try {
      const payload = buildPayloadFromTemplate(patientTemplate);
      const submitResponse = await apiClient.post('', payload);
      console.log('Submit Response Data:', submitResponse.data);

      // REQ-SUCCESS: no rejection or error for the missing Guardian data despite the patient being a minor.
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
      console.log('Vaccination Row:', row);

      // All three Guardian fields persist blank since no Guardian block was sent.
      expectDbFieldsToBeBlank(row, GUARDIAN_COLUMNS);

      // Every other field should still persist per baseline.
      const expectedFieldsByColumn = buildExpectedVaccinationFields(payload.RxInformation[0].VaccinationData);
      expectDbFieldsToMatch(row, expectedFieldsByColumn);
    } catch (error) {
      console.log('NewRx error response:', error.response?.data);
      throw error;
    }
  }, TEST_TIMEOUT_MS);
});
