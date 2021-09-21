const keyManager = require('./key-manager');
const TRANSFER_AMOUNT = process.env.TRANSFER_AMOUNT || 2500000000;

(async function () {
    
    // Scenario #2 Description:
    // In this example, you have two keys.
    // One key can only perform deployments, while the second key can perform key management and deployments.
    // The key with account address a1 can deploy and make account changes, but the second key with account address b2 can only deploy.

    // So we will need two keys.
    // It would be 'mainAccount' and 'firstAccount'.
    
    // To achieve the task, we will:
    // 1. Set weight of mainAccount to 2.
    // 2. Set weight of firstAccount to 1.
    // 3. Set Keys Management Threshold to 2.
    // 4. Set Deploy Threshold to 1.
    
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
    
    // Deploy threshhold is 1
    const deployThreshold = 1;
    // Key Managment threshhold is 2
    const keyManagementThreshold = 2;
    // Weight of mainAccount is 2
    const mainAccountWeight = 2;
    // Weight of firstAccount is 1
    const firstAccountWeight = 1;

    // 1. Set weight of mainAccount to 2.
    console.log("\n1. Set weight of mainAccount to 2.");
    deploy = keyManager.keys.setKeyWeightDeploy(mainAccount,mainAccount,mainAccountWeight);
    await keyManager.sendDeploy(deploy, [mainAccount]);
    await keyManager.printAccount(mainAccount);
    
    // 2. Set weight of firstAccount to 1.
    console.log("\n1. 2. Set weight of firstAccount to 1.");
    deploy = keyManager.keys.setKeyWeightDeploy(mainAccount,firstAccount,firstAccountWeight);
    await keyManager.sendDeploy(deploy, [mainAccount]);
    await keyManager.printAccount(mainAccount);
    
    // 3. Set Keys Management Threshold to 2.
    console.log("\n2. 3. Set Keys Management Threshold to 2.");
    deploy = keyManager.keys.setKeyManagementThresholdDeploy(mainAccount, keyManagementThreshold);
    await keyManager.sendDeploy(deploy, [mainAccount]);
    await keyManager.printAccount(mainAccount);

    // 4. Set Deploy Threshold to 1.
    console.log("\n3. 4. Set Deploy Threshold to 1.");
    deploy = keyManager.keys.setDeploymentThresholdDeploy(mainAccount, deployThreshold);
    await keyManager.sendDeploy(deploy, [mainAccount]);
    await keyManager.printAccount(mainAccount);
    
})();