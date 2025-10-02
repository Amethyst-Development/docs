---
title: Code Examples
description: Practical code examples and tutorials for Amethyst development
---

# 💻 Code Examples

Practical examples to help you get started with Amethyst development.

## Basic REST API

### Simple User Management API

```typescript
// entities/user.entity.ts
import { Entity, Column } from '@amethyst/database';

@Entity('users')
export class User {
  @Column({ primary: true, generated: true })
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ select: false })
  password: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
```

```typescript
// dto/create-user.dto.ts
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString({ message: 'First name must be a string' })
  @MaxLength(50, { message: 'First name cannot exceed 50 characters' })
  firstName: string;

  @IsString({ message: 'Last name must be a string' })
  @MaxLength(50, { message: 'Last name cannot exceed 50 characters' })
  lastName: string;

  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;
}
```

```typescript
// services/user.service.ts
import { Injectable } from '@amethyst/core';
import { Repository } from '@amethyst/database';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  private userRepository = new Repository(User);

  async create(createUserDto: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    
    const user = await this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    // Remove password from response
    delete user.password;
    return user;
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id, isActive: true },
    });
  }

  async update(id: number, updateData: Partial<User>): Promise<User> {
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    return this.userRepository.update(id, updateData);
  }

  async delete(id: number): Promise<boolean> {
    return this.userRepository.update(id, { isActive: false });
  }
}
```

```typescript
// controllers/user.controller.ts
import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@amethyst/core';
import { UserService } from '../services/user.service';
import { CreateUserDto } from '../dto/create-user.dto';

@Controller('/api/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    const user = await this.userService.create(createUserDto);
    return {
      success: true,
      message: 'User created successfully',
      data: user,
    };
  }

  @Get()
  async getUsers(@Query('page') page: number = 1, @Query('limit') limit: number = 10) {
    const users = await this.userService.findAll();
    return {
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total: users.length,
      },
    };
  }

  @Get('/:id')
  async getUser(@Param('id') id: string) {
    const user = await this.userService.findById(parseInt(id));
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      success: true,
      data: user,
    };
  }

  @Put('/:id')
  async updateUser(@Param('id') id: string, @Body() updateData: Partial<CreateUserDto>) {
    const user = await this.userService.update(parseInt(id), updateData);
    return {
      success: true,
      message: 'User updated successfully',
      data: user,
    };
  }

  @Delete('/:id')
  async deleteUser(@Param('id') id: string) {
    const deleted = await this.userService.delete(parseInt(id));
    return {
      success: deleted,
      message: deleted ? 'User deleted successfully' : 'Failed to delete user',
    };
  }
}
```

## Authentication System

### JWT Authentication

```typescript
// services/auth.service.ts
import { Injectable, UnauthorizedException } from '@amethyst/core';
import { UserService } from './user.service';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  async login(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    
    if (!user || !await bcrypt.compare(password, user.password)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email };
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '1h' });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
      const user = await this.userService.findById(payload.sub);
      
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const newPayload = { sub: user.id, email: user.email };
      const accessToken = jwt.sign(newPayload, process.env.JWT_SECRET!, { expiresIn: '1h' });

      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateToken(token: string) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
      return await this.userService.findById(payload.sub);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
```

```typescript
// middleware/auth.middleware.ts
import { Middleware, Request, Response, NextFunction } from '@amethyst/core';
import { AuthService } from '../services/auth.service';

@Middleware()
export class AuthMiddleware {
  constructor(private readonly authService: AuthService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token required',
      });
    }

    try {
      const user = await this.authService.validateToken(token);
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token',
      });
    }
  }
}
```

```typescript
// controllers/auth.controller.ts
import { Controller, Post, Body } from '@amethyst/core';
import { AuthService } from '../services/auth.service';

@Controller('/api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  async login(@Body() loginDto: { email: string; password: string }) {
    const result = await this.authService.login(loginDto.email, loginDto.password);
    return {
      success: true,
      message: 'Login successful',
      data: result,
    };
  }

  @Post('/refresh')
  async refreshToken(@Body() refreshDto: { refreshToken: string }) {
    const result = await this.authService.refreshToken(refreshDto.refreshToken);
    return {
      success: true,
      data: result,
    };
  }
}
```

## File Upload System

### Image Upload with Validation

```typescript
// services/file.service.ts
import { Injectable, BadRequestException } from '@amethyst/core';
import * as multer from 'multer';
import * as path from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class FileService {
  private readonly uploadDir = './uploads';
  private readonly maxFileSize = 5 * 1024 * 1024; // 5MB
  private readonly allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];

  constructor() {
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  getMulterConfig() {
    return multer({
      storage: multer.diskStorage({
        destination: (req, file, cb) => {
          cb(null, this.uploadDir);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        },
      }),
      fileFilter: (req, file, cb) => {
        if (this.allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Invalid file type. Only JPEG, PNG, and GIF are allowed.'));
        }
      },
      limits: {
        fileSize: this.maxFileSize,
      },
    });
  }

  async deleteFile(filename: string): Promise<boolean> {
    try {
      await fs.unlink(path.join(this.uploadDir, filename));
      return true;
    } catch {
      return false;
    }
  }

  getFileUrl(filename: string): string {
    return `/uploads/${filename}`;
  }
}
```

