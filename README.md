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

#### 1.3 Para subir a Blockchain

```bash
cd fabric-samples/test-network
```
 

```bash
./network.sh down
```

```bash
./network.sh up createChannel -c mychannel -ca
```

```bash
./network.sh deployCC -ccn basic -ccp ../asset-transfer-basic/chaincode-javascript/ -ccl javascript
```

#### 1.3 Rodar a aplicação
Ir no terminal e fazer sudo su
Ir no hyperledger/fabric-samples/asset-transfer-basic/application-javascript
Fazer um rm -rf wallet
Npm install
Npm install express
Node app.js
Ele vai rodar na porta 3000
Apenas subir localhost:3000


