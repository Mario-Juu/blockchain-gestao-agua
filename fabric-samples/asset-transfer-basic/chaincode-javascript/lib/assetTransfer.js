'use strict';

const stringify  = require('json-stringify-deterministic');
const sortKeysRecursive  = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');

class AssetTransfer extends Contract {

    async InitLedger(ctx) {
        const assets = [
            {
                ID: "asset1",
                NomeRioCidade: "Rio Itajai-Acu",
                Ph: 7.2,
                Microbiologicos: "Baixo",
                Quimicos: "Nenhum",
                Temperatura: 25,
                
            },
                
            {
                ID: "asset2",
                NomeRioCidade: "Rio Amazonas",
                Ph: 6.8,
                Microbiologicos: "Médio",
                Quimicos: "Baixo",
                Temperatura: 26,
                
            },
                
            {
                ID: "asset3",
                NomeRioCidade: "Rio São Francisco",
                Ph: 7.5,
                Microbiologicos: "Alto",
                Quimicos: "Médio",
                Temperatura: 24,
                
            },
                
            {
                ID: "asset4",
                NomeRioCidade: "Rio Tietê",
                Ph: 6.5,
                Microbiologicos: "Alto",
                Quimicos: "Alto",
                Temperatura: 27,
            },
                
            {
                ID: "asset5",
                NomeRioCidade: "Rio Paraná",
                Ph: 7.0,
                Microbiologicos: "Médio",
                Quimicos: "Baixo",
                Temperatura: 23,
                
            },
            
            {
                
                ID: "asset6",
                NomeRioCidade: "Rio Doce",
                Ph: 7.8,
                Microbiologicos: "Baixo",
                Quimicos: "Nenhum",
                Temperatura: 22,
                
            },
        ];

        for (const asset of assets) {
            asset.docType = 'asset';
            await ctx.stub.putState(asset.ID, Buffer.from(stringify(sortKeysRecursive(asset))));
        }
    }

    async CreateAsset(ctx, id, nomeRioCidade, pH, microbiologicos, quimicos,  temperatura) {
        const exists = await this.AssetExists(ctx, id);
        if (exists) {
            throw new Error(`O ativo ${id} já existe`);
        }
    
        const asset = {
            ID: id,
            NomeRioCidade: nomeRioCidade,
            Ph: pH,
            Microbiologicos: microbiologicos,
            Quimicos: quimicos,
            Temperatura: temperatura,
        };
    
        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(asset))));
        return JSON.stringify(asset);
    }

    async ReadAsset(ctx, id) {
        const assetJSON = await ctx.stub.getState(id); // get the asset from chaincode state
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`The asset ${id} does not exist`);
        }
        return assetJSON.toString();
    }

    async UpdateAsset(ctx, id, nomeRioCidade, pH, microbiologicos, quimicos, temperatura) {
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`Não foi possível encontrar o ativo ${id}`);
        }
    
        const updatedAsset = {
            ID: id,
            NomeRioCidade: nomeRioCidade,
            Ph: pH,
            Microbiologicos: microbiologicos,
            Quimicos: quimicos,
            Temperatura: temperatura,
        };
    
        return ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(updatedAsset))));
    }
    
    async DeleteAsset(ctx, id) {
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }
        return ctx.stub.deleteState(id);
    }

    
    async AssetExists(ctx, id) {
        const assetJSON = await ctx.stub.getState(id);
        return assetJSON && assetJSON.length > 0;
    }

    
    async TransferAsset(ctx, id, newOwner) {
        const assetString = await this.ReadAsset(ctx, id);
        const asset = JSON.parse(assetString);
        const oldOwner = asset.Owner;
        asset.Owner = newOwner;

        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(asset))));
        return oldOwner;
    }

    
    async GetAllAssets(ctx) {
        const allResults = [];
        
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }
}

module.exports = AssetTransfer;