---
title: Contributing Guide
description: How to contribute to the Amethyst project
---

# 🤝 Contributing to Amethyst

We welcome contributions from the community! This guide will help you get started with contributing to the Amethyst project.

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn** or **bun**
- **Git**
- **Docker** (for running tests)

### Development Setup

1. **Fork the Repository**

```bash
# Fork the main repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR-USERNAME/amethyst.git
cd amethyst
```

2. **Install Dependencies**

```bash
# Install all dependencies
npm install

# Or using yarn
yarn install

# Or using bun
bun install
```

3. **Set Up Environment**

```bash
# Copy environment template
cp .env.example .env

# Edit the .env file with your local settings
nano .env
```

4. **Start Development Services**

```bash
# Start PostgreSQL and Redis with Docker
docker-compose up -d postgres redis

# Run database migrations
npm run migrate

# Start the development server
npm run dev
```

## 📋 Development Workflow

### Branch Naming Convention

Use descriptive branch names with prefixes:

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions/improvements

```bash
# Examples
git checkout -b feature/user-authentication
git checkout -b fix/database-connection-issue
git checkout -b docs/api-reference-update
```

### Commit Message Format

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

**Examples:**

```bash
git commit -m "feat(auth): add JWT token refresh mechanism"
git commit -m "fix(database): resolve connection pool timeout issue"
git commit -m "docs(api): update user endpoint documentation"
```

### Code Style Guidelines

We use ESLint and Prettier for code formatting:

```bash
# Check code style
npm run lint

# Fix auto-fixable issues
npm run lint:fix

# Format code with Prettier
npm run format
```

#### TypeScript Guidelines

```typescript
// ✅ Good: Use explicit types
interface UserCreateRequest {
  email: string;
  username: string;
  password: string;
}

// ✅ Good: Use meaningful names
const getUserById = async (userId: number): Promise<User | null> => {
  return userRepository.findOne({ where: { id: userId } });
};

// ❌ Bad: Avoid 'any' type
const processData = (data: any) => {
  // ...
};

// ✅ Good: Use proper error handling
try {
  const user = await userService.create(userData);
  return { success: true, data: user };
} catch (error) {
  if (error instanceof ValidationError) {
    throw new BadRequestException(error.message);
  }
  throw new InternalServerErrorException('Failed to create user');
}
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- user.service.test.ts

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e
```

### Writing Tests

#### Unit Tests

```typescript
// tests/services/user.service.test.ts
import { Test, TestingModule } from '@amethyst/testing';
import { UserService } from '../../src/services/user.service';
import { Repository } from '@amethyst/database';
import { User } from '../../src/entities/user.entity';

describe('UserService', () => {
  let service: UserService;
  let userRepository: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: Repository,
          useValue: {
            create: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get(Repository);
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
      };
      const expectedUser = { id: 1, ...userData };
      userRepository.create.mockResolvedValue(expectedUser);

      // Act
      const result = await service.createUser(userData);

      // Assert
      expect(userRepository.create).toHaveBeenCalledWith(userData);
      expect(result).toEqual(expectedUser);
    });

    it('should throw error for duplicate email', async () => {
      // Arrange
      const userData = {
        email: 'existing@example.com',
        username: 'testuser',
        password: 'password123',
      };
      userRepository.create.mockRejectedValue(
        new Error('UNIQUE constraint failed: users.email')
      );

      // Act & Assert
      await expect(service.createUser(userData)).rejects.toThrow(
        'Email already exists'
      );
    });
  });
});
```

#### Integration Tests

```typescript
// tests/integration/user.controller.test.ts
import { Test } from '@amethyst/testing';
import { AmethystApplication } from '@amethyst/core';
import { UserController } from '../../src/controllers/user.controller';
import request from 'supertest';

describe('UserController (Integration)', () => {
  let app: AmethystApplication;
  let server: any;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [UserController],
    }).compile();

    app = moduleRef.createAmethystApplication();
    server = app.getHttpServer();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'newuser@example.com',
        username: 'newuser',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const response = await request(server)
        .post('/api/users')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.email).toBe(userData.email);
      expect(response.body.data).not.toHaveProperty('password');
    });
  });
});
```

