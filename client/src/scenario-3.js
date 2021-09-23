const keyManager = require('./key-manager');
const TRANSFER_AMOUNT = process.env.TRANSFER_AMOUNT || 2500000000;

(async function () {
    
    // Scenario #3 Description:
    // Sometimes you will require multiple associated keys to execute a transaction.
    // In this example, we have two associated keys with a weight equal to 1.
    // To make changes to the account, you need to use both keys to sign the transaction.
    // However, for deployment, each key can sign separately and perform deployments independently.

    // So we will need two keys.
    // It would be 'mainAccount' and 'firstAccount'.
    // From that Scenario we will start using 'setAll' function of the keyManager.
    
    // To achieve the task, we will:
    // 1. Set weight of mainAccount and firstAccount to 1.
    // 2. Set Keys Management Threshold to 2.
    // 3. Set Deploy Threshold to 1.
    // 4. Deploy account changes using 'setAll' function.
    
    const masterKey = keyManager.randomMasterKey();
    const mainAccount = masterKey.deriveIndex(1);
    const firstAccount = masterKey.deriveIndex(2);
    
    console.log("Main account: " + mainAccount.publicKey.toHex());
    console.log("First account: " + firstAccount.publicKey.toHex());
    
    let deploy;

    console.log("\n0.1 Funding main account.");
    await keyManager.fundAccount(mainAccount);
    await keyManager.printAccount(mainAccount);

    console.log("\n0.2 Install Keys Manager contract");
    deploy = keyManager.keys.buildContractInstallDeploy(mainAccount);
    await keyManager.sendDeploy(deploy, [mainAccount]);
    await keyManager.printAccount(mainAccount);
    
    // 1. Set weight of mainAccount and firstAccount to 1.
    // Weight of Accounts is 1
    const AccountWeight = 1;
    // Every account weight is set to 1
    const accounts = [
        { publicKey: mainAccount.publicKey, weight: AccountWeight },
        { publicKey: firstAccount.publicKey, weight: AccountWeight }, 
    ];
    
    // 2. Set Keys Management Threshold to 2.
    const keyManagementThreshold = 2;
    // 3. Set Deploy Threshold to 1.
    const deployThreshold = 1;
    
    // 4. Deploy account changes.
    console.log("\n 1. Set weight of mainAccount and firstAccount to 1.");
    console.log("\n 2. Set Keys Management Threshold to 2.");
    console.log("\n 3. Set Deploy Threshold to 1.");
    console.log("\n Update keys deploy.");
    
    deploy = keyManager.keys.setAll(mainAccount, deployThreshold, keyManagementThreshold, accounts);
    await keyManager.sendDeploy(deploy, [mainAccount]);
    await keyManager.printAccount(mainAccount);

})();