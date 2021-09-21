const keyManager = require('./key-manager');
const TRANSFER_AMOUNT = process.env.TRANSFER_AMOUNT || 2500000000;

(async function () {
    
    // Scenario #6 Description:
    // Suppose you lose your account key; in this case, “account-hash-00…”, you can set up other keys to execute transactions.
    // Although not recommended, you can throw away the private key of your account or set its weight to zero,
    // and you would still be able to execute transactions if your faucet account has backup keys that can perform key management.

    // So we will need at least two keys.
    // However I will create 3 keys
    // It would be 'mainAccount', 'firstAccount' and 'backupAccount'
    // To deploy updates to the Account we will use 'setAll' function of the keyManager.
    
    // To achieve the task, we will:
    // 1. Set weight of both mainAccount and backupAccount to 2.
    // 2. Set weight of firstAccount to 1.
    // 3. Set Keys Management Threshold to 2.
    // 4. Set Deploy Threshold to 1.
    // 5. Deploy account changes using 'setAll' function.
    // 6. Set weight of lost mainAccount key to 0.
    
    const masterKey = keyManager.randomMasterKey();
    const mainAccount = masterKey.deriveIndex(1);
    const firstAccount = masterKey.deriveIndex(2);
    const backupAccount = masterKey.deriveIndex(3);
    
    console.log("Main account: " + mainAccount.publicKey.toHex());
    console.log("First account: " + firstAccount.publicKey.toHex());
    console.log("Backup account: " + backupAccount.publicKey.toHex());
    
    let deploy;

    console.log("\n0.1 Funding main account.");
    await keyManager.fundAccount(mainAccount);
    await keyManager.printAccount(mainAccount);

    console.log("\n0.2 Install Keys Manager contract");
    deploy = keyManager.keys.buildContractInstallDeploy(mainAccount);
    await keyManager.sendDeploy(deploy, [mainAccount]);
    await keyManager.printAccount(mainAccount);
    
    // 1. Set weight of both mainAccount and backupAccount to 2.
    const manageAccountWeight = 3;
    // 2. Set weight of firstAccount to 1.
    const keyAccountWeight = 1;
    const accounts = [
        { publicKey: mainAccount.publicKey, weight: manageAccountWeight },
        { publicKey: backupAccount.publicKey, weight: manageAccountWeight },
        { publicKey: firstAccount.publicKey, weight: keyAccountWeight }, 
    ];
    
    // 3. Set Keys Management Threshold to 2.
    const keyManagementThreshold = 2;
    // 4. Set Deploy Threshold to 1.
    const deployThreshold = 1;
    
    // 5. Deploy account changes using 'setAll' function.
    console.log("\n 1. Set weight of both mainAccount and backupAccount to 2.");
    console.log("\n 2. Set weight of firstAccount to 1.");
    console.log("\n 3. Set Keys Management Threshold to 2.");
    console.log("\n 4. Set Deploy Threshold to 1.");
    console.log("\n 5. Update keys deploy.");
    
    deploy = keyManager.keys.setAll(mainAccount, deployThreshold, keyManagementThreshold, accounts);
    await keyManager.sendDeploy(deploy, [mainAccount]);
    await keyManager.printAccount(mainAccount);

    // 6. Set weight of lost mainAccount key to 0.
    const lostAccountWeight = 0;
    console.log("\n 6. Set weight of lost mainAccount key to 0.");
    deploy = keyManager.keys.setKeyWeightDeploy(mainAccount,mainAccount,lostAccountWeight);
    await keyManager.sendDeploy(deploy, [backupAccount]);
    await keyManager.printAccount(mainAccount);
    
})();