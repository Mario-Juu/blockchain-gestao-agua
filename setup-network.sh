#!/bin/bash

# Definir variáveis de ambiente
export FABRIC_CFG_PATH=${PWD}/fabric-samples/config
export CHANNEL_NAME=mychannel
export CHAINCODE_NAME=basic
export PATH=${PWD}/fabric-samples/bin:${PATH}

# Função para verificar se o comando anterior foi bem sucedido
checkResult() {
    if [ $1 -ne 0 ]; then
        echo "❌ $2"
        exit 1
    fi
}

echo "🔄 Iniciando setup da rede Fabric..."

# 1. Criar o canal
echo "📦 Criando canal '$CHANNEL_NAME'..."
peer channel create -o orderer.example.com:7050 -c $CHANNEL_NAME \
    -f ./fabric-samples/test-network/channel-artifacts/${CHANNEL_NAME}.tx \
    --outputBlock ./fabric-samples/test-network/channel-artifacts/${CHANNEL_NAME}.block
checkResult $? "Falha ao criar canal"

# 2. Juntar peer ao canal
echo "🔗 Adicionando peer0.org1 ao canal..."
peer channel join -b ./fabric-samples/test-network/channel-artifacts/${CHANNEL_NAME}.block
checkResult $? "Falha ao juntar peer ao canal"

# 3. Definir âncora peer
echo "⚓ Definindo âncora peer..."
peer channel update -o orderer.example.com:7050 -c $CHANNEL_NAME \
    -f ./fabric-samples/test-network/channel-artifacts/Org1MSPanchors.tx
checkResult $? "Falha ao definir âncora peer"

# 4. Empacotar chaincode
echo "📦 Empacotando chaincode..."
peer lifecycle chaincode package ${CHAINCODE_NAME}.tar.gz \
    --path ./fabric-samples/asset-transfer-basic/chaincode-javascript \
    --lang node \
    --label ${CHAINCODE_NAME}_1.0
checkResult $? "Falha ao empacotar chaincode"

# 5. Instalar chaincode
echo "💾 Instalando chaincode..."
peer lifecycle chaincode install ${CHAINCODE_NAME}.tar.gz
checkResult $? "Falha ao instalar chaincode"

# 6. Aprovar chaincode
echo "✅ Aprovando chaincode..."
peer lifecycle chaincode approveformyorg -o orderer.example.com:7050 \
    --channelID $CHANNEL_NAME --name $CHAINCODE_NAME --version 1.0 \
    --package-id $CHAINCODE_NAME_1.0:1 --sequence 1
checkResult $? "Falha ao aprovar chaincode"

# 7. Comprometer chaincode
echo "🔒 Comprometendo chaincode..."
peer lifecycle chaincode commit -o orderer.example.com:7050 \
    --channelID $CHANNEL_NAME --name $CHAINCODE_NAME --version 1.0 \
    --sequence 1
checkResult $? "Falha ao comprometer chaincode"

echo "✨ Setup da rede Fabric concluído com sucesso!"
