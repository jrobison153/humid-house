const cachedCsr = require('../adapters/CachedCsr');

const factory = () => {

  let defaultCsrAdapter = cachedCsr;

  return {

    /**
     * @return {object} the CSR Adapter. Default is CachedCsr
     */
    getDefaultCsrAdapter: () => {
      return defaultCsrAdapter;
    },

    /**
     * Restore the default CSR adapter. Default is CachedCsr
     */
    resetDefaultCsrAdapter: () => {
      defaultCsrAdapter = cachedCsr;
    },

    /**
     * set the CSR adapter. This adapter must implement CSR adapter interface.
     *
     * @param {object} adapter
     */
    setDefaultCsrAdapter: (adapter) => {
      defaultCsrAdapter = adapter;
    },
  };
};

module.exports = factory();
