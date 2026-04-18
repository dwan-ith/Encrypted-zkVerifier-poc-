const fs = require('fs');
const https = require('https');
const snarkjs = require('snarkjs');
const { execSync } = require('child_process');
const path = require('path');

const BUILD_DIR = path.join(__dirname, '../build');
const PTAU_PATH = path.join(__dirname, '../pot12_final.ptau');
const PTAU_URL = 'https://storage.googleapis.com/zkevm/ptau/powersOfTau28_hez_final_12.ptau';

const logger = {
  info: (...args) => console.log(...args),
  error: (...args) => console.error(...args),
  debug: (...args) => console.debug(...args),
  warn: (...args) => console.warn(...args),
};

async function downloadPtau() {
  if (fs.existsSync(PTAU_PATH)) {
    console.log('ptau file already exists.');
    return;
  }

  console.log('Downloading ptau file...');
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(PTAU_PATH);
    https.get(PTAU_URL, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log('Download complete.');
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(PTAU_PATH, () => reject(err));
    });
  });
}

function compileCircuit() {
  console.log('Compiling circuit...');
  if (!fs.existsSync(BUILD_DIR)) fs.mkdirSync(BUILD_DIR);
  const circuitPath = path.join(__dirname, '../compliance.circom');
  execSync(`circom "${circuitPath}" --r1cs --wasm --sym -o "${BUILD_DIR}"`);
  console.log('Compiled.');
}

async function generateZkey() {
  console.log('Generating zkey...');
  const r1csPath = path.join(BUILD_DIR, 'compliance.r1cs');
  const zkey0 = path.join(BUILD_DIR, 'compliance_0000.zkey');
  const zkeyFinal = path.join(BUILD_DIR, 'compliance_final.zkey');

  await snarkjs.zKey.newZKey(r1csPath, PTAU_PATH, zkey0, logger);
  await snarkjs.zKey.contribute(zkey0, zkeyFinal, 'contributor', 'random_entropy_12345', logger);
  const vKey = await snarkjs.zKey.exportVerificationKey(zkeyFinal, logger);
  fs.writeFileSync(path.join(BUILD_DIR, 'verification_key.json'), JSON.stringify(vKey, null, 2));
  console.log('zkey generated.');
}

async function main() {
  const vkeyPath = path.join(BUILD_DIR, 'verification_key.json');
  if (fs.existsSync(vkeyPath)) {
    console.log('Build artifacts already exist. Skipping setup. Use --force to override (not implemented).');
    return;
  }

  await downloadPtau();
  compileCircuit();
  await generateZkey();
  console.log('Circuit setup fully complete.');
}

main().catch((err) => {
  console.error('Setup failed:', err);
  process.exit(1);
});