#!/bin/bash
set -e

# Inicializar a rede Fabric
echo "Iniciando setup da rede Fabric..."
setup-network.sh

# Iniciar a aplicação Node.js
echo "Iniciando aplicação..."
node app.js
