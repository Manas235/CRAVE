const { spawn } = require('child_process');

const ngrok = spawn('ngrok', ['http', '3000'], {
  stdio: 'inherit',
  shell: true
});

ngrok.on('error', (err) => {
  console.error('Failed to start ngrok:', err);
});

ngrok.on('close', (code) => {
  console.log(`ngrok exited with code ${code}`);
  process.exit(code);
});
