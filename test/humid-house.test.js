const { expect, matchTemplate, MatchStyle } = require('@aws-cdk/assert');
const cdk = require('@aws-cdk/core');
const HumidHouse = require('../lib/humid-house-stack');

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new HumidHouse.HumidHouseStack(app, 'MyTestStack');
    // THEN
    expect(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
