const fs = require('fs');

let {CasperClient, CasperServiceByJsonRPC, PublicKey, Keys, RuntimeArgs, CLValue, DeployUtil, AccountHash, KeyValue, CLTypedAndToBytesHelper} = require('casper-client-sdk');

let nodeUrl = 'http://localhost:40101/rpc';
let eventStoreUrl = 'http://localhost:3000';
let wasmPath = '../contract/target/wasm32-unknown-unknown/release/keys-manager.wasm';
let networkName = 'casper-net-1';


// Load the faucet key. Replace <ENTER_YOUR_PATH> with the directory where your casper-node repository resides.
let baseKeyPath = "/home/ziel/workspace/casperlabs/casper-node/utils/nctl/assets/net-1/faucet/";
let privateKeyPath = baseKeyPath + "secret_key.pem";
let publicKeyPath = baseKeyPath + "public_key.pem";
let faucetAccount = Keys.Ed25519.parseKeyFiles(publicKeyPath, privateKeyPath);

// Create a client connect to Casper Node
let client = new CasperClient(nodeUrl, eventStoreUrl);

// Utils

function getClient() {
    return client;
}

function randomSeed() {
    return Array.from({length: 40}, () => Math.floor(Math.random() * 128))
}

async function sendDeploy(deploy, signingKeys) {
    for(let key of signingKeys){
        console.log(`Signed by: ${toAccountHashString(key.publicKey)}`);
        deploy = client.signDeploy(deploy, key);
    }
    let deployHash = await client.putDeploy(deploy);
    await printDeploy(deployHash);
}

async function getDeploy(deployHash) {
    let i = 20;
    while (i != 0) {
        let [deploy, raw] = await client.getDeployByHashFromRPC(deployHash);
        if (raw.execution_results.length !== 0){
            if (raw.execution_results[0].result.Success) {
                return deploy;
            } else {
                throw Error("Contract execution: " + raw.execution_results[0].result.Failure.error_message);
            }
        } else {
            i--;
            await sleep(1000);
            continue;
        }
    }
    throw Error('Timeout after ' + i + 's. Something\'s wrong');
}

async function printDeploy(deployHash) {
    console.log("Deploy hash: " + deployHash);
    console.log("Deploy result:");
    console.log(DeployUtil.deployToJson(await getDeploy(deployHash)));
}

async function printAccount(account) {
    console.log("\n[x] Current state of the account:");
    console.log(await getAccount(account.publicKey));
}