```typescript
// controllers/upload.controller.ts
import { Controller, Post, UseMiddleware, Request } from '@amethyst/core';
import { FileService } from '../services/file.service';

@Controller('/api/upload')
export class UploadController {
  constructor(private readonly fileService: FileService) {}

  @Post('/image')
  @UseMiddleware(this.fileService.getMulterConfig().single('image'))
  async uploadImage(@Request() req: any) {
    if (!req.file) {
      throw new BadRequestException('No file uploaded');
    }

    return {
      success: true,
      message: 'File uploaded successfully',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        url: this.fileService.getFileUrl(req.file.filename),
      },
    };
  }
}
```

## Real-time Features with WebSockets

### Chat System

```typescript
// services/websocket.service.ts
import { Injectable } from '@amethyst/core';
import { Server, Socket } from 'socket.io';

@Injectable()
export class WebSocketService {
  private io: Server;
  private connectedUsers = new Map<string, { socket: Socket; userId: number }>();

  initialize(server: any) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
      },
    });

    this.io.on('connection', (socket: Socket) => {
      console.log('User connected:', socket.id);

      socket.on('join', (data: { userId: number; room: string }) => {
        this.connectedUsers.set(socket.id, { socket, userId: data.userId });
        socket.join(data.room);
        
        socket.to(data.room).emit('user-joined', {
          userId: data.userId,
          message: 'User joined the chat',
        });
      });

      socket.on('message', (data: { room: string; message: string; userId: number }) => {
        socket.to(data.room).emit('new-message', {
          userId: data.userId,
          message: data.message,
          timestamp: new Date(),
        });
      });

      socket.on('disconnect', () => {
        const user = this.connectedUsers.get(socket.id);
        if (user) {
          this.connectedUsers.delete(socket.id);
          socket.broadcast.emit('user-left', {
            userId: user.userId,
            message: 'User left the chat',
          });
        }
        console.log('User disconnected:', socket.id);
      });
    });
  }

  sendToRoom(room: string, event: string, data: any) {
    this.io.to(room).emit(event, data);
  }

  sendToUser(userId: number, event: string, data: any) {
    for (const [socketId, user] of this.connectedUsers) {
      if (user.userId === userId) {
        user.socket.emit(event, data);
        break;
      }
    }
  }
}
```

## Background Jobs and Queues

### Email Queue System

```typescript
// services/queue.service.ts
import { Injectable } from '@amethyst/core';
import Bull from 'bull';
import { EmailService } from './email.service';

@Injectable()
export class QueueService {
  private emailQueue: Bull.Queue;

  constructor(private readonly emailService: EmailService) {
    this.emailQueue = new Bull('email queue', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    });

    this.setupProcessors();
  }

  private setupProcessors() {
    this.emailQueue.process('send-email', async (job) => {
      const { to, subject, template, data } = job.data;
      await this.emailService.sendEmail(to, subject, template, data);
    });

    this.emailQueue.process('send-bulk-email', async (job) => {
      const { recipients, subject, template, data } = job.data;
      await this.emailService.sendBulkEmail(recipients, subject, template, data);
    });
  }

  async addEmailJob(emailData: any, options?: Bull.JobOptions) {
    return this.emailQueue.add('send-email', emailData, {
      delay: 0,
      attempts: 3,
      backoff: 'exponential',
      ...options,
    });
  }

  async addBulkEmailJob(bulkEmailData: any, options?: Bull.JobOptions) {
    return this.emailQueue.add('send-bulk-email', bulkEmailData, {
      delay: 0,
      attempts: 3,
      backoff: 'exponential',
      ...options,
    });
  }

  getQueueStats() {
    return {
      waiting: this.emailQueue.getWaiting(),
      active: this.emailQueue.getActive(),
      completed: this.emailQueue.getCompleted(),
      failed: this.emailQueue.getFailed(),
    };
  }
}
```

## Caching Layer

### Redis Cache Implementation

```typescript
// services/cache.service.ts
import { Injectable } from '@amethyst/core';
import Redis from 'ioredis';

@Injectable()
export class CacheService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    });
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<boolean> {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  async flush(): Promise<boolean> {
    try {
      await this.redis.flushall();
      return true;
    } catch (error) {
      console.error('Cache flush error:', error);
      return false;
    }
  }
}
```

### Cache Decorator

```typescript
// decorators/cache.decorator.ts
import { CacheService } from '../services/cache.service';

export function Cache(ttl: number = 3600, keyPrefix?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const cacheService = new CacheService();
      const cacheKey = `${keyPrefix || target.constructor.name}:${propertyName}:${JSON.stringify(args)}`;
      
      // Try to get from cache first
      const cached = await cacheService.get(cacheKey);
      if (cached !== null) {
        return cached;
      }
      
      // Execute method and cache result
      const result = await method.apply(this, args);
      await cacheService.set(cacheKey, result, ttl);
      
      return result;
    };
  };
}

// Usage example
export class UserService {
  @Cache(1800, 'user') // Cache for 30 minutes
  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }
}
```

---

*These examples demonstrate common patterns and best practices for Amethyst development. Adapt them to your specific use cases.*
