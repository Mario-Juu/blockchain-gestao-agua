#!/bin/bash

# Função para verificar erros
check_error() {
    if [ $? -ne 0 ]; then
        echo "Erro: $1"
        exit 1
    fi
}

echo "🚀 Iniciando setup do ambiente Fabric..."

# 1. Baixar imagens Docker do Fabric
echo "📥 Baixando imagens Docker do Fabric..."
docker pull hyperledger/fabric-peer:2.5
docker pull hyperledger/fabric-orderer:2.5
docker pull hyperledger/fabric-ccenv:2.5
docker pull hyperledger/fabric-baseos:2.5
docker pull hyperledger/fabric-ca:1.5
check_error "Falha ao baixar imagens Docker"

# 2. Construir a imagem da aplicação
echo "🏗️  Construindo a imagem da aplicação..."
docker-compose build
check_error "Falha ao construir a imagem"

# 3. Iniciar os serviços
echo "🌟 Iniciando os serviços..."
docker-compose up -d
check_error "Falha ao iniciar os serviços"

echo "✅ Setup completo! A aplicação está disponível em http://localhost:3000"
