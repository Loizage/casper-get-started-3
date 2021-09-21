const keyManager = require('./key-manager');
const TRANSFER_AMOUNT = process.env.TRANSFER_AMOUNT || 2500000000;

(async function () {
    
    // Scenario #5 Description:
    // This example builds upon the Scenario #4 example, where you can set up multiple safe keys for account management.
    // In this scenario, the safe keys have the weight required to manage your keys and account.

    // So we will need 5 keys.
    // It would be 'safeAccount','safeAccount1','safeAccount2','browserAccount' and 'mobileAccount'.
    // To deploy updates to the Account we will use 'setAll' function of the keyManager.
    
    // To achieve the task, we will:
    // 1. Set weight of all safe accounts to 3.
    // 2. Set weight of browserAccount and mobileAccount to 1.
    // 3. Set Keys Management Threshold to 3.
    // 4. Set Deploy Threshold to 2.
    // 5. Deploy account changes using 'setAll' function.
    
    const masterKey = keyManager.randomMasterKey();
    const safeAccount = masterKey.deriveIndex(1);
    const safeAccount1 = masterKey.deriveIndex(2);
    const safeAccount2 = masterKey.deriveIndex(2);
    const browserAccount = masterKey.deriveIndex(3);
    const mobileAccount = masterKey.deriveIndex(4);
    
    console.log("Main account: " + safeAccount.publicKey.toHex());
    console.log("Safe account #1: " + safeAccount1.publicKey.toHex());
    console.log("Safe account #2: " + safeAccount2.publicKey.toHex());
    console.log("Browser account: " + browserAccount.publicKey.toHex());
    console.log("Mobile account: " + mobileAccount.publicKey.toHex());
    
    let deploy;

    console.log("\n0.1 Funding safe account.");
    await keyManager.fundAccount(safeAccount);
    await keyManager.printAccount(safeAccount);

    console.log("\n0.2 Install Keys Manager contract");
    deploy = keyManager.keys.buildContractInstallDeploy(safeAccount);
    await keyManager.sendDeploy(deploy, [safeAccount]);
    await keyManager.printAccount(safeAccount);
    
    // 1. Set weight of all safe accounts to 3.
    const safeAccountWeight = 3;
    // 2. Set weight of browserAccount and mobileAccount to 1.
    const keyAccountWeight = 1;
    const accounts = [
        { publicKey: safeAccount.publicKey, weight: safeAccountWeight },
        { publicKey: safeAccount1.publicKey, weight: safeAccountWeight },
        { publicKey: safeAccount2.publicKey, weight: safeAccountWeight },
        { publicKey: browserAccount.publicKey, weight: keyAccountWeight }, 
        { publicKey: mobileAccount.publicKey, weight: keyAccountWeight }, 
    ];
    
    // 3. Set Keys Management Threshold to 3.
    const keyManagementThreshold = 3;
    // 4. Set Deploy Threshold to 2.
    const deployThreshold = 2;
    
    // 5. Deploy account changes using 'setAll' function.
    console.log("\n 1. Set weight of both safe accounts to 3.");
    console.log("\n 2. Set weight of browserAccount and mobileAccount to 1.");
    console.log("\n 3. Set Keys Management Threshold to 3.");
    console.log("\n 4. Set Deploy Threshold to 2.");
    console.log("\n Update keys deploy.");
    
    deploy = keyManager.keys.setAll(safeAccount, deployThreshold, keyManagementThreshold, accounts);
    await keyManager.sendDeploy(deploy, [safeAccount]);
    await keyManager.printAccount(safeAccount);

})();