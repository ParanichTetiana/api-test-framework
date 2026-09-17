const { booleanToYesNo } = require('../../utils/dbCompare');

// NOTE: verified against the actual VACCINATION_DETAIL table. Patient/Pharmacy/Rx-level
// fields (e.g. NCPDP number, NDC, patient name/DOB) live in other tables not yet confirmed.
function buildExpectedVaccinationFields(vaccinationData) {
  const { Administration, VaccineProduct, PublicHealthReporting, Guardian, AdministeringProvider, AdministeringLocation } =
    vaccinationData;

  const expectedFieldsByColumn = {
    REFUSAL: booleanToYesNo(Administration.VaccinationRefusal),
    MISSED_APT: booleanToYesNo(Administration.MissedAppointment),
    IS_ADMINISTERED: booleanToYesNo(Administration.PreviouslyAdministered),
    ADMINISTERING_SITE: Administration.AdministeringSite,
    ROUTE_OF_ADMINISTRATION: Administration.RouteOfAdministration,
    ADMINISTRATION_DATE: Administration.AdministrationDate,
    CONSENT_TO_REPORT: booleanToYesNo(Administration.ConsentToReport),
    DOSE_NUMBER: VaccineProduct.DoseNumber,
    SERIES_COMPLETE: VaccineProduct.VaccinationSeriesComplete,
    LOT_NUMBER: VaccineProduct.LotNumber,
    EXPIRATION_DATE: VaccineProduct.ExpirationDate,
    VTRCKS_PROVIDER_PIN: PublicHealthReporting.VTrckSProviderPin,
    COMORBIDITY_STATUS: PublicHealthReporting.ComorbidityStatus,
    SEROLOGY_RESULTS: PublicHealthReporting.SerologyResults,
    FUNDING_SOURCE: PublicHealthReporting.FundingSource,
    VFC_STATUS: PublicHealthReporting.VfcStatus,
    TARGET_POPULATION: PublicHealthReporting.TargetPopulation,
    PROVIDER_F_NAME: AdministeringProvider.FirstName,
    PROVIDER_L_NAME: AdministeringProvider.LastName,
    PROVIDER_ID: AdministeringProvider.Id,
    ADMINISTERING_PROVIDER_SUFFIX: AdministeringProvider.Suffix,
    LOCATION_TYPE: AdministeringLocation.LocationType,
    LOCATION_ID: AdministeringLocation.LocationId,
    LOCATION_NAME: AdministeringLocation.LocationName,
    LOCATION_ADDRESS_1: AdministeringLocation.LocationAddress.Line1,
    LOCATION_ADDRESS_2: AdministeringLocation.LocationAddress.Line2,
    LOCATION_ZIPCODE: AdministeringLocation.LocationAddress.ZipCode,
    LOCATION_CITY: AdministeringLocation.LocationAddress.City,
    LOCATION_STATE: AdministeringLocation.LocationAddress.State,
    LOCATION_COUNTY_CODE: AdministeringLocation.LocationAddress.County,
    LOCATION_PHONE: AdministeringLocation.LocationPhone,
  };

  // Guardian is only present on payloads for patients under 18.
  if (Guardian) {
    expectedFieldsByColumn.GUARDIAN_F_NAME = Guardian.FirstName;
    expectedFieldsByColumn.GUARDIAN_L_NAME = Guardian.LastName;
    expectedFieldsByColumn.GUARDIAN_RELATION = Guardian.Relationship;
  }

  return expectedFieldsByColumn;
}

module.exports = { buildExpectedVaccinationFields };
