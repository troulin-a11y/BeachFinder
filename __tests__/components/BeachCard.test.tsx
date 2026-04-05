import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BeachCard } from '../../src/components/BeachCard';
import type { EnrichedBeach } from '../../src/types';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

// Mock the fallback image require
jest.mock('../../assets/images/beach-fallback.jpg', () => 'beach-fallback.jpg');

const mockBeach: EnrichedBeach = {
  osmId: 'node/12345',
  name: 'Plage de Test',
  location: { latitude: 43.5, longitude: 3.5 },
  city: 'TestCity',
  distance: 2.5,
  tags: {
    blueFlag: true,
    dog: 'yes',
    wheelchair: false,
    supervised: true,
    surface: 'sand',
  },
  weather: {
    airTemp: 25,
    feelsLike: 26,
    windSpeed: 12,
    windDeg: 180,
    windDirection: 'S',
    uvIndex: 7,
    visibility: 10000,
    weatherIcon: '01d',
    weatherDesc: 'Clear sky',
    sunrise: 1625115600,
    sunset: 1625169600,
  },
  seaTemp: {
    temperature: 22.5,
    source: 'copernicus',
  },
  safety: {
    level: 'green',
    label: 'safety.green',
    reason: 'safety.greenDesc',
    source: 'computed',
  },
  photo: null,
  waterQuality: {
    classification: 'excellent',
    ecoli: 50,
    enterococci: 25,
    source: 'eea',
    year: 2024,
  },
  amenities: {
    showers: true,
    toilets: true,
    parking: true,
    accessible: false,
    lifeguard: true,
  },
  restaurants: [
    {
      name: 'Beach Cafe',
      type: 'cafe',
      distance: 100,
      location: { latitude: 43.501, longitude: 3.501 },
    },
  ],
  forecast: null,
};

describe('BeachCard', () => {
  it('renders beach name and city', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <BeachCard beach={mockBeach} onPress={onPress} />,
    );

    expect(getByText('Plage de Test')).toBeTruthy();
    // Distance + city
    expect(getByText(/2\.5 km/)).toBeTruthy();
  });

  it('displays sea temperature', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <BeachCard beach={mockBeach} onPress={onPress} />,
    );

    expect(getByText(/23°C/)).toBeTruthy(); // Math.round(22.5) = 23 (rounded)
  });

  it('displays air temperature', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <BeachCard beach={mockBeach} onPress={onPress} />,
    );

    expect(getByText(/25°C/)).toBeTruthy();
  });

  it('displays wind speed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <BeachCard beach={mockBeach} onPress={onPress} />,
    );

    expect(getByText(/12 km\/h/)).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <BeachCard beach={mockBeach} onPress={onPress} />,
    );

    fireEvent.press(getByText('Plage de Test'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders fallback text when no weather data', () => {
    const onPress = jest.fn();
    const beachNoWeather = { ...mockBeach, weather: null, seaTemp: null };
    const { getAllByText } = render(
      <BeachCard beach={beachNoWeather} onPress={onPress} />,
    );

    // Should show noData for each metric
    expect(getAllByText('errors.noData').length).toBeGreaterThanOrEqual(2);
  });
});
