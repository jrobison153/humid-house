const cachedCsr = require('../../lib/adapters/CachedCsr');
const cache = require('../doubles/Cache');
const fs = require('../doubles/fs');
const process = require('../doubles/process');

describe('CachedCsr Tests', () => {

  let cacheStub;
  let fsSpy;
  let processSpy;
  let csr;

  beforeEach(() => {

    cacheStub = cache();
    csr = cachedCsr(cacheStub);

    // TODO: not sure how I like one stub depending on another. Not a pattern I can recall ever having used before.
    fsSpy = fs();
    processSpy = process(fsSpy);
  });

  describe('When CSR not cached', () => {

    it('Then a new CSR is created', async () => {

      const expectedCsr = 'not a real CSR, just testing';

      processSpy.dataToWriteToFileForSpawn(
          csr.csrCreationCommand(),
          csr.csrCreationArgs(),
          csr.outCsrFileName(),
          expectedCsr,
      );

      const csrData = await csr.getCsrForThing(processSpy, fsSpy, 'a-thing-name');

      expect(csrData).toEqual(expectedCsr);
    });

    it('Then multiple calls to a CSR for different Things returns different CSRs', async () => {

      processSpy.dataToWriteToFileForSpawn(
          csr.csrCreationCommand(),
          csr.csrCreationArgs(),
          csr.outCsrFileName(),
          'I am the first csr',
      );

      const firstCsr = await csr.getCsrForThing(processSpy, fsSpy, 'a-thing-name');

      processSpy.clearDataToWrite();

      processSpy.dataToWriteToFileForSpawn(
          csr.csrCreationCommand(),
          csr.csrCreationArgs(),
          csr.outCsrFileName(),
          'I am the second csr',
      );

      const secondCsr = await csr.getCsrForThing(processSpy, fsSpy, 'another-thing-name');

      expect(firstCsr).not.toEqual(secondCsr);
    });

    it('Then the correct command is run to create the CSR', async () => {

      await csr.getCsrForThing(processSpy, fsSpy, 'a-thing-name');

      const actualCommand = processSpy.command();
      const expectedCommand = csr.csrCreationCommand();

      expect(actualCommand).toEqual(expectedCommand);
    });

    it('Then the correct args are passed to the command when creating the CSR', async () => {

      await csr.getCsrForThing(processSpy, fsSpy, 'a-thing-name');

      const actualArgs = processSpy.args();
      const expectedArgs = csr.csrCreationArgs();

      expect(actualArgs).toEqual(expectedArgs);
    });

    it('Then the CSR file created is read with the correct options', async () => {

      await csr.getCsrForThing(processSpy, fsSpy, 'a-thing-name');

      expect(fsSpy.readFileOptions()).toEqual('utf8');
    });

    it('Then the newly created CSR is cached with the correct key', async () => {

      const expectedCsr = 'not a real CSR, just testing';

      processSpy.dataToWriteToFileForSpawn(
          csr.csrCreationCommand(),
          csr.csrCreationArgs(),
          csr.outCsrFileName(),
          expectedCsr,
      );

      await csr.getCsrForThing(processSpy, fsSpy, 'a-thing-name');

      const cachedValue = cacheStub.getCachedEntryForKey('a-thing-name-identity');

      const parsedCachedValue = JSON.parse(cachedValue);

      expect(parsedCachedValue.csr).toEqual(expectedCsr);
    });

    it('Then the newly created CSR associated private key is cached with the correct key', async () => {

      const expectedPrivateKey = 'not a real private key, just testing';

      processSpy.dataToWriteToFileForSpawn(
          csr.csrCreationCommand(),
          csr.csrCreationArgs(),
          csr.privateKeyFileName(),
          expectedPrivateKey,
      );

      await csr.getCsrForThing(processSpy, fsSpy, 'a-thing-name');

      const cachedValue = cacheStub.getCachedEntryForKey('a-thing-name-identity');

      const parsedCachedValue = JSON.parse(cachedValue);

      expect(parsedCachedValue.privateKey).toEqual(expectedPrivateKey);
    });

    describe('And there is an error generating the CSR', () => {

      it('Then an error is returned with stderr data for the issue', async () => {

        const stderr = 'I failed you on creation of the CSR!';

        try {

          processSpy.setupForUnrecoverableError(stderr);

          await csr.getCsrForThing(processSpy, fsSpy, 'not important for test');
        } catch (e) {
          const expression = new RegExp(`.*${stderr}.*`);

          return expect(e.toString()).toMatch(expression);
        }

        // should only get here if test legitimately fails
        return expect(true).toBeFalsy();
      });
    });

    describe('And there is an error reading the CSR', () => {

      it('Then an error is returned with error info for the issue', async () => {

        const errText = 'I failed you on CSR read!';

        try {

          fsSpy.setupForUnrecoverableError(errText);

          await csr.getCsrForThing(processSpy, fsSpy, 'not important for test');
        } catch (e) {
          const expression = new RegExp(`.*${errText}.*`);

          return expect(e.toString()).toMatch(expression);
        }

        // should only get here if test legitimately fails
        return expect(true).toBeFalsy();
      });
    });
  });

  describe('When CSR is cached', () => {

    it('Then the cached CSR is returned', async () => {

      const expectedCsr = 'This is the cached CSR';
      const identity = {
        csr: expectedCsr,
        privateKey: '',
      };

      const thingName = 'myThingy';

      cacheStub.setCachedCsrHitForThing(`${thingName}-identity`, JSON.stringify(identity));

      const csrText = await csr.getCsrForThing(processSpy, fsSpy, thingName);

      expect(csrText).toEqual(expectedCsr);
    });
  });

  describe('When there is an unrecoverable error accessing the cache', () => {

    it('Then an error is returned', async () => {

      try {

        cacheStub.setupGetForUnrecoverableError();

        await csr.getCsrForThing(processSpy, fsSpy, 'not important for test');
      } catch (e) {
        return expect(e.toString()).toMatch(/.*Unrecoverable error attempting to get CSR from cache.*/);
      }

      // should only get here if test legitimately fails
      return expect(true).toBeFalsy();
    });
  });

  describe('When there is an unrecoverable error putting the data into the cache', () => {

    it('Then an error is returned', async () => {

      try {

        cacheStub.setupPutForUnrecoverableError();

        await csr.getCsrForThing(processSpy, fsSpy, 'not important for test');
      } catch (e) {
        return expect(e.toString()).toMatch(/.*Unrecoverable error attempting to put CSR in cache.*/);
      }

      // should only get here if test legitimately fails
      return expect(true).toBeFalsy();
    });
  });
});
