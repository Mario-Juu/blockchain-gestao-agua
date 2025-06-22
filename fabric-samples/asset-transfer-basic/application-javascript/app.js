'use strict';

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose'); // MongoDB
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

// Configuração do MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/blockchain_db';

// Schema do MongoDB para os assets
const assetSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    nomeRioCidade: { type: String, required: true },
    pH: { type: String, required: true },
    microbiologicos: { type: String, required: true },
    quimicos: { type: String, required: true },
    temperatura: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    blockchainTxId: { type: String }, // ID da transação na blockchain
    syncStatus: { 
        type: String, 
        enum: ['synced', 'pending', 'error'], 
        default: 'pending' 
    }
});

const Asset = mongoose.model('Asset', assetSchema);

// Conectar ao MongoDB
async function connectMongoDB() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Conectado ao MongoDB com sucesso');
    } catch (error) {
        console.error('Erro ao conectar ao MongoDB:', error);
        process.exit(1);
    }
}

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

// Inicializar MongoDB
connectMongoDB();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Rota para criar um ativo (salva na blockchain E no MongoDB)
app.post('/createAsset', async (req, res) => {
    const { id, nomeRioCidade, pH, microbiologicos, quimicos, temperatura } = req.body;
    
    try {
        // Verificar se o asset já existe no MongoDB
        const existingAsset = await Asset.findOne({ id });
        if (existingAsset) {
            return res.status(400).json({ 
                error: 'Asset já existe',
                message: `Asset com ID ${id} já foi criado` 
            });
        }

        // 1. Salvar na blockchain
        const { contract, gateway } = await connectToNetwork();
        const blockchainResult = await contract.submitTransaction('CreateAsset', id, nomeRioCidade, pH, microbiologicos, quimicos, temperatura);
        
        // 2. Salvar no MongoDB
        const newAsset = new Asset({
            id,
            nomeRioCidade,
            pH,
            microbiologicos,
            quimicos,
            temperatura,
            blockchainTxId: blockchainResult.toString(),
            syncStatus: 'synced'
        });
        
        await newAsset.save();
        
        gateway.disconnect();
        
        res.status(200).json({
            message: 'Ativo criado com sucesso',
            data: {
                id,
                mongoId: newAsset._id,
                blockchainTxId: blockchainResult.toString(),
                syncStatus: 'synced'
            }
        });
        
    } catch (error) {
        console.error('Erro ao criar ativo:', error);
        
        // Se falhou na blockchain mas pode ter salvado no MongoDB, marcar como erro
        try {
            await Asset.updateOne({ id }, { syncStatus: 'error' });
        } catch (updateError) {
            console.error('Erro ao atualizar status no MongoDB:', updateError);
        }
        
        res.status(500).json({ 
            error: 'Erro ao criar ativo',
            message: error.message 
        });
    }
});

// Rota para ler um ativo (busca no MongoDB, com opção de verificar na blockchain)
app.get('/readAsset/:id', async (req, res) => {
    const id = req.params.id;
    const { source = 'mongodb' } = req.query; // ?source=blockchain para buscar na blockchain
    
    try {
        if (source === 'blockchain') {
            // Buscar na blockchain
            const { contract, gateway } = await connectToNetwork();
            const result = await contract.evaluateTransaction('ReadAsset', id);
            gateway.disconnect();
            res.status(200).json({
                source: 'blockchain',
                data: JSON.parse(result.toString())
            });
        } else {
            // Buscar no MongoDB (padrão)
            const asset = await Asset.findOne({ id });
            if (!asset) {
                return res.status(404).json({ 
                    error: 'Asset não encontrado',
                    message: `Asset com ID ${id} não existe no MongoDB` 
                });
            }
            
            res.status(200).json({
                source: 'mongodb',
                data: asset
            });
        }
    } catch (error) {
        console.error('Erro ao ler ativo:', error);
        res.status(500).json({ 
            error: 'Erro ao ler ativo',
            message: error.message 
        });
    }
});

// Rota para obter todos os ativos (MongoDB com opção de comparar com blockchain)
app.get('/getAllAssets', async (req, res) => {
    const { source = 'mongodb' } = req.query;
    
    try {
        if (source === 'blockchain') {
            // Buscar na blockchain
            const { contract, gateway } = await connectToNetwork();
            const result = await contract.evaluateTransaction('GetAllAssets');
            gateway.disconnect();
            res.status(200).json(JSON.parse(result.toString()));
        } else {
            // Buscar no MongoDB (padrão)
            const assets = await Asset.find({}).sort({ createdAt: -1 });
            console.log(assets.toString());
            res.status(200).json(JSON.parse(assets.toString()));
        }
    } catch (error) {
        console.error('Erro ao obter todos os ativos:', error);
        res.status(500).json({ 
            error: 'Erro ao obter todos os ativos',
            message: error.message 
        });
    }
});

