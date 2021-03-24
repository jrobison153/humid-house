module.exports = () => {

  const _cache = {};

  let _isCacheGetUnrecoverableError = false;
  let _isCachePutUnrecoverableError = false;
  let _putSecretValueCalled = false;

  return {
    getSecretValue: (params, cb) => {

      let err = null;
      let data = null;

      if (_isCacheGetUnrecoverableError) {

        err = new Error('Something really bad happened');
      } else if (_cache[params.SecretId]) {

        data = {
          SecretString: _cache[params.SecretId],
        };

      } else {

        err = new Error(`Secret with id ${params.SecretId} not found`);

        err.code = 'ResourceNotFoundException';
      }

      cb(err, data);
    },

    createSecret: (params, cb) => {

      _putSecretValueCalled = true;

      let err = null;

      if (_isCachePutUnrecoverableError) {

        err = new Error('Bad stuff happened trying to put object in cache');
      } else {

        _cache[params.Name] = params.SecretString;
      }

      cb(err, {});
    },

    // ============ Utility functions, not part of cache interface

    getCachedEntryForKey: (key) => {
      return _cache[key];
    },

    putSecretValueCalled: () => _putSecretValueCalled,

    setCachedCsrHitForThing: (thingName, identity) => {
      _cache[thingName] = identity;
    },

    setupGetForUnrecoverableError: () => {

      _isCacheGetUnrecoverableError = true;
    },

    setupPutForUnrecoverableError: () => {

      _isCachePutUnrecoverableError = true;
    },
  };
};
