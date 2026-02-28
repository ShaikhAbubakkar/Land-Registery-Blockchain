import { spawn } from 'child_process'
import http from 'http'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: process.platform === 'win32'
    })

    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${command} ${args.join(' ')} failed with code ${code}`))
    })

    child.on('error', reject)
  })
}

function isPortReady() {
  return new Promise((resolve) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 8545,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      (res) => {
        resolve(res.statusCode === 200)
      }
    )

    req.on('error', () => resolve(false))
    req.write(JSON.stringify({ jsonrpc: '2.0', method: 'net_version', params: [], id: 1 }))
    req.end()
  })
}

async function waitForNode(maxAttempts = 30) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (await isPortReady()) return true
    await sleep(1000)
  }
  return false
}

async function main() {
  let hardhatNode = null
  const alreadyRunning = await isPortReady()

  if (alreadyRunning) {
    console.log('ℹ️  Local node already running on 127.0.0.1:8545')
  } else {
    console.log('🚀 Starting Hardhat node...')
    hardhatNode = spawn('npx', ['hardhat', 'node'], {
      stdio: 'inherit',
      shell: process.platform === 'win32'
    })

    const ready = await waitForNode()
    if (!ready) {
      throw new Error('Hardhat node did not become ready on port 8545')
    }
  }

  console.log('📦 Deploying contract and syncing src/config.js...')
  await run('npm', ['run', 'deploy'])

  console.log('🖥️  Starting frontend...')
  const devServer = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: process.platform === 'win32'
  })

  const cleanup = () => {
    if (devServer && !devServer.killed) devServer.kill('SIGINT')
    if (hardhatNode && !hardhatNode.killed) hardhatNode.kill('SIGINT')
    process.exit(0)
  }

  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)

  devServer.on('exit', (code) => {
    if (hardhatNode && !hardhatNode.killed) hardhatNode.kill('SIGINT')
    process.exit(code ?? 0)
  })
}

main().catch((error) => {
  console.error('❌', error.message)
  process.exit(1)
})
