'use strict';

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose'); // MongoDB
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../../test-application/javascript/AppUtil.js');

const channelName = process.env.CHANNEL_NAME || 'mychannel';
const chaincodeName = process.env.CHAINCODE_NAME || 'basic';
const JWT_SECRET = process.env.JWT_SECRET || 'chave-secreta-jwt';

const mspOrg1 = 'Org1MSP';
const walletPath = path.join(__dirname, 'wallet');
const org1UserId = 'javascriptAppUser';

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
    blockchainTxId: { type: String },
    syncStatus: { 
        type: String, 
        enum: ['synced', 'pending', 'error'], 
        default: 'pending' 
    }
});

// Schema para API Keys
const apiKeySchema = new mongoose.Schema({
    name: { type: String, required: true },
    keyHash: { type: String, required: true, unique: true },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    lastUsed: { type: Date },
    permissions: {
        type: [String],
        default: ['create', 'update', 'delete', 'read']
    }
});

// Schema para usuários
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date }
});

const Asset = mongoose.model('Asset', assetSchema);
const ApiKey = mongoose.model('ApiKey', apiKeySchema);
const User = mongoose.model('User', userSchema);


async function connectMongoDB() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Conectado ao MongoDB com sucesso');
        
        // Criar usuário admin padrão se não existir
        await initializeAdminUser();
        
    } catch (error) {
        console.error('Erro ao conectar ao MongoDB:', error);
        process.exit(1);
    }
}

async function initializeAdminUser() {
    try {
        const adminExists = await User.findOne({ username: 'admin' });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('admin', 12);
            const adminUser = new User({
                username: 'admin',
                password: hashedPassword,
                role: 'admin'
            });
            await adminUser.save();
            console.log('Usuário admin criado com sucesso (username: admin, password: admin)');
        }
    } catch (error) {
        console.error('Erro ao criar usuário admin:', error);
    }
}

// Middleware para verificar API Key
async function verifyApiKey(req, res, next) {
    try {
        const apiKey = req.headers['x-api-key'] || req.headers['api-key'];
        
        if (!apiKey) {
            return res.status(401).json({
                error: 'API Key obrigatória',
                message: 'Forneça a API Key no header x-api-key ou api-key'
            });
        }

        const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
        
        const apiKeyRecord = await ApiKey.findOne({ 
            keyHash: keyHash, 
            isActive: true 
        });

        if (!apiKeyRecord) {
            return res.status(403).json({
                error: 'API Key inválida',
                message: 'API Key não encontrada ou inativa'
            });
        }

        apiKeyRecord.lastUsed = new Date();
        await apiKeyRecord.save();

        req.apiKey = apiKeyRecord;
        next();

    } catch (error) {
        console.error('Erro na verificação da API Key:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            message: 'Erro ao verificar API Key'
        });
    }
}

// Middleware para verificar JWT Token
function verifyToken(req, res, next) {
    const token = req.headers['authorization']?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({
            error: 'Token obrigatório',
            message: 'Forneça o token no header Authorization'
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({
            error: 'Token inválido',
            message: 'Token expirado ou inválido'
        });
    }
}

// Middleware para verificar se é admin
function requireAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            error: 'Acesso negado',
            message: 'Apenas administradores podem acessar este recurso'
        });
    }
    next();
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


// ROTAS DE AUTENTICAÇÃO

// Rota de login
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({
                error: 'Dados incompletos',
                message: 'Username e password são obrigatórios'
            });
        }

      
        const user = await User.findOne({ username, isActive: true });
        if (!user) {
            return res.status(401).json({
                error: 'Credenciais inválidas',
                message: 'Username ou password incorretos'
            });
        }

    
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                error: 'Credenciais inválidas',
                message: 'Username ou password incorretos'
            });
        }

        user.lastLogin = new Date();
        await user.save();

        // Gerar JWT
        const token = jwt.sign(
            {
                userId: user._id,
                username: user.username,
                role: user.role
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            message: 'Login realizado com sucesso',
            token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role,
                lastLogin: user.lastLogin
            }
        });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
});

// Rota para gerar API Key (requer login de admin)
app.post('/generateApiKey', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { name, permissions } = req.body;
        
        if (!name) {
            return res.status(400).json({
                error: 'Nome obrigatório',
                message: 'Forneça um nome para a API Key'
            });
        }

        // Gerar API key aleatória (32 bytes = 64 caracteres hex)
        const apiKey = crypto.randomBytes(32).toString('hex');
        
        const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

        const apiKeyRecord = new ApiKey({
            name,
            keyHash,
            permissions: permissions || ['create', 'update', 'delete', 'read']
        });

        await apiKeyRecord.save();

        res.status(201).json({
            message: 'API Key gerada com sucesso',
            apiKey: apiKey, // Retorna apenas uma vez, não será salva em texto plano
            name: name,
            permissions: apiKeyRecord.permissions,
            id: apiKeyRecord._id,
            warning: 'ATENÇÃO: Salve esta API Key, ela não será exibida novamente!'
        });

    } catch (error) {
        console.error('Erro ao gerar API Key:', error);
        res.status(500).json({
            error: 'Erro ao gerar API Key',
            message: error.message
        });
    }
});

