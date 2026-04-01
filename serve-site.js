const { spawn } = require('child_process');
const path = require('path');

const serve = spawn('npx', ['serve', '-l', '3000', path.resolve(__dirname)], {
  stdio: 'inherit',
  shell: true
});

serve.on('error', (err) => {
  console.error('Failed to start serve:', err);
});

serve.on('close', (code) => {
  console.log(`serve exited with code ${code}`);
  process.exit(code);
});
