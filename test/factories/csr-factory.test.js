const csrFactory = require('../../lib/factories/csr-factory');
const cachedCsr = require('../../lib/adapters/CachedCsr');
const csr = require('../doubles/Csr');

const DEFAULT_CSR_NAME = cachedCsr().name();

describe('csrFactory tests', () => {

  describe('When getting the default CSR adapter', () => {

    let defaultCsr;

    beforeEach(() => {
      defaultCsr = csrFactory.getDefaultCsrAdapter();
    });

    it('Then the AwsStackCsr object is returned', () => {
      expect(defaultCsr.name()).toEqual(DEFAULT_CSR_NAME);
    });

    it('Then the AWS SecretsManager version 2017-10-17 is the cache implementation', () => {
      expect(defaultCsr.cacheVersion()).toEqual('2017-10-17');
    });
  });

  describe('When CSR adapter is overridden', () => {

    it('Then the override is returned', () => {

      const csrDouble = csr();

      csrFactory.setDefaultCsrAdapter(csrDouble);

      const defaultCsr = csrFactory.getDefaultCsrAdapter();

      expect(defaultCsr.name()).toEqual(csrDouble.name());
    });
  });

  describe('Given the default CSR adapter has been overridden', () => {

    describe('When CSR adapter is reset', () => {

      it('Then the default CSR adapter is returned', () => {

        const csrDouble = csr();

        csrFactory.setDefaultCsrAdapter(csrDouble);

        csrFactory.resetDefaultCsrAdapter();

        const defaultCsr = csrFactory.getDefaultCsrAdapter();

        expect(defaultCsr().name()).toEqual(DEFAULT_CSR_NAME);
      });
    });
  });

  describe('When factory is created', () => {

    it('Then it is a singleton', () => {

      const csrDouble = csr;

      csrFactory.setDefaultCsrAdapter(csrDouble);

      const csrFactorySecondReference = require('../../lib/factories/csr-factory');

      const defaultCsr = csrFactorySecondReference.getDefaultCsrAdapter();

      expect(defaultCsr().name()).toEqual(csrDouble().name());
    });
  });
});
