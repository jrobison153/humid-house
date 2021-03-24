
/**
 * TODO: this module is growing into two modules, the secret cache and the CSR; consider splitting apart
 *
 * @param {object} secretCache - must comply with the AWS Secrets Manager SDK API
 *  https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SecretsManager.html. A subset of functionality is
 *  required, if additional implementations are required then you can implement the following functions (also
 *  view test/doubles/Cache.js to see the test double which covers the correct interface/usage
 *    - createSecret
 *    - getSecretValue
 *
 * @return {{name: (function(): string), getCsrForThing: (function(Object, Object, string): Promise<string>)}}
 */
module.exports = (secretCache) => {

  const OUT_CSR_FILE = 'server.csr';
  const OUT_PRIVATE_KEY_FILE = 'server.key';
  const OPENSSL = 'openssl';
  const OPENSSL_CSR_CREATE_ARGS = [
    'req',
    '-new',
    '-newkey',
    'rsa:2048',
    '-nodes',
    '-keyout',
    OUT_PRIVATE_KEY_FILE,
    '-out',
    OUT_CSR_FILE,
    '-subj',
    '/C=US/ST=NH/L=Portsmouth/O=JR/CN=IoT',
  ];

  const _isCacheMiss = (cacheError) => {

    return cacheError.code === 'ResourceNotFoundException';
  };

  const _readFile = (file, fs) => {

    return new Promise((resolve, reject) => {

      fs.readFile(file, 'utf8', (readFileErr, data) => {

        if (readFileErr) {
          reject(new Error(`Unable to read CSR, root cause is: ${readFileErr.toString()}`));
        } else {

          resolve(data);
        }
      });
    });
  };

  const _readCsrFromFile = (fs) => {
    return _readFile(OUT_CSR_FILE, fs);
  };

  const _readPrivateKeyFromFile = (fs) => {
    return _readFile(OUT_PRIVATE_KEY_FILE, fs);
  };

  const _createNewCsr = (process, fs) => {

    return new Promise((resolve, reject) => {

      const openssl = process.spawn(OPENSSL, OPENSSL_CSR_CREATE_ARGS);
      let stderrText = '';

      openssl.stderr.on('data', (data) => {
        stderrText = `${stderrText} ${data}`;
      });

      openssl.on('close', async (code) => {

        if (code === 0) {

          try {

            const csr = await _readCsrFromFile(fs);
            const privateKey = await _readPrivateKeyFromFile(fs);

            resolve({csr, privateKey});
          } catch (e) {
            reject(e);
          }
        } else {
          reject(new Error(`Unable to create CSR, root cause is: ${stderrText}\n`));
        }
      });
    });
  };

  const _getFromCache = (key) => {

    return new Promise((resolve, reject) => {

      const secretId = `${key}-identity`;
      const params = {
        SecretId: secretId,
      };

      secretCache.getSecretValue(params, (cacheGetErr, data) => {

        if (!cacheGetErr) {
          resolve(JSON.parse(data.SecretString));
        } else {

          if (_isCacheMiss(cacheGetErr)) {

            console.log(`Value with key ${secretId} not present in cache`);
            resolve(null);
          } else {
            reject(new Error(
                `Unrecoverable error attempting to get CSR from cache. Source error ${cacheGetErr.toString()}`),
            );
          }
        }
      });
    });
  };

  const _putInCache = (key, value) => {

    return new Promise((resolve, reject) => {

      const params = {
        Name: `${key}-identity`,
        SecretString: JSON.stringify(value),
      };

      secretCache.createSecret(params, (err) => {

        if (err) {
          reject(new Error(`Unrecoverable error attempting to put CSR in cache, source error ${err.toString()}`));
        } else {
          resolve();
        }
      });
    });
  };

  return {
    /**
     *
     * Attempt to locate a CSR from a secretCache. If nothing is cached then create a new CSR and private key
     *
     * @param {object} process - adheres to the nodejs child_process interface. Utilized APIs
     *  - spawn
     * @param {object} fs - adheres to the nodejs fs interface. Utilized APIs
     *  - readFile
     * @param {string} thingName - name of the thing to locate or create new CSR for
     * @return {Promise<string>}
     */
    getCsrForThing: async (process, fs, thingName) => {

      try {
        let identity = await _getFromCache(thingName);

        if (!identity) {

          identity = await _createNewCsr(process, fs);

          await _putInCache(thingName, identity);
        }

        return identity.csr;
      } catch (e) {
        throw new Error(`Unrecoverable error attempting to get CSR from cache. Source error ${e.toString()}`);
      }
    },

    name: () => 'CachedCsr',

    cacheVersion: () => {
      return secretCache.config.apiVersion;
    },

    csrCreationCommand: () => {
      return OPENSSL;
    },

    csrCreationArgs: () => {
      return OPENSSL_CSR_CREATE_ARGS;
    },

    privateKeyFileName: () => {
      return OUT_PRIVATE_KEY_FILE;
    },

    outCsrFileName: () => {
      return OUT_CSR_FILE;
    },
  };
};