// Rota para atualizar um ativo (atualiza na blockchain E no MongoDB)
app.put('/updateAsset/:id', async (req, res) => {
    const { id } = req.params;
    const { temperatura, nomeRioCidade, pH, microbiologicos, quimicos } = req.body;
    
    try {
        // Verificar se o asset existe no MongoDB
        const existingAsset = await Asset.findOne({ id });
        if (!existingAsset) {
            return res.status(404).json({ 
                error: 'Asset não encontrado',
                message: `Asset com ID ${id} não existe` 
            });
        }

        // 1. Atualizar na blockchain
        const { contract, gateway } = await connectToNetwork();
        const blockchainResult = await contract.submitTransaction('UpdateAsset', id, temperatura, nomeRioCidade, pH, microbiologicos, quimicos);
        
        // 2. Atualizar no MongoDB
        const updatedAsset = await Asset.findOneAndUpdate(
            { id },
            {
                temperatura,
                nomeRioCidade,
                pH,
                microbiologicos,
                quimicos,
                updatedAt: new Date(),
                blockchainTxId: blockchainResult.toString(),
                syncStatus: 'synced'
            },
            { new: true }
        );
        
        gateway.disconnect();
        
        res.status(200).json({
            message: 'Ativo atualizado com sucesso',
            data: updatedAsset
        });
        
    } catch (error) {
        console.error('Erro ao atualizar ativo:', error);
        
        // Marcar como erro no MongoDB se a blockchain falhou
        try {
            await Asset.updateOne({ id }, { syncStatus: 'error' });
        } catch (updateError) {
            console.error('Erro ao atualizar status no MongoDB:', updateError);
        }
        
        res.status(500).json({ 
            error: 'Erro ao atualizar ativo',
            message: error.message 
        });
    }
});

// Rota para deletar um ativo (deleta da blockchain E do MongoDB)
app.delete('/deleteAsset/:id', async (req, res) => {
    const id = req.params.id;
    
    try {
        // Verificar se o asset existe no MongoDB
        const existingAsset = await Asset.findOne({ id });
        if (!existingAsset) {
            return res.status(404).json({ 
                error: 'Asset não encontrado',
                message: `Asset com ID ${id} não existe` 
            });
        }

        // 1. Deletar da blockchain
        const { contract, gateway } = await connectToNetwork();
        await contract.submitTransaction('DeleteAsset', id);
        
        // 2. Deletar do MongoDB
        await Asset.deleteOne({ id });
        
        gateway.disconnect();
        
        res.status(200).json({
            message: 'Ativo deletado com sucesso',
            deletedId: id
        });
        
    } catch (error) {
        console.error('Erro ao deletar ativo:', error);
        res.status(500).json({ 
            error: 'Erro ao deletar ativo',
            message: error.message 
        });
    }
});

// Rota adicional: Sincronizar dados entre MongoDB e Blockchain
app.post('/syncAssets', async (req, res) => {
    try {
        const { contract, gateway } = await connectToNetwork();
        
        // Buscar todos os assets da blockchain
        const blockchainResult = await contract.evaluateTransaction('GetAllAssets');
        const blockchainAssets = JSON.parse(blockchainResult.toString());
        
        // Buscar todos os assets do MongoDB
        const mongoAssets = await Asset.find({});
        
        gateway.disconnect();
        
        const syncReport = {
            blockchain: blockchainAssets.length,
            mongodb: mongoAssets.length,
            differences: []
        };
        
        // Comparar e identificar diferenças
        const blockchainIds = new Set(blockchainAssets.map(asset => asset.ID));
        const mongoIds = new Set(mongoAssets.map(asset => asset.id));
        
        // Assets que existem na blockchain mas não no MongoDB
        const missingInMongo = [...blockchainIds].filter(id => !mongoIds.has(id));
        
        // Assets que existem no MongoDB mas não na blockchain
        const missingInBlockchain = [...mongoIds].filter(id => !blockchainIds.has(id));
        
        syncReport.differences = {
            missingInMongoDB: missingInMongo,
            missingInBlockchain: missingInBlockchain
        };
        
        res.status(200).json({
            message: 'Relatório de sincronização gerado',
            report: syncReport
        });
        
    } catch (error) {
        console.error('Erro ao sincronizar assets:', error);
        res.status(500).json({ 
            error: 'Erro ao sincronizar assets',
            message: error.message 
        });
    }
});

// Rota de status da aplicação
app.get('/status', async (req, res) => {
    try {
        const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
        
        let blockchainStatus = 'disconnected';
        try {
            const { contract, gateway } = await connectToNetwork();
            blockchainStatus = 'connected';
            gateway.disconnect();
        } catch (error) {
            blockchainStatus = 'error';
        }
        
        const assetsCount = await Asset.countDocuments();
        
        res.status(200).json({
            status: 'running',
            mongodb: mongoStatus,
            blockchain: blockchainStatus,
            assetsInMongoDB: assetsCount,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        res.status(500).json({ 
            error: 'Erro ao verificar status',
            message: error.message 
        });
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
    console.log(`MongoDB URI: ${MONGODB_URI}`);
    console.log('Endpoints disponíveis:');
    console.log('- POST /createAsset - Criar asset');
    console.log('- GET /readAsset/:id - Ler asset');
    console.log('- GET /getAllAssets - Listar todos os assets');
    console.log('- PUT /updateAsset/:id - Atualizar asset');
    console.log('- DELETE /deleteAsset/:id - Deletar asset');
    console.log('- POST /syncAssets - Sincronizar blockchain e MongoDB');
    console.log('- GET /status - Status da aplicação');
});