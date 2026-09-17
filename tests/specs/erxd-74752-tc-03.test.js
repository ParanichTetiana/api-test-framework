const apiClient = require('../../utils/apiClient');
const { expectDbFieldsToBeBlank } = require('../../utils/dbCompare');
const { TEST_TIMEOUT_MS } = require('../constants');
const patientTemplate = require('../testdata/erdx_74752_tc_03.json');
const { buildPayloadFromTemplate } = require('../testdata/payloadHelpers');
const { initPool, closePool } = require('../db/connections');
const { fetchVaccinationDetailByCorrelationId, VACCINATION_DETAIL_COLUMNS } = require('../db/vaccinationDetailRepository');
const { fetchOrderItemByCorrelationId } = require('../db/erxOrderRepository');

describe('NewRx Submission', () => {
  beforeAll(async () => {
    await initPool();
  });

  afterAll(async () => {
    await closePool();
  });

  it('TC3 — VaccinationData present but empty ({})', async () => {
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

      // Documented defaults for an empty VaccinationData block.
      const defaultsByColumn = { REFUSAL: 'N', MISSED_APT: 'N', IS_ADMINISTERED: 'N', VFC_STATUS: 'V01' };
      for (const [column, defaultValue] of Object.entries(defaultsByColumn)) {
        expect(row[column]).toBe(defaultValue);
      }

      // Every other field should persist as blank/null since no data was sent for it.
      const blankFields = VACCINATION_DETAIL_COLUMNS.filter((column) => !(column in defaultsByColumn));
      expectDbFieldsToBeBlank(row, blankFields);
    } catch (error) {
      console.log('NewRx error response:', error.response?.data);
      throw error;
    }
  }, TEST_TIMEOUT_MS);
});



