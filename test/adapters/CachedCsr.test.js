const cachedCsr = require('../../lib/adapters/CachedCsr');
const cacheStub = require('../doubles/Cache');

describe('CachedCsr Tests', () => {

  let cache;

  beforeEach(() => {

    cache = cacheStub();
  });

  describe('When CSR not cached', () => {

    it('Then a new CSR is created', async () => {

      const expectedCsr = 'Not a real CSR, just testing';

      const csr = await cachedCsr.getCsrForThing(cache, 'a-thing-name');

      expect(csr).toEqual(expectedCsr);
    });
  });

  describe('When CSR is cached', () => {

    it('Then the cached CSR is returned', async () => {

      const expectedCsr = 'This is the cached CSR';
      const thingName = 'myThingy';

      cache.setCachedCsrHitForThing(thingName, expectedCsr);

      const csr = await cachedCsr.getCsrForThing(cache, thingName);

      expect(csr).toEqual(expectedCsr);
    });
  });

  describe('When there is an unrecoverable error accessing the cache', () => {

    it('Then an error is returned', async () => {

      try {

        cache.setupForUnrecoverableError();

        await cachedCsr.getCsrForThing(cache, 'not important for test');
      } catch (e) {
        return expect(e).toBeDefined();
      }

      // should only get here if test legitimately fails
      return expect(true).toBeFalsy();
    });
  });
});