async function getAccount(publicKey) {
    let c = new CasperServiceByJsonRPC(nodeUrl);
    let stateRootHash = (await c.getLatestBlockInfo()).block.header.state_root_hash;
    let account = await c.getBlockState(
        stateRootHash,
        'account-hash-' + toAccountHashString(publicKey),
        []
    ).then(res => res.Account);
    return account;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function toAccountHashString(publicKey) {
    return Buffer.from(publicKey.toAccountHash()).toString('hex');
}

function randomMasterKey() {
    var seed = new Uint8Array(randomSeed());
    return client.newHdWallet(seed);
}

// Key manager

function setAll(fromAccount, deployThereshold, keyManagementThreshold, accountWeights) {
    let accounts = accountWeights.map(x => CLTypedAndToBytesHelper.bytes(x.publicKey.toAccountHash()));
    let weights = accountWeights.map(x => CLTypedAndToBytesHelper.u8(x.weight));

    return buildKeyManagerDeploy(fromAccount, {
        action: CLValue.string("set_all"),
        deployment_thereshold: CLValue.u8(deployThereshold),
        key_management_threshold: CLValue.u8(keyManagementThreshold),
        accounts: CLValue.list(accounts),
        weights: CLValue.list(weights),
    });
}

function setKeyWeightDeploy(fromAccount, account, weight) {
    return buildKeyManagerDeploy(fromAccount, {
        action: CLValue.string("set_key_weight"),
        account: CLValue.byteArray(account.accountHash()),
        weight: CLValue.u8(weight)
    });
}

function setDeploymentThresholdDeploy(fromAccount, weight) {
    return buildKeyManagerDeploy(fromAccount, {
        action: CLValue.string("set_deployment_threshold"),
        weight: CLValue.u8(weight)
    });
}

function setKeyManagementThresholdDeploy(fromAccount, weight) {
    return buildKeyManagerDeploy(fromAccount, {
        action: CLValue.string("set_key_management_threshold"),
        weight: CLValue.u8(weight)
    });
}

function buildKeyManagerDeploy(baseAccount, args) {
    let deployParams = new DeployUtil.DeployParams(
        baseAccount.publicKey,
        networkName
    );
    var session = new Uint8Array(fs.readFileSync(wasmPath, null).buffer);
    let runtimeArgs = RuntimeArgs.fromMap(args);

    let sessionModule = DeployUtil.ExecutableDeployItem.newModuleBytes(
        session,
        runtimeArgs
    );
    let payment = DeployUtil.standardPayment(100000000000);
    return DeployUtil.makeDeploy(deployParams, sessionModule, payment);
}

// Auction

function delegateDeploy(fromAccount, validator, amount) {
    return buildKeyManagerDeploy(fromAccount, {
        action: CLValue.string("delegate"),
        delegator: CLValue.publicKey(fromAccount.publicKey),
        validator: CLValue.publicKey(validator),
        amount: CLValue.u512(amount)
    });
}

function undelegateDeploy(fromAccount, validator, amount) {
    return buildKeyManagerDeploy(fromAccount, {
        action: CLValue.string("undelegate"),
        delegator: CLValue.publicKey(fromAccount.publicKey),
        validator: CLValue.publicKey(validator),
        amount: CLValue.u512(amount)
    });
}

async function auctionInfo() {
    let client = new CasperServiceByJsonRPC(nodeUrl);
    return await client.getValidatorsInfo();
}

// Funding

function transferDeploy(fromAccount, toAccount, amount) {
    let deployParams = new DeployUtil.DeployParams(
        fromAccount.publicKey,
        networkName
    );
    let transferParams = DeployUtil.ExecutableDeployItem.newTransfer(
        amount,
        toAccount.publicKey
    );
    let payment = DeployUtil.standardPayment(100000000000);
    return DeployUtil.makeDeploy(deployParams, transferParams, payment);
}

async function fund(account) {
    let deploy = transferDeploy(faucetAccount, account, 10000000000000);
    await sendDeploy(deploy, [faucetAccount]);
}

// Faucet

async function callStoredFaucet(account) {
    let deployParams = new DeployUtil.DeployParams(
        faucetAccount.publicKey,
        networkName
    );
    let args = RuntimeArgs.fromMap({
        target: CLValue.byteArray(account.accountHash()),
        amount: CLValue.u512(1000000000000)
    });
    let transferParams = DeployUtil.ExecutableDeployItem.newStoredContractByName(
        "faucet",
        "call_faucet",
        args
    );
    let payment = DeployUtil.standardPayment(100000000000);
    let deploy = DeployUtil.makeDeploy(deployParams, transferParams, payment);
    console.log(DeployUtil.deployToJson(deploy));
    await sendDeploy(deploy, [faucetAccount]);
}

module.exports = {
    'randomMasterKey': randomMasterKey,
    'toAccountHashString': toAccountHashString,
    'fund': fund,
    'printAccount': printAccount,
    'keys': {
        'setAll': setAll,
        'setKeyWeightDeploy': setKeyWeightDeploy,
        'setDeploymentThresholdDeploy': setDeploymentThresholdDeploy,
        'setKeyManagementThresholdDeploy': setKeyManagementThresholdDeploy
    },
    'auction': {
        'delegateDeploy': delegateDeploy,
        'undelegateDeploy': undelegateDeploy,
        'auctionInfo': auctionInfo
    },
    'sendDeploy': sendDeploy,
    'transferDeploy': transferDeploy,
    'callStoredFaucet': callStoredFaucet,
    'getDeploy': getDeploy,
    'getClient': getClient
}
