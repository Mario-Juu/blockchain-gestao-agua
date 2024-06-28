/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const express = require('express');
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

// pre-requisites:
// - fabric-sample two organization test-network setup with two peers, ordering service,
//   and 2 certificate authorities
//         ===> from directory /fabric-samples/test-network
//         ./network.sh up createChannel -ca
// - Use any of the asset-transfer-basic chaincodes deployed on the channel "mychannel"
//   with the chaincode name of "basic". The following deploy command will package,
//   install, approve, and commit the javascript chaincode, all the actions it takes
//   to deploy a chaincode to a channel.
//         ===> from directory /fabric-samples/test-network
//         ./network.sh deployCC -ccn basic -ccp ../asset-transfer-basic/chaincode-javascript/ -ccl javascript
// - Be sure that node.js is installed
//         ===> from directory /fabric-samples/asset-transfer-basic/application-javascript
//         node -v
// - npm installed code dependencies
//         ===> from directory /fabric-samples/asset-transfer-basic/application-javascript
//         npm install
// - to run this test application
//         ===> from directory /fabric-samples/asset-transfer-basic/application-javascript
//         node app.js

// NOTE: If you see  kind an error like these:
/*
    2020-08-07T20:23:17.590Z - error: [DiscoveryService]: send[mychannel] - Channel:mychannel received discovery error:access denied
    ******** FAILED to run the application: Error: DiscoveryService: mychannel error: access denied

   OR

   Failed to register user : Error: fabric-ca request register failed with errors [[ { code: 20, message: 'Authentication failure' } ]]
   ******** FAILED to run the application: Error: Identity not found in wallet: appUser
*/
// Delete the /fabric-samples/asset-transfer-basic/application-javascript/wallet directory
// and retry this application.
//
// The certificate authority must have been restarted and the saved certificates for the
// admin and application user are not valid. Deleting the wallet store will force these to be reset
// with the new certificate authority.
//

/**
 *  A test application to show basic queries operations with any of the asset-transfer-basic chaincodes
 *   -- How to submit a transaction
 *   -- How to query and check the results
 *
 * To see the SDK workings, try setting the logging to show on the console before running
 *        export HFC_LOGGING='{"debug":"console"}'
 */

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

app.use(express.json());

app.post('/createAsset', async (req, res) => {
	const { id, tipo, nomeRioCidade, pH, microbiologicos, quimicos, proprietario } = req.body;
	try {
		const { contract, gateway } = await connectToNetwork();
		await contract.submitTransaction('CriarNovoAtivoQualidadeAgua', id, tipo, nomeRioCidade, pH, microbiologicos, quimicos, proprietario);
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
		const result = await contract.evaluateTransaction('LerInformacoesAtivo', id);
		res.status(200).json(JSON.parse(result.toString()));
		gateway.disconnect();
	} catch (error) {
		res.status(500).send(`Erro ao ler ativo: ${error}`);
	}
});

app.get('/getAllAssets', async (req, res) => {
	try {
		const { contract, gateway } = await connectToNetwork();
		const result = await contract.evaluateTransaction('GetTodosAtivos');
		res.status(200).json(JSON.parse(result.toString()));
		gateway.disconnect();
	} catch (error) {
		res.status(500).send(`Erro ao obter todos os ativos: ${error}`);
	}
});

app.put('/updateAsset/:id', async (req, res) => {
	const { id } = req.params;
	const { tipo, nomeRioCidade, pH, microbiologicos, quimicos, proprietario } = req.body;
	try {
		const { contract, gateway } = await connectToNetwork();
		await contract.submitTransaction('AtualizarInnformacoesAtivoAgua', id, tipo, nomeRioCidade, pH, microbiologicos, quimicos, proprietario);
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
