import * as anchor from "@coral-xyz/anchor";

module.exports = async function (provider) {
  anchor.setProvider(provider);

  const program = anchor.workspace.Zkverifier;

  // Deploy logic if needed
  console.log("Deployed at:", program.programId.toString());
};