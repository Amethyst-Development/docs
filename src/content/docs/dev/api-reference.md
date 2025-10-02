---
title: API Reference
description: Complete API reference for Amethyst framework
---

# 📖 API Reference

Complete reference documentation for all Amethyst APIs and interfaces.

## Core Classes

### AmethystApplication

Main application class for bootstrapping Amethyst applications.

```typescript
class AmethystApplication {
  constructor(options: ApplicationOptions)
  
  // Methods
  async listen(port?: number): Promise<void>
  async close(): Promise<void>
  use(middleware: Middleware): void
  register(plugin: Plugin): void
}
```

#### ApplicationOptions

```typescript
interface ApplicationOptions {
  controllers?: Controller[];
  plugins?: Plugin[];
  middleware?: Middleware[];
  config?: ApplicationConfig;
}
```

### Controller Decorators

#### @Controller(path?: string)

Marks a class as a controller and optionally sets the base path.

```typescript
@Controller('/api/users')
export class UserController {
  // Controller methods
}
```

#### @Get(path?: string)

Defines a GET endpoint.

```typescript
@Get('/profile')
getProfile(@Param('id') id: string) {
  return this.userService.findById(id);
}
```

#### @Post(path?: string)

Defines a POST endpoint.

```typescript
@Post('/create')
createUser(@Body() userData: CreateUserDto) {
  return this.userService.create(userData);
}
```

#### @Put(path?: string)

Defines a PUT endpoint.

```typescript
@Put('/:id')
updateUser(@Param('id') id: string, @Body() userData: UpdateUserDto) {
  return this.userService.update(id, userData);
}
```

#### @Delete(path?: string)

Defines a DELETE endpoint.

```typescript
@Delete('/:id')
deleteUser(@Param('id') id: string) {
  return this.userService.delete(id);
}
```

## Parameter Decorators

### @Param(key?: string)

Extracts route parameters.

```typescript
@Get('/:id')
getUser(@Param('id') id: string) {
  return this.userService.findById(id);
}
```

### @Query(key?: string)

Extracts query parameters.

```typescript
@Get('/search')
searchUsers(@Query('q') query: string, @Query('limit') limit: number = 10) {
  return this.userService.search(query, limit);
}
```

### @Body()

Extracts request body.

```typescript
@Post('/create')
createUser(@Body() userData: CreateUserDto) {
  return this.userService.create(userData);
}
```

### @Headers(key?: string)

Extracts request headers.

```typescript
@Get('/profile')
getProfile(@Headers('authorization') token: string) {
  return this.authService.getProfileFromToken(token);
}
```

## Database API

### Entity Decorators

#### @Entity(tableName?: string)

Marks a class as a database entity.

```typescript
@Entity('users')
export class User {
  @Column({ primary: true })
  id: number;
  
  @Column()
  email: string;
}
```

#### @Column(options?: ColumnOptions)

Defines a database column.

```typescript
interface ColumnOptions {
  primary?: boolean;
  unique?: boolean;
  nullable?: boolean;
  default?: any;
  type?: ColumnType;
  length?: number;
}
```

### Repository Class

Generic repository for database operations.

```typescript
class Repository<T> {
  async create(data: Partial<T>): Promise<T>
  async findOne(criteria: FindCriteria<T>): Promise<T | null>
  async find(criteria: FindCriteria<T>): Promise<T[]>
  async update(id: any, data: Partial<T>): Promise<T>
  async delete(id: any): Promise<boolean>
  async count(criteria?: FindCriteria<T>): Promise<number>
}
```

#### FindCriteria Interface

```typescript
interface FindCriteria<T> {
  where?: Partial<T>;
  order?: Record<keyof T, 'ASC' | 'DESC'>;
  limit?: number;
  offset?: number;
  select?: (keyof T)[];
}
```

## Plugin System

### Plugin Decorator

#### @Plugin(metadata: PluginMetadata)

Marks a class as a plugin.

```typescript
interface PluginMetadata {
  name: string;
  version: string;
  description?: string;
  dependencies?: string[];
  config?: PluginConfig;
}
```

### Lifecycle Hooks

#### OnApplicationStart

