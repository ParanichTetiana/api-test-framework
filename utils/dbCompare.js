function booleanToYesNo(value) {
  return value ? 'Y' : 'N';
}

// Oracle DATE columns come back as JS Date objects; normalize to MM/DD/YYYY to match payload dates.
function formatDbValue(value) {
  if (value instanceof Date) {
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${month}/${day}/${value.getFullYear()}`;
  }
  return String(value);
}

function expectDbFieldsToMatch(row, expectedFieldsByColumn) {
  for (const [column, expectedValue] of Object.entries(expectedFieldsByColumn)) {
    expect(formatDbValue(row[column])).toBe(String(expectedValue));
  }
}

function expectDbFieldsToBeBlank(row, columns) {
  for (const column of columns) {
    const value = row[column];
    if (!(value === null || value === '')) {
      throw new Error(`Expected column ${column} to be blank/null but got: ${JSON.stringify(value)}`);
    }
  }
}

module.exports = { booleanToYesNo, formatDbValue, expectDbFieldsToMatch, expectDbFieldsToBeBlank };
