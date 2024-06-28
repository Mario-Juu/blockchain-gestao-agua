/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

// Deterministic JSON.stringify()
const stringify  = require('json-stringify-deterministic');
const sortKeysRecursive  = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');

class AssetTransfer extends Contract {

    async InitLedger(ctx) {
        const assets = [
            {
                ID: "asset1",
                Tipo: "qualidadeDaAgua",
                NomeRioCidade: "Rio Itajai-Acu",
                Ph: 7.2,
                Microbiologicos: "Baixo",
                Quimicos: "Nenhum",
                Proprietario: "Marinha",
            },
            {
                ID: "asset2",
                Tipo: "qualidadeDaAgua",
                NomeRioCidade: "Rio Amazonas",
                Ph: 6.8,
                Microbiologicos: "Médio",
                Quimicos: "Baixo",
                Proprietario: "Ministério do Meio Ambiente",
            },
            {
                ID: "asset3",
                Tipo: "qualidadeDaAgua",
                NomeRioCidade: "Rio São Francisco",
                Ph: 7.5,
                Microbiologicos: "Alto",
                Quimicos: "Médio",
                Proprietario: "Agência Nacional de Águas",
            },
            {
                ID: "asset4",
                Tipo: "qualidadeDaAgua",
                NomeRioCidade: "Rio Tietê",
                Ph: 6.5,
                Microbiologicos: "Alto",
                Quimicos: "Alto",
                Proprietario: "Companhia Ambiental do Estado de São Paulo",
            },
            {
                ID: "asset5",
                Tipo: "qualidadeDaAgua",
                NomeRioCidade: "Rio Paraná",
                Ph: 7.0,
                Microbiologicos: "Médio",
                Quimicos: "Baixo",
                Proprietario: "Secretaria de Meio Ambiente do Estado do Paraná",
            },
            {
                ID: "asset6",
                Tipo: "qualidadeDaAgua",
                NomeRioCidade: "Rio Doce",
                Ph: 7.8,
                Microbiologicos: "Baixo",
                Quimicos: "Nenhum",
                Proprietario: "Fundação Renova",
            },
        ];

        for (const asset of assets) {
            asset.docType = 'asset';
            // example of how to write to world state deterministically
            // use convetion of alphabetic order
            // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
            // when retrieving data, in any lang, the order of data will be the same and consequently also the corresonding hash
            await ctx.stub.putState(asset.ID, Buffer.from(stringify(sortKeysRecursive(asset))));
        }
    }

    // CreateAsset issues a new asset to the world state with given details.
    async CriarNovoAtivoQualidadeAgua(ctx, id, tipo, nomeRioCidade, pH, microbiologicos, quimicos, proprietario) {
        const exists = await this.AssetExists(ctx, id);
        if (exists) {
            throw new Error(`O ativo ${id} já existe`);
        }

        const asset = {
            ID: id,
            Tipo: tipo,
            NomeRioCidade: nomeRioCidade,
            Ph: pH,
            Microbiologicos: microbiologicos,
            Quimicos: quimicos,
            Proprietario: proprietario,
        };
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(asset))));
        return JSON.stringify(asset);
    }

    // ReadAsset returns the asset stored in the world state with given id.
    async LerInformacoesAtivo(ctx, id) {
        const assetJSON = await ctx.stub.getState(id); // get the asset from chaincode state
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`Não foi possível encontrar o ativo ${id}`);
        }
        return assetJSON.toString();
    }

    // UpdateAsset updates an existing asset in the world state with provided parameters.
    async AtualizarInnformacoesAtivoAgua(ctx, id, tipo, nomeRioCidade, pH, microbiologicos, quimicos, proprietario) {
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`Não foi possível encontrar o ativo ${id}`);
        }

        // overwriting original asset with new asset
        const updatedAsset = {
            ID: id,
            Tipo: tipo,
            NomeRioCidade: nomeRioCidade,
            Ph: pH,
            Microbiologicos: microbiologicos,
            Quimicos: quimicos,
            Proprietario: proprietario,
        };
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        return ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(updatedAsset))));
    }

    // DeleteAsset deletes an given asset from the world state.
    async DeleteAsset(ctx, id) {
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`Não foi possível encontrar o ativo ${id}`);
        }
        return ctx.stub.deleteState(id);
    }

    // AssetExists returns true when asset with given ID exists in world state.
    async AssetExists(ctx, id) {
        const assetJSON = await ctx.stub.getState(id);
        return assetJSON && assetJSON.length > 0;
    }

    // TransferAsset updates the owner field of asset with given id in the world state.
    async TransferAsset(ctx, id, newOwner) {
        const assetString = await this.ReadAsset(ctx, id);
        const asset = JSON.parse(assetString);
        const oldOwner = asset.Owner;
        asset.Owner = newOwner;
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(asset))));
        return oldOwner;
    }

    // GetAllAssets returns all assets found in the world state.
    async GetTodosAtivos(ctx) {
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
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
