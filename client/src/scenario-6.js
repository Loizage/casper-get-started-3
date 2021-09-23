const keyManager = require('./key-manager');
const TRANSFER_AMOUNT = process.env.TRANSFER_AMOUNT || 2500000000;

(async function () {
    
    // Scenario #6 Description:
    // Suppose you lose your account key; in this case, “account-hash-00…”, you can set up other keys to execute transactions.
    // Although not recommended, you can throw away the private key of your account or set its weight to zero,
    // and you would still be able to execute transactions if your faucet account has backup keys that can perform key management.

    // So we will need 6 keys.
    // It would be 'mainAccount','safeAccount','safeAccount1','safeAccount2','browserAccount' and 'mobileAccount'.
    // To deploy updates to the Account we will use 'setAll' function of the keyManager.
    // After losing the main key, we will set it's weight to 0

    // To achieve the task, we will:
    // 1. Set weight of mainAccount and safe accounts to 3.
    // 2. Set weight of browserAccount and mobileAccount to 1.
    // 3. Set Keys Management Threshold to 3.
    // 4. Set Deploy Threshold to 2.
    // 5. Deploy account changes using 'setAll' function.
    // 6. Set weight of lost mainAccount key to 0.
    
    const masterKey = keyManager.randomMasterKey();
    const mainAccount = masterKey.deriveIndex(1);
    const safeAccount1 = masterKey.deriveIndex(2);
    const safeAccount2 = masterKey.deriveIndex(3);
    const safeAccount3 = masterKey.deriveIndex(4);
    const browserAccount = masterKey.deriveIndex(5);
    const mobileAccount = masterKey.deriveIndex(6);
    
    console.log("Main account: " + mainAccount.publicKey.toHex());
    console.log("Safe account #1: " + safeAccount1.publicKey.toHex());
    console.log("Safe account #2: " + safeAccount2.publicKey.toHex());
    console.log("Safe account #3: " + safeAccount3.publicKey.toHex());
    console.log("Browser account: " + browserAccount.publicKey.toHex());
    console.log("Mobile account: " + mobileAccount.publicKey.toHex());
    
    let deploy;

    console.log("\n0.1 Funding safe account.");
    await keyManager.fundAccount(mainAccount);
    await keyManager.printAccount(mainAccount);

    console.log("\n0.2 Install Keys Manager contract");
    deploy = keyManager.keys.buildContractInstallDeploy(mainAccount);
    await keyManager.sendDeploy(deploy, [mainAccount]);
    await keyManager.printAccount(mainAccount);
    
    // 1. Set weight of mainAccount and safe accounts to 3.
    const safeAccountWeight = 3;
    // 2. Set weight of browserAccount and mobileAccount to 1.
    const keyAccountWeight = 1;
    const accounts = [
        { publicKey: mainAccount.publicKey, weight: safeAccountWeight },
        { publicKey: safeAccount1.publicKey, weight: safeAccountWeight },
        { publicKey: safeAccount2.publicKey, weight: safeAccountWeight },
        { publicKey: safeAccount3.publicKey, weight: safeAccountWeight },
        { publicKey: browserAccount.publicKey, weight: keyAccountWeight }, 
        { publicKey: mobileAccount.publicKey, weight: keyAccountWeight }, 
    ];
    
    // 3. Set Keys Management Threshold to 3.
    const keyManagementThreshold = 3;
    // 4. Set Deploy Threshold to 2.
    const deployThreshold = 2;
    
    // 5. Deploy account changes using 'setAll' function.
    console.log("\n 1. Set weight of mainAccount and safe accounts to 3.");
    console.log("\n 2. Set weight of browserAccount and mobileAccount to 1.");
    console.log("\n 3. Set Keys Management Threshold to 3.");
    console.log("\n 4. Set Deploy Threshold to 2.");
    console.log("\n 5. Update keys deploy.");
    
    deploy = keyManager.keys.setAll(mainAccount, deployThreshold, keyManagementThreshold, accounts);
    await keyManager.sendDeploy(deploy, [mainAccount]);
    await keyManager.printAccount(mainAccount);

    // 6. Set weight of lost mainAccount key to 0.
    const lostAccountWeight = 0;
    console.log("\n 6. Set weight of lost mainAccount key to 0.");
    deploy = keyManager.keys.setKeyWeightDeploy(mainAccount,mainAccount,lostAccountWeight);
    await keyManager.sendDeploy(deploy, [safeAccount1]);
    await keyManager.printAccount(mainAccount);
    
})();