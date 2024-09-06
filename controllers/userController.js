import bcrypt from 'bcrypt';
import { ValidationError } from 'sequelize';

export async function register(request, reply) {
  const { username, email, password } = request.body;

  if (!username || !email || !password) {
    return reply.badRequest('Username, email, and password are required', null, 400);
  }

  try {
    // Periksa apakah email sudah ada
    const existingUser = await request.server.localDb.User.findOne({ where: { email } });
    if (existingUser) {
      return reply.badRequest('Email already in use', null, 400);
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with default role as 'admin'
    const user = await request.server.localDb.User.create({
      username,
      email,
      password: hashedPassword
    });

    return reply.status(201).send(reply.formatResponse('User created successfully', {
      id: user.id,
      username: user.username,
      email: user.email
    }, 201));
  } catch (error) {
    console.error('Error creating user:', error);

    if (error instanceof ValidationError) {
      return reply.badRequest(error.message, null, 400);
    }

    return reply.internalServerError(error);
  }
}

export async function getUser(request, reply) {
  const userId = request.params.id;

  try {
    const user = await request.server.localDb.User.findByPk(userId);

    if (user) {
      return reply.send(reply.formatResponse('User retrieved successfully', user, 200));
    }

    return reply.notFound('User not found')
  } catch (error) {
    console.error('Error retrieving user:', error);
    return reply.internalServerError(error);
  }
}
export async function getAllUsers(request, reply) {
  try {
    const users = await request.server.localDb.User.findAll();

    return reply.send(reply.formatResponse('Users retrieved successfully', users, 200));
  } catch (error) {
    console.error('Error retrieving users:', error);
    return reply.internalServerError(error);
  }
}

export async function updateUser(request, reply) {
  const userId = request.params.id;
  const { username, password, role } = request.body;

  try {
    const user = await request.server.localDb.User.findByPk(userId);

    if (!user) {
      return reply.status(404).send(reply.formatError('User not found', null, 404));
    }

    if (username) user.username = username;
    if (password) user.password = await bcrypt.hash(password, 10);
    if (role) user.role = role;

    await user.save();
    return reply.send(reply.formatResponse('User updated successfully', user, 200));
  } catch (error) {
    console.error('Error updating user:', error);
    return reply.internalServerError(error)
  }
}

export async function deleteUser(request, reply) {
  const userId = request.params.id;

  try {
    const user = await request.server.localDb.User.findByPk(userId);

    if (!user) {
      return reply.notFound()
    }

    await user.destroy();
    return reply.status(204).send(reply.formatResponse('User deleted successfully', null, 204));
  } catch (error) {
    console.error('Error deleting user:', error);
    return reply.internalServerError(error)
  }
}