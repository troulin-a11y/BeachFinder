import { parseEEAResponse, classificationToGrade } from '../../src/api/waterQuality';

describe('classificationToGrade', () => {
  test('maps EEA classifications correctly', () => {
    expect(classificationToGrade('Excellent')).toBe('excellent');
    expect(classificationToGrade('Good')).toBe('good');
    expect(classificationToGrade('Sufficient')).toBe('sufficient');
    expect(classificationToGrade('Poor')).toBe('poor');
    expect(classificationToGrade('Unknown')).toBeNull();
  });
});

describe('parseEEAResponse', () => {
  test('parses EEA DISCODATA response', () => {
    const response = {
      results: [
        {
          classification: 'Excellent',
          ecoli: 45,
          enterococci: 28,
          year: 2025,
        },
      ],
    };
    const result = parseEEAResponse(response);
    expect(result).not.toBeNull();
    expect(result!.classification).toBe('excellent');
    expect(result!.ecoli).toBe(45);
    expect(result!.source).toBe('eea');
  });

  test('returns null for empty response', () => {
    expect(parseEEAResponse({ results: [] })).toBeNull();
  });
});
