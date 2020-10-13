module.exports = (existingStackName, expectedCsr) => {

  return {

    /**
     * Returns a CSR that can be used to sign certificates
     *
     * @param {object} cache - see Csr.js for cache interface specification
     * @param {string} thingName - name of the thing whose CSR we are looking up or creating
     *
     * @return {Promise<string>} - the CSR as a string
     */
    getCsrForThing: async (cache, thingName) => expectedCsr,

    name: () => 'CSR Test Double',
  };
};