Called when the application starts.

```typescript
export class MyPlugin implements OnApplicationStart {
  async onApplicationStart(): Promise<void> {
    // Initialization logic
  }
}
```

#### OnApplicationShutdown

Called when the application shuts down.

```typescript
export class MyPlugin implements OnApplicationShutdown {
  async onApplicationShutdown(): Promise<void> {
    // Cleanup logic
  }
}
```

## Middleware System

### Middleware Interface

```typescript
interface Middleware {
  use(req: Request, res: Response, next: NextFunction): void | Promise<void>;
}
```

### Built-in Middleware

#### CorsMiddleware

```typescript
@Middleware()
export class CorsMiddleware {
  constructor(private options: CorsOptions) {}
  
  use(req: Request, res: Response, next: NextFunction) {
    // CORS implementation
  }
}
```

#### LoggingMiddleware

```typescript
@Middleware()
export class LoggingMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log(`${req.method} ${req.url}`);
    next();
  }
}
```

## Event System

### Event Class

Base class for all events.

```typescript
abstract class Event {
  constructor(
    public readonly type: string,
    public readonly payload: any,
    public readonly timestamp: Date = new Date()
  ) {}
}
```

### EventEmitter

Service for emitting and listening to events.

```typescript
class EventEmitter {
  emit<T extends Event>(event: T): void
  on<T extends Event>(eventType: string, handler: (event: T) => void): void
  off(eventType: string, handler: Function): void
  once<T extends Event>(eventType: string, handler: (event: T) => void): void
}
```

### Event Decorators

#### @EventListener()

Marks a class as an event listener.

```typescript
@EventListener()
export class UserEventListener {
  @On('user.created')
  handleUserCreated(event: UserCreatedEvent) {
    // Handle event
  }
}
```

## Validation

### Validation Decorators

#### @IsString(options?: ValidationOptions)

Validates that a value is a string.

```typescript
export class CreateUserDto {
  @IsString({ message: 'Username must be a string' })
  username: string;
}
```

#### @IsEmail(options?: ValidationOptions)

Validates email format.

```typescript
export class CreateUserDto {
  @IsEmail({}, { message: 'Please provide a valid email' })
  email: string;
}
```

#### @MinLength(min: number, options?: ValidationOptions)

Validates minimum string length.

```typescript
export class CreateUserDto {
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;
}
```

#### @MaxLength(max: number, options?: ValidationOptions)

Validates maximum string length.

```typescript
export class CreateUserDto {
  @MaxLength(50, { message: 'Username cannot exceed 50 characters' })
  username: string;
}
```

## Configuration

### Configuration Service

```typescript
class ConfigService {
  get<T = any>(key: string, defaultValue?: T): T
  set(key: string, value: any): void
  has(key: string): boolean
  getAll(): Record<string, any>
}
```

### Environment Variables

```typescript
// Access environment variables
const dbUrl = process.env.DATABASE_URL;
const port = parseInt(process.env.PORT || '3000');
const nodeEnv = process.env.NODE_ENV || 'development';
```

## Error Handling

### HTTP Exceptions

#### BadRequestException

```typescript
throw new BadRequestException('Invalid input data');
```

#### UnauthorizedException

```typescript
throw new UnauthorizedException('Authentication required');
```

#### ForbiddenException

```typescript
throw new ForbiddenException('Access denied');
```

#### NotFoundException

```typescript
throw new NotFoundException('User not found');
```

#### InternalServerErrorException

```typescript
throw new InternalServerErrorException('Something went wrong');
```

### Custom Exception Filter

```typescript
@ExceptionFilter()
export class CustomExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    
    response.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
}
```

## Testing Utilities

### Test Module

```typescript
const module = await Test.createTestingModule({
  controllers: [UserController],
  providers: [UserService],
}).compile();

const app = module.createAmethystApplication();
```

### Mock Providers

```typescript
const mockUserService = {
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const module = await Test.createTestingModule({
  controllers: [UserController],
  providers: [
    {
      provide: UserService,
      useValue: mockUserService,
    },
  ],
}).compile();
```

---

*This API reference is automatically generated from the source code and updated with each release.*