// Rota para listar API Keys (sem mostrar as keys, apenas metadados)
app.get('/apiKeys', verifyToken, requireAdmin, async (req, res) => {
    try {
        const apiKeys = await ApiKey.find({}, '-keyHash').sort({ createdAt: -1 });
        res.status(200).json({
            message: 'API Keys listadas com sucesso',
            data: apiKeys
        });
    } catch (error) {
        console.error('Erro ao listar API Keys:', error);
        res.status(500).json({
            error: 'Erro ao listar API Keys',
            message: error.message
        });
    }
});

// Rota para desativar API Key
app.put('/apiKeys/:id/deactivate', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        const apiKey = await ApiKey.findByIdAndUpdate(
            id,
            { isActive: false },
            { new: true }
        );

        if (!apiKey) {
            return res.status(404).json({
                error: 'API Key não encontrada'
            });
        }

        res.status(200).json({
            message: 'API Key desativada com sucesso',
            data: apiKey
        });

    } catch (error) {
        console.error('Erro ao desativar API Key:', error);
        res.status(500).json({
            error: 'Erro ao desativar API Key',
            message: error.message
        });
    }
});

// ROTAS DE ASSETS (protegidas por API Key)

// Rota para criar um ativo (protegida por API Key)
app.post('/createAsset', verifyApiKey, async (req, res) => {
    const { id, nomeRioCidade, pH, microbiologicos, quimicos, temperatura } = req.body;
    
    try {
        if (!req.apiKey.permissions.includes('create')) {
            return res.status(403).json({
                error: 'Permissão negada',
                message: 'API Key não possui permissão para criar assets'
            });
        }

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

// Rota para ler um ativo
app.get('/readAsset/:id', async (req, res) => {
    const id = req.params.id;
    
    try {
        const { contract, gateway } = await connectToNetwork();
        const result = await contract.evaluateTransaction('ReadAsset', id);
        gateway.disconnect();
        res.status(200).json(JSON.parse(result.toString()));
    } catch (error) {
        console.error('Erro ao ler ativo:', error);
        res.status(500).json({ 
            error: 'Erro ao ler ativo',
            message: error.message 
        });
    }
});

// Rota para obter todos os ativos
app.get('/getAllAssets', async (req, res) => {
    try {
        const { contract, gateway } = await connectToNetwork();
        const result = await contract.evaluateTransaction('GetAllAssets');
        gateway.disconnect();
        res.status(200).json(JSON.parse(result.toString()));
    } catch (error) {
        console.error('Erro ao obter todos os ativos:', error);
        res.status(500).json({ 
            error: 'Erro ao obter todos os ativos',
            message: error.message 
        });
    }
});

// Rota para atualizar um ativo (protegida por API Key)
app.put('/updateAsset/:id', verifyApiKey, async (req, res) => {
    const { id } = req.params;
    const { temperatura, nomeRioCidade, pH, microbiologicos, quimicos } = req.body;
    
    try {
        if (!req.apiKey.permissions.includes('update')) {
            return res.status(403).json({
                error: 'Permissão negada',
                message: 'API Key não possui permissão para atualizar assets'
            });
        }

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

// Rota para deletar um ativo (protegida por API Key)
app.delete('/deleteAsset/:id', verifyApiKey, async (req, res) => {
    const id = req.params.id;
    
    try {
        if (!req.apiKey.permissions.includes('delete')) {
            return res.status(403).json({
                error: 'Permissão negada',
                message: 'API Key não possui permissão para deletar assets'
            });
        }

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

//Sincronizar dados entre MongoDB e Blockchain (protegida por API Key)
app.post('/syncAssets', verifyApiKey, async (req, res) => {
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

//  status da aplicação
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
        const apiKeysCount = await ApiKey.countDocuments({ isActive: true });
        const usersCount = await User.countDocuments({ isActive: true });
        
        res.status(200).json({
            status: 'running',
            mongodb: mongoStatus,
            blockchain: blockchainStatus,
            assetsInMongoDB: assetsCount,
            activeApiKeys: apiKeysCount,
            activeUsers: usersCount,
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
    console.log('');
    console.log('=== AUTENTICAÇÃO ===');
    console.log('- POST /login - Fazer login (username: admin, password: admin)');
    console.log('- POST /generateApiKey - Gerar API Key (requer token admin)');
    console.log('- GET /apiKeys - Listar API Keys (requer token admin)');
    console.log('- PUT /apiKeys/:id/deactivate - Desativar API Key (requer token admin)');
    console.log('');
    console.log('=== ASSETS (protegidos por API Key) ===');
    console.log('- POST /createAsset - Criar asset (requer API Key)');
    console.log('- PUT /updateAsset/:id - Atualizar asset (requer API Key)');
    console.log('- DELETE /deleteAsset/:id - Deletar asset (requer API Key)');
    console.log('- POST /syncAssets - Sincronizar blockchain e MongoDB (requer API Key)');
    console.log('');
    console.log('=== LEITURA (sem proteção) ===');
    console.log('- GET /readAsset/:id - Ler asset');
    console.log('- GET /getAllAssets - Listar todos os assets');
    console.log('- GET /status - Status da aplicação');
});