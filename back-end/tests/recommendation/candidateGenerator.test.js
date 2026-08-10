const { inferCategory } = require('../../src/services/scraping/productMapper');

describe('Category Verification & Scraper Candidate Filtering', () => {
  test('inferCategory correctly identifies Air Conditioner and appliances', () => {
    expect(inferCategory('Carrier Air Conditioner 1.5 HP Split AC')).toBe('Air Conditioner');
    expect(inferCategory('LG Inverter AC 2.25 HP')).toBe('Air Conditioner');
    expect(inferCategory('مكيف هواء ميراكو كاريير')).toBe('Air Conditioner');
    expect(inferCategory('BAGGEBO Bookcase White')).toBe('Bookshelf');
    expect(inferCategory('GILLERSBERG Bedside Table')).toBe('Side Table');
  });

  test('filters out mismatched scraped categories like Bookshelves for Air Conditioner', () => {
    const requestedCategory = 'Air Conditioner';
    const mockScrapedProducts = [
      {
        title: 'BAGGEBO - مكتبة أبيض',
        classification: { canonicalCategory: 'Bookshelf' },
        pricing: { currentPrice: 2795 },
        images: [{ url: 'https://example.com/baggebo.jpg' }],
      },
      {
        title: 'GILLERSBERG - طاولة سرير',
        classification: { canonicalCategory: 'Nightstand' },
        pricing: { currentPrice: 3495 },
        images: [{ url: 'https://example.com/gillersberg.jpg' }],
      },
      {
        title: 'Sharp Split Air Conditioner 1.5 HP',
        classification: { canonicalCategory: 'Air Conditioner' },
        pricing: { currentPrice: 14500 },
        images: [{ url: 'https://example.com/ac.jpg' }],
      },
    ];

    const filtered = mockScrapedProducts.filter((p) => {
      const pCat = p.classification?.canonicalCategory || '';
      if (pCat && pCat !== 'Furniture' && pCat !== requestedCategory) {
        return false;
      }
      return true;
    });

    expect(filtered.length).toBe(1);
    expect(filtered[0].title).toBe('Sharp Split Air Conditioner 1.5 HP');
  });
});
