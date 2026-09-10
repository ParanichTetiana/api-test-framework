const { randomUUID } = require('crypto');

function buildNewRxPayload() {
  return {
    Metadata: {
      CorrelationId: randomUUID(),
      SourceId: 'VAPI',
      MessageType: 'NewRx',
      OriginCode: 'Electronic',
    },
    Pharmacy: {
      NcpdpNumber: '4512895',
      NPI: '1295786432',
    },
    Patient: {
      Addresses: [
        {
          Type: 'Home',
          Line1: '444 PARK AVE 8',
          Line2: '',
          City: 'NEW YORK',
          State: 'NY',
          ZipCode: '10016',
        },
      ],
      Phones: [
        {
          Type: 'Home',
          Number: '2125874123',
        },
      ],
      AdditionalInformation: [],
      FirstName: 'ADA',
      LastName: 'SHELBY',
      DateOfBirth: '08/10/2010',
      Gender: 'F',
      SocialSecurityNumber: '',
      EmailAddress: '',
      Race: [],
      Ethnicity: '',
      ExistingPatient: true,
    },
    Physician: {
      FacilityName: 'PEAKY_BLINDERS',
      Sln: '',
      SlnState: 'NJ',
      SlnExpirationDate: '',
      Dea: '',
      Npi: '1053857706',
      Specialty: '',
      Addresses: [
        {
          Type: 'Office',
          Line1: '350W 50TH ST',
          Line2: '',
          City: 'NEW YORK',
          State: 'NY',
          ZipCode: '10019',
        },
      ],
      Phones: [
        {
          Type: 'Work',
          Number: '2125478635',
          Extension: '',
        },
      ],
      Faxes: [
        {
          Type: 'Work',
          Number: '2125478635',
          Extension: null,
        },
      ],
      ContactFirstName: '',
      ContactLastName: '',
      ContactPhone: null,
      ContactFax: null,
      FirstName: 'ARTHUR',
      LastName: 'SHELBY',
      MiddleInitial: null,
      DateOfBirth: '',
      Gender: null,
      EmailAddress: null,
      Prefix: null,
      Suffix: null,
    },
    RxInformation: [
      {
        RxType: 'NewRx',
        Ndc: '58160088452',
        ProductName: 'FLUARIX TRIVALENT',
        QuantityWritten: '1',
        DaysSupply: 30,
        RefillsWritten: '2',
        RxWrittenDate: '09/03/2026',
        NeedDate: '09/11/2026',
        QuantityDispensed: '',
        Directions: 'INJ 0.5ML IM X1 DOSE',
        PromiseTime: '09/03/2026 09:45 AM -0700',
        AdditionalInformation: [
          { Key: 'test1', Value: 'value1' },
          { Key: 'test2', Value: 'value2' },
        ],
        "VaccinationData": {
        "Administration": {
          // "ConsentToReport": true,
          // "VaccinationRefusal": false,
          // "MissedAppointment": false,
          "PreviouslyAdministered": true,
          "AdministeringSite": "LD", // +
          "RouteOfAdministration": "C28161", // +
          // "AdministrationDate": "08/14/2026"
        },
        "VaccineProduct": {
          "DoseNumber": "1", // +
          "VaccinationSeriesComplete": "NO", // +
          // "LotNumber": "FLU24A01",
          // "ExpirationDate": "08/14/2027"
        },
        "PublicHealthReporting": {
          // "VTrckSProviderPin": "OH123456",
          "ComorbidityStatus": "NO", // +
          "SerologyResults": "NO", // +
          "FundingSource": "PHC70", // +
          "VfcStatus": "V01", // +
          "TargetPopulation": "TPV1" // +
        },
          "Guardian": {
            // "FirstName": "Jane",
            // "LastName": "Doe",
            "Relationship": "FTH" // +
          },
        "AdministeringProvider": {
          // "FirstName": "John",
          // "LastName": "Smith",
          // "Id": "1234567890",
          "Suffix": "RPh" // +
        },
        "AdministeringLocation": {
          "LocationType": "17", // +
          // "LocationId": "1234567890",
          // "LocationName": "Main Street Pharmacy",
          // "LocationAddress": {
          //   "Line1": "123 Main St",
          //   "Line2": "Suite 2",
          //   "ZipCode": "43085",
          //   "City": "Columbus",
          //   "State": "OH",
          //   "County": "39049"
          // },
          // "LocationPhone": "6145551212"
        },
      },
      },
    ],
  };
}

module.exports = { buildNewRxPayload };
