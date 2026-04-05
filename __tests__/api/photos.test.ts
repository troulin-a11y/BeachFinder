import { parseWikimediaPhotos, parseFlickrPhotos, buildFallbackPhoto } from '../../src/api/photos';

describe('parseWikimediaPhotos', () => {
  test('extracts image URL from geosearch response', () => {
    const response = {
      query: {
        geosearch: [
          { pageid: 123, title: 'File:Beach.jpg', lat: 43.5, lon: 7.1, dist: 100 },
        ],
      },
    };
    const result = parseWikimediaPhotos(response);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('File:Beach.jpg');
  });

  test('returns empty for no results', () => {
    expect(parseWikimediaPhotos({ query: { geosearch: [] } })).toHaveLength(0);
    expect(parseWikimediaPhotos({})).toHaveLength(0);
  });
});

describe('parseFlickrPhotos', () => {
  test('builds photo URL from Flickr response', () => {
    const response = {
      photos: {
        photo: [
          { id: '1', secret: 'abc', server: '65535', farm: 66, title: 'Beach sunset', owner: 'user1' },
        ],
      },
    };
    const result = parseFlickrPhotos(response);
    expect(result).toHaveLength(1);
    expect(result[0].url).toContain('staticflickr.com');
    expect(result[0].attribution).toContain('user1');
  });
});

describe('buildFallbackPhoto', () => {
  test('returns fallback with isFallback true', () => {
    const result = buildFallbackPhoto();
    expect(result.isFallback).toBe(true);
    expect(result.source).toBe('fallback');
  });
});