### Test Coverage Requirements

- **Unit Tests**: Minimum 80% coverage
- **Integration Tests**: Cover all API endpoints
- **E2E Tests**: Cover critical user flows

## 📚 Documentation

### Code Documentation

Use JSDoc comments for functions and classes:

```typescript
/**
 * Creates a new user in the system
 * @param userData - The user data to create
 * @returns Promise resolving to the created user
 * @throws {BadRequestException} When validation fails
 * @throws {ConflictException} When email already exists
 * @example
 * ```typescript
 * const user = await userService.createUser({
 *   email: 'user@example.com',
 *   username: 'johndoe',
 *   password: 'securepassword'
 * });
 * ```
 */
async createUser(userData: CreateUserDto): Promise<User> {
  // Implementation
}
```

### API Documentation

Update OpenAPI/Swagger documentation when adding new endpoints:

```typescript
@Controller('/api/users')
@ApiTags('Users')
export class UserController {
  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async createUser(@Body() createUserDto: CreateUserDto) {
    // Implementation
  }
}
```

## 🔍 Code Review Process

### Before Submitting a PR

1. **Self-Review Checklist**
   - [ ] Code follows style guidelines
   - [ ] All tests pass
   - [ ] Documentation is updated
   - [ ] No console.log statements
   - [ ] Error handling is proper
   - [ ] Performance considerations addressed

2. **Create Pull Request**

```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests pass locally
```

### Review Guidelines

**For Reviewers:**

- Focus on code quality, not personal preferences
- Provide constructive feedback
- Suggest improvements with examples
- Approve when ready, request changes when needed

**For Authors:**

- Respond to all feedback
- Make requested changes promptly
- Ask for clarification when needed
- Be open to suggestions

## 🚀 Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Workflow

1. **Prepare Release**

```bash
# Update version
npm version patch|minor|major

# Update CHANGELOG.md
# Commit changes
git commit -m "chore: prepare release v1.2.3"

# Create release tag
git tag v1.2.3
```

2. **Publish Release**

```bash
# Push changes and tags
git push origin main --tags

# Publish to npm (maintainers only)
npm publish
```

## 🎯 Areas for Contribution

### High Priority

- **Performance Optimizations**
- **Security Enhancements**
- **Test Coverage Improvements**
- **Documentation Updates**
- **Bug Fixes**

### Feature Requests

- **GraphQL Support**
- **WebSocket Improvements**
- **Database Migrations**
- **Monitoring & Metrics**
- **CLI Enhancements**

### Good First Issues

Look for issues labeled `good-first-issue` in our GitHub repository. These are perfect for new contributors!

## 💬 Community

### Communication Channels

- **Discord**: [Join our server](https://discord.gg/amethyst)
- **GitHub Discussions**: [Ask questions](https://github.com/amethyst-dev/core/discussions)
- **Twitter**: [@AmethystDev](https://twitter.com/amethystdev)

### Code of Conduct

Please read and follow our [Code of Conduct](./code-of-conduct.md). We're committed to providing a welcoming and inclusive environment for all contributors.

## 🏆 Recognition

Contributors are recognized in several ways:

- **Contributors List**: Added to README.md
- **Release Notes**: Mentioned in changelog
- **Discord Role**: Special contributor role
- **Swag**: Stickers and merchandise for significant contributions

## ❓ Getting Help

If you need help:

1. Check existing documentation
2. Search GitHub issues
3. Ask in Discord #dev-help channel
4. Create a GitHub discussion
5. Reach out to maintainers

---

Thank you for contributing to Amethyst! Every contribution, no matter how small, helps make the project better for everyone. 🚀
