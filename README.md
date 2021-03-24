# Welcome to the Humid House

A fun CDK project for an IoT playground using an IoT humidity sensor

# Design Decisions

We use a local keytool process to generate the necessary CSR and private key which are then store them in AWS Secrets Manager (we did not want to pay for AWS Certificate Manager). This happens only the first time the CDK is deployed, subsequent deployments will retrieve the CSR from the Secrets Manager for the IoT thing. The private key is also stored in SecretsManager and must be installed on the IoT device. There is currently no automated process for rotating keys.  

