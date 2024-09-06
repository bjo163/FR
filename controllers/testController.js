import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function testApi(request, reply) {
  try {
    const { stdout, stderr } = await execPromise('npm test -- --watchAll=false'); // Run all tests

    if (stderr) {
      return reply.status(500).send({ message: 'Error running tests', error: stderr });
    }

    return reply.send({ message: 'Tests completed successfully', output: stdout });
  } catch (error) {
    return reply.status(500).send({ message: 'Error running tests', error: error.message });
  }
}
