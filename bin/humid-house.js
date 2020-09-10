#!/usr/bin/env node

const cdk = require('@aws-cdk/core');
const { HumidHouseStack } = require('../lib/humid-house-stack');

const app = new cdk.App();
new HumidHouseStack(app, 'HumidHouseStack');
