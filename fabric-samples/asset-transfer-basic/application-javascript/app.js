'use strict';

const express = require('express');
const cors = require('cors'); // Importando o pacote CORS
const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../../test-application/javascript/AppUtil.js');

const channelName = process.env.CHANNEL_NAME || 'mychannel';
const chaincodeName = process.env.CHAINCODE_NAME || 'basic';

const mspOrg1 = 'Org1MSP';
const walletPath = path.join(__dirname, 'wallet');
const org1UserId = 'javascriptAppUser';

function prettyJSONString(inputString) {
    return JSON.stringify(JSON.parse(inputString), null, 2);
}

async function connectToNetwork() {
    const ccp = buildCCPOrg1();
    const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');
    const wallet = await buildWallet(Wallets, walletPath);
    await enrollAdmin(caClient, wallet, mspOrg1);
    await registerAndEnrollUser(caClient, wallet, mspOrg1, org1UserId, 'org1.department1');
    const gateway = new Gateway();
    await gateway.connect(ccp, {
        wallet,
        identity: org1UserId,
        discovery: { enabled: true, asLocalhost: true }
    });
    const network = await gateway.getNetwork(channelName);
    const contract = network.getContract(chaincodeName);
    return { contract, gateway };
}

const app = express();
const port = 3000;

// Habilitando CORS para todas as origens
app.use(cors());

app.use(express.json());
app.use(express.static('public'));

// Exemplo de rota para criar um ativo
app.post('/createAsset', async (req, res) => {
    const { id, nomeRioCidade, pH, microbiologicos, quimicos, temperatura} = req.body;
    try {
        const { contract, gateway } = await connectToNetwork();
        await contract.submitTransaction('CreateAsset', id, nomeRioCidade, pH, microbiologicos, quimicos, temperatura);
        res.status(200).send('Ativo criado com sucesso');
        gateway.disconnect();
    } catch (error) {
        res.status(500).send(`Erro ao criar ativo: ${error}`);
    }
});

app.get('/readAsset/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const { contract, gateway } = await connectToNetwork();
        const result = await contract.evaluateTransaction('ReadAsset', id);
        res.status(200).json(JSON.parse(result.toString()));
        gateway.disconnect();
    } catch (error) {
        res.status(500).send(`Erro ao ler ativo: ${error}`);
    }
});

app.get('/getAllAssets', async (req, res) => {
    try {
        const { contract, gateway } = await connectToNetwork();
        const result = await contract.evaluateTransaction('GetAllAssets');
        console.log(result);
        res.status(200).json(JSON.parse(result.toString()));
        gateway.disconnect();
    } catch (error) {
        res.status(500).send(`Erro ao obter todos os ativosssss: ${error}`);
    }
});

app.put('/updateAsset/:id', async (req, res) => {
    const { id } = req.params;
    const { temperatura, nomeRioCidade, pH, microbiologicos, quimicos} = req.body;
    try {
        const { contract, gateway } = await connectToNetwork();
        await contract.submitTransaction('UpdateAsset', id, temperatura, nomeRioCidade, pH, microbiologicos, quimicos);
        res.status(200).send('Ativo atualizado com sucesso');
        gateway.disconnect();
    } catch (error) {
        res.status(500).send(`Erro ao atualizar ativo: ${error}`);
    }
});

app.delete('/deleteAsset/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const { contract, gateway } = await connectToNetwork();
        await contract.submitTransaction('DeleteAsset', id);
        res.status(200).send('Ativo deletado com sucesso');
        gateway.disconnect();
    } catch (error) {
        res.status(500).send(`Erro ao deletar ativo: ${error}`);
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
