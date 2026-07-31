const vault = require("node-vault")({
  apiVersion: "v1",
  endpoint: process.env.VAULT_ADDR || "http://127.0.0.1:8200",
  token: process.env.VAULT_TOKEN,
});

async function loadSecretsFromVault() {
  try {
    const result = await vault.read("secret/data/edusecure/backend");
    const secrets = result.data.data;

    Object.keys(secrets).forEach((key) => {
      process.env[key] = secrets[key];
    });

    console.log("✅ Secrets successfully loaded from Vault");
  } catch (err) {
    console.error("❌ Failed to load secrets from Vault:", err.message);
    process.exit(1);
  }
}

module.exports = { loadSecretsFromVault };
