module.exports = {

  /**
   * TODO: rename this to getCsrForThing after secretCache is collapsed into this module
   *
   * Attempt to locate a CSR from a secretCache. If nothing is cached then create a new CSR and private key
   *
   * @param {object} secretCache - must comply with the AWS Secrets Manager SDK API
   *  https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SecretsManager.htm. A subset of functionality is
   *  required, if additional implementations are required then you can implement the following functions (also
   *  view test/doubles/Cache.js to see the test double which covers the correct interface/usage
   *    - getSecretValue
   *
   * @param {string} thingName - name of the thing to locate or create new CSR for
   * @return {Promise<string>}
   */
  getCsrForThing: (secretCache, thingName) => {

    return new Promise((resolve, reject) => {

      secretCache.getSecretValue({SecretId: thingName}, (err, data) => {

        if (!err) {
          resolve(data.SecretString);
        } else {

          if (err.code === 'ResourceNotFoundException') {
            resolve('Not a real CSR, just testing');
          } else {
            reject(new Error(`Unrecoverable error attempting to get CSR from cache. Source error ${err.toString()}`));
          }
        }
      });
    });


    // } catch (e) {
    //   throw new Error(`Unrecoverable error attempting to get CSR from cache. Source error ${e.toString()}`);
    // }
  },

  name: () => 'CachedCsr',
};
