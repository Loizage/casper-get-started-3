const keyManager = require('./key-manager');
const TRANSFER_AMOUNT = process.env.TRANSFER_AMOUNT || 2500000000;

(async function () {
    
    // Scenario #4 Description:
    // In this example, you need two out of three associated keys to sign a transaction.
    // Consider a transaction where you have one key in your browser, one key on your mobile phone, and one key in your safe.
    // To do a transaction, first, you sign it with your browser extension (for example, Metamask).
    // Afterward, a notification appears on your mobile phone requesting you to approve the transaction.
    // With these two keys, you can complete the transaction.
    // However, what if you lose the two keys on your browser and phone?
    // Or, what if someone steals your browser and phone? In this case, you can use the safe key to remove the lost or stolen keys from the account.
    // Notice that the safe key’s weight is 3, which gives you the option to manage your account and add or remove keys.
    // Also, the stolen or lost keys can only enable deployments, and in this case, no one can use them to change your account.

    // So we will need three keys.
    // It would be 'safeAccount','browserAccount' and 'mobileAccount'.
    // To deploy updates to the Account we will use 'setAll' function of the keyManager.
    
    // To achieve the task, we will:
    // 1. Set weight of safeAccount to 3.
    // 2. Set weight of browserAccount and mobileAccount to 1.
    // 3. Set Keys Management Threshold to 3.
    // 4. Set Deploy Threshold to 2.
    // 5. Deploy account changes using 'setAll' function.
    
    const masterKey = keyManager.randomMasterKey();
    const safeAccount = masterKey.deriveIndex(1);
    const browserAccount = masterKey.deriveIndex(2);
    const mobileAccount = masterKey.deriveIndex(3);
    
    console.log("Safe account: " + safeAccount.publicKey.toHex());
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
    
    // 1. Set weight of safeAccount to 3.
    const safeAccountWeight = 3;
    // 2. Set weight of browserAccount and mobileAccount to 1.
    const keyAccountWeight = 1;
    const accounts = [
        { publicKey: safeAccount.publicKey, weight: safeAccountWeight },
        { publicKey: browserAccount.publicKey, weight: keyAccountWeight }, 
        { publicKey: mobileAccount.publicKey, weight: keyAccountWeight }, 
    ];
    
    // 3. Set Keys Management Threshold to 3.
    const keyManagementThreshold = 3;
    // 4. Set Deploy Threshold to 2.
    const deployThreshold = 2;
    
    // 5. Deploy account changes using 'setAll' function.
    console.log("\n 1. Set weight of safeAccount to 3.");
    console.log("\n 2. Set weight of browserAccount and mobileAccount to 1.");
    console.log("\n 3. Set Keys Management Threshold to 3.");
    console.log("\n 4. Set Deploy Threshold to 2.");
    console.log("\n Update keys deploy.");
    
    deploy = keyManager.keys.setAll(safeAccount, deployThreshold, keyManagementThreshold, accounts);
    await keyManager.sendDeploy(deploy, [safeAccount]);
    await keyManager.printAccount(safeAccount);

})();