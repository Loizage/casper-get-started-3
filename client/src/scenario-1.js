const keyManager = require('./key-manager');
const TRANSFER_AMOUNT = process.env.TRANSFER_AMOUNT || 2500000000;

(async function () {
    
    // Scenario #1 Description:
    // In this example, only one key can sign transactions in the name of this account.
    // The key is “account-hash-a1…” under the associated_keys.
    // If you sign the transaction using “account-hash-a1…”, the signed transaction will have a weight equal to 1.
    // For deployments or key management, the weight required is also 1.
    // Therefore, the associated key meets the deployment and key management thresholds and can perform both actions.

    // So we will need only one key.
    // It would be 'mainAccount'.

    // To achieve the task, we will:
    // 1. Set weight of mainAccount to 1.
    // 2. Set Keys Management Threshold to 1.
    // 3. Set Deploy Threshold to 1.
    
    const masterKey = keyManager.randomMasterKey();
    const mainAccount = masterKey.deriveIndex(1);
    
    console.log("Main account: " + mainAccount.publicKey.toHex());
    
    let deploy;

    console.log("\n0.1 Funding main account.");
    await keyManager.fundAccount(mainAccount);
    await keyManager.printAccount(mainAccount);

    console.log("\n0.2 Install Keys Manager contract");
    deploy = keyManager.keys.buildContractInstallDeploy(mainAccount);
    await keyManager.sendDeploy(deploy, [mainAccount]);
    await keyManager.printAccount(mainAccount);
    
    //Deploy and Key Managment threshholds are 1 out of 1
    const deployThreshold = 1;
    const keyManagementThreshold = 1;
    //Weight of mainAccount is 1
    const mainAccountWeight = 1;

    // 1. Set weight of mainAccount to 1.
    console.log("\n1. Set weight of mainAccount to 1.");
    deploy = keyManager.keys.setKeyWeightDeploy(mainAccount,mainAccount,mainAccountWeight);
    await keyManager.sendDeploy(deploy, [mainAccount]);
    await keyManager.printAccount(mainAccount);
    
    // 2. Set Keys Management Threshold to 1.
    console.log("\n2. Set Keys Management Threshold to 1.");
    deploy = keyManager.keys.setKeyManagementThresholdDeploy(mainAccount, keyManagementThreshold);
    await keyManager.sendDeploy(deploy, [mainAccount]);
    await keyManager.printAccount(mainAccount);

    // 3. Set Deploy Threshold to 1.
    console.log("\n3. Set Deploy Threshold to 1.");
    deploy = keyManager.keys.setDeploymentThresholdDeploy(mainAccount, deployThreshold);
    await keyManager.sendDeploy(deploy, [mainAccount]);
    await keyManager.printAccount(mainAccount);

})();