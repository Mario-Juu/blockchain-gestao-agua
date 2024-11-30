#!/bin/bash

# Pull Fabric images
docker pull hyperledger/fabric-peer:2.5.9
docker pull hyperledger/fabric-orderer:2.5.9
docker pull hyperledger/fabric-ccenv:2.5.9
docker pull hyperledger/fabric-baseos:2.5.9
docker pull hyperledger/fabric-ca:1.5.12

# Tag images
docker tag hyperledger/fabric-peer:2.5.9 hyperledger/fabric-peer:latest
docker tag hyperledger/fabric-orderer:2.5.9 hyperledger/fabric-orderer:latest
docker tag hyperledger/fabric-ccenv:2.5.9 hyperledger/fabric-ccenv:latest
docker tag hyperledger/fabric-baseos:2.5.9 hyperledger/fabric-baseos:latest
docker tag hyperledger/fabric-ca:1.5.12 hyperledger/fabric-ca:latest
