const snarkjs = require('snarkjs');
const fs = require('fs');
const path = require('path');

async function generateProof(age) {
  const wasmPath = path.join(__dirname, '../circuits/build/compliance_js/compliance.wasm');
  const zkeyPath = path.join(__dirname, '../circuits/build/compliance_final.zkey');

  console.log(`Generating ZK proof for age: ${age}...`);
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    { age: age },
    wasmPath,
    zkeyPath
  );

  fs.writeFileSync('proof.json', JSON.stringify(proof, null, 2));
  fs.writeFileSync('public.json', JSON.stringify(publicSignals, null, 2));

  console.log('ZK proof and public signals saved to proof.json and public.json.');
}

// Example usage
const age = process.argv[2] ? parseInt(process.argv[2]) : 25;
generateProof(age).catch((err) => {
  console.error('Proof generation failed:', err);
  process.exit(1);
});