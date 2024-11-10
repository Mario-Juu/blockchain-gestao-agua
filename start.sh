#!/bin/bash

# Wait for other services to start
sleep 10

# Create and join channel
peer channel create -o orderer.example.com:7050 -c mychannel -f ./channel-artifacts/channel.tx
peer channel join -b mychannel.block

# Install and instantiate chaincode
peer lifecycle chaincode package basic.tar.gz --path /usr/src/app/fabric-samples/asset-transfer-basic/chaincode-javascript --label basic_1.0
peer lifecycle chaincode install basic.tar.gz

# Start application
cd /usr/src/app/fabric-samples/asset-transfer-basic/application-javascript
node app.js
