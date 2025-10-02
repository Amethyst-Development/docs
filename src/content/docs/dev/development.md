---
title: Development Status
description: Current development status of Amethyst Documentation and API
version: "1.0.0-beta"
---

# 🚧 Amethyst Development Hub

Welcome to the Amethyst Development documentation! This comprehensive guide covers all aspects of developing with the Amethyst framework, from basic setup to advanced plugin development.

## 🎯 Current Development Status

:::tip[Active Development]
Amethyst is currently in **beta phase** with active development across all core modules. API stability is improving with each release.
:::

### Core Components Status

| Component | Status | Version | Coverage |
|-----------|--------|---------|----------|
| Core API | 🟡 Beta | 1.0.0-beta.3 | 85% |
| Plugin System | 🟢 Stable | 1.2.1 | 95% |
| Event System | 🟡 Beta | 0.9.2 | 78% |
| Configuration | 🟢 Stable | 1.1.0 | 92% |
| Database Layer | 🔴 Alpha | 0.5.1 | 45% |

## 🚀 Quick Start

Get up and running with Amethyst in minutes:

### Installation

```bash
# Install Amethyst CLI
npm install -g @amethyst/cli

# Create new project
amethyst create my-project

# Navigate to project
cd my-project

# Install dependencies
npm install

# Start development server
npm run dev
```

### Basic Configuration

```yaml
# amethyst.config.yml
name: "My Amethyst Project"
version: "1.0.0"
description: "A powerful Amethyst application"

server:
  port: 3000
  host: "localhost"
  
database:
  type: "postgresql"
  host: "localhost"
  port: 5432
  database: "amethyst_db"
  
plugins:
  - "@amethyst/auth"
  - "@amethyst/cache"
  - "./plugins/custom-plugin"

features:
  hot_reload: true
  debug_mode: true
  auto_migration: true
```

## 📚 Core API Overview

### AmethystApplication Class

The main application class that bootstraps your Amethyst project:

```typescript
import { AmethystApplication, Controller, Get } from '@amethyst/core';

@Controller('/api')
class AppController {
  @Get('/health')
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION
    };
  }
}

const app = new AmethystApplication({
  controllers: [AppController],
  port: 3000
});

app.listen().then(() => {
  console.log('🚀 Amethyst application started on port 3000');
});
```

### Database Integration

```typescript
import { Entity, Column, Repository } from '@amethyst/database';

@Entity('users')
export class User {
  @Column({ primary: true, generated: true })
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  username: string;

  @Column({ select: false })
  password: string;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}

// Repository usage
const userRepository = new Repository(User);

// Create user
const newUser = await userRepository.create({
  email: 'user@example.com',
  username: 'johndoe',
  password: 'hashedPassword123'
});

// Find users
const users = await userRepository.find({
  where: { active: true },
  order: { createdAt: 'DESC' },
  limit: 10
});
```

## 🔌 Plugin Development

### Creating a Custom Plugin

```typescript
// plugins/analytics-plugin.ts
import { 
  Plugin, 
  OnApplicationStart, 
  OnApplicationShutdown,
  Injectable,
  Logger 
} from '@amethyst/core';

@Plugin({
  name: 'analytics-plugin',
  version: '1.0.0',
  dependencies: ['@amethyst/http']
})
@Injectable()
export class AnalyticsPlugin implements OnApplicationStart, OnApplicationShutdown {
  private readonly logger = new Logger(AnalyticsPlugin.name);
  private metricsCollector: MetricsCollector;

  async onApplicationStart() {
    this.logger.log('🔍 Analytics plugin starting...');
    
    this.metricsCollector = new MetricsCollector({
      endpoint: process.env.ANALYTICS_ENDPOINT,
      apiKey: process.env.ANALYTICS_API_KEY,
      batchSize: 100,
      flushInterval: 30000
    });

    await this.metricsCollector.initialize();
    this.logger.log('✅ Analytics plugin started successfully');
  }

  async onApplicationShutdown() {
    this.logger.log('🔄 Shutting down analytics plugin...');
    await this.metricsCollector.flush();
    await this.metricsCollector.disconnect();
    this.logger.log('✅ Analytics plugin shutdown complete');
  }

  trackEvent(event: AnalyticsEvent) {
    return this.metricsCollector.track(event);
  }
}
```

## 🧪 Testing Framework

### Unit Tests

```typescript
// tests/user.service.test.ts
import { Test, TestingModule } from '@amethyst/testing';
import { UserService } from '../src/services/user.service';

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      };

      const result = await service.createUser(userData);
      expect(result).toBeDefined();
      expect(result.email).toBe(userData.email);
    });
  });
});
```

## 📋 Roadmap

### Version 1.0.0 (Current Sprint)
- [ ] Complete Core API stabilization
- [ ] Finalize Plugin Architecture
- [ ] Enhanced Error Handling
- [ ] Performance Optimizations

### Version 1.1.0 (Next Quarter)
- [ ] GraphQL Integration
- [ ] WebSocket Support
- [ ] Advanced Caching Layer
- [ ] Microservices Support

---

*Last updated: December 2024 | Version: 1.0.0-beta.3*