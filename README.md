# Guia de Instalação e Configuração do Sistema de Blockchain para Gestão de Água

## Pré-requisitos

- **Sistema Operacional:** Ubuntu 20.04 LTS (ou versão mais recente)
- **Docker:** Instalado e configurado corretamente
- **Node.js e npm:** Versão estável instalada (recomenda-se Node.js 16.x LTS)

## Passos

### 1. Instalação versão atualizada do node
### Remoção Completa do Node.js Anterior

1. **Remova o Node.js e o npm**

   Primeiro, remova completamente o Node.js e o npm que estão instalados:

    ```bash
    sudo apt-get remove nodejs npm
    ```

2. **Limpe o Cache do APT**

   Limpe o cache do APT para garantir que não haja pacotes parcialmente instalados ou cache corrompido:

    ```bash
    sudo apt-get clean
    sudo apt-get autoclean
    ```

3. **Remova Pacotes Não Utilizados**

   Execute o comando para remover pacotes que não são mais necessários pelo sistema:

    ```bash
    sudo apt autoremove
    ```

### Instalação do Node.js Versão 16.x

Agora que o Node.js e o npm antigos foram removidos e o sistema está limpo, proceda com a instalação do Node.js versão 16.x a partir do repositório NodeSource:

1. **Adicione o Repositório NodeSource**

   Execute o seguinte comando para adicionar o repositório NodeSource e seu chaveiro GPG:

    ```bash
    curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
    ```

2. **Instale o Node.js**

   Finalmente, instale o Node.js versão 16.x:

    ```bash
    sudo apt-get install -y nodejs
    ```

3. **Verifique a Versão Instalada**

   Após a instalação, verifique se o Node.js foi atualizado para a versão desejada:

    ```bash
    node -v
    npm -v
    ```

   Esses comandos devem agora retornar as versões mais recentes do Node.js e npm instaladas.


### 1. Instalação do Hyperledger Fabric

#### 1.1 Instalação das Ferramentas Essenciais

```bash
# Instalar Curl (caso ainda não tenha)
sudo su
sudo apt-get install git
sudo apt-get install curl
sudo apt-get install docker-compose
sudo apt-get install npm
sudo apt-get install python3 pip
sudo apt install python3-virtualenv
sudo systemctl start docker
sudo apt-get install jq
```

#### 1.2 Clonar esse repositório

#### 1.3 Configurar e Iniciar a Blockchain

1. **Navegar até o diretório da rede de teste**

    ```bash
    cd blockchain-gestao-agua/fabric-samples/test-network
    ```

2. **Derrubar qualquer rede existente**

    ```bash
    ./network.sh down
    ```

3. **Criar nova rede e canal**

    ```bash
    ./network.sh up createChannel -c mychannel -ca
    ```

4. **Implantar o chaincode**

    ```bash
    ./network.sh deployCC -ccn basic -ccp ../asset-transfer-basic/chaincode-javascript/ -ccl javascript
    ```

#### 1.4 Iniciar o Backend

1. **Acessar como superusuário**

    ```bash
    sudo su
    ```

2. **Navegar até o diretório da aplicação**

    ```bash
    cd blockchain-gestao-agua/fabric-samples/asset-transfer-basic/application-javascript
    ```

3. **Limpar wallet existente**

    ```bash
    rm -rf wallet
    ```

4. **Instalar dependências**

    ```bash
    npm install
    npm install express
    ```

5. **Iniciar o servidor**

    ```bash
    node app.js
    ```

   O servidor estará disponível em http://localhost:3000

#### 1.5 Iniciar o Frontend

1. **Navegar até o diretório do frontend**

    ```bash
    cd blockchain-gestao-agua/blockchain-water-management/src
   npm install
    ```

2. **Iniciar a aplicação React**

    ```bash
    npm start
    ```

   O cliente React estará disponível em http://localhost:3001