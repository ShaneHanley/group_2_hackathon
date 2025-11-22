import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';
import { TokenBlacklist } from './entities/token-blacklist.entity';
import { UserStatus } from '../users/entities/user.entity';
import { KeycloakService } from '../keycloak/keycloak.service';
import { AuditService } from '../audit/audit.service';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let tokenBlacklistRepository: Repository<TokenBlacklist>;
  let jwtService: JwtService;
  let auditService: AuditService;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockTokenBlacklistRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
    decode: jest.fn(),
  };

  const mockAuditService = {
    log: jest.fn(),
  };

  const mockKeycloakService = {
    createUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(TokenBlacklist),
          useValue: mockTokenBlacklistRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
        {
          provide: KeycloakService,
          useValue: mockKeycloakService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    tokenBlacklistRepository = module.get<Repository<TokenBlacklist>>(
      getRepositoryToken(TokenBlacklist),
    );
    jwtService = module.get<JwtService>(JwtService);
    auditService = module.get<AuditService>(AuditService);

    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const createUserDto = {
        email: 'test@csis.edu',
        password: 'Test123!',
        displayName: 'Test User',
        department: 'CS',
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue({
        ...createUserDto,
        id: 'user-id',
        status: UserStatus.PENDING,
      });
      mockUserRepository.save.mockResolvedValue({
        id: 'user-id',
        email: 'test@csis.edu',
        status: UserStatus.PENDING,
      });
      mockKeycloakService.createUser.mockResolvedValue({ id: 'keycloak-id' });
      mockAuditService.log.mockResolvedValue({});

      const result = await service.register(createUserDto);

      expect(result).toHaveProperty('id');
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(mockAuditService.log).toHaveBeenCalled();
    });

    it('should throw error if user already exists', async () => {
      const createUserDto = {
        email: 'existing@csis.edu',
        password: 'Test123!',
        displayName: 'Test User',
      };

      mockUserRepository.findOne.mockResolvedValue({
        id: 'existing-id',
        email: 'existing@csis.edu',
      });

      await expect(service.register(createUserDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginDto = {
        email: 'test@csis.edu',
        password: 'Test123!',
      };

      const hashedPassword = await bcrypt.hash('Test123!', 10);
      const mockUser = {
        id: 'user-id',
        email: 'test@csis.edu',
        passwordHash: hashedPassword,
        status: UserStatus.ACTIVE,
        userRoles: [],
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('mock-token');
      mockAuditService.log.mockResolvedValue({});

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
    });

    it('should throw error for invalid credentials', async () => {
      const loginDto = {
        email: 'test@csis.edu',
        password: 'WrongPassword!',
      };

      const hashedPassword = await bcrypt.hash('Test123!', 10);
      const mockUser = {
        id: 'user-id',
        email: 'test@csis.edu',
        passwordHash: hashedPassword,
        status: UserStatus.ACTIVE,
        userRoles: [],
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockAuditService.log.mockResolvedValue({});

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw error for inactive user', async () => {
      const loginDto = {
        email: 'test@csis.edu',
        password: 'Test123!',
      };

      const mockUser = {
        id: 'user-id',
        email: 'test@csis.edu',
        status: UserStatus.PENDING,
        userRoles: [],
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens successfully', async () => {
      const refreshToken = 'valid-refresh-token';
      const payload = {
        sub: 'user-id',
        email: 'test@csis.edu',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      mockJwtService.verify.mockReturnValue(payload);
      mockTokenBlacklistRepository.findOne.mockResolvedValue(null);
      mockUserRepository.findOne.mockResolvedValue({
        id: 'user-id',
        email: 'test@csis.edu',
        status: UserStatus.ACTIVE,
        userRoles: [],
      });
      mockJwtService.sign.mockReturnValue('new-token');
      mockTokenBlacklistRepository.save.mockResolvedValue({});
      mockAuditService.log.mockResolvedValue({});

      const result = await service.refreshToken(refreshToken);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(mockTokenBlacklistRepository.save).toHaveBeenCalled(); // Old token blacklisted
    });

    it('should throw error for blacklisted token', async () => {
      const refreshToken = 'blacklisted-token';

      mockJwtService.verify.mockReturnValue({ sub: 'user-id' });
      mockTokenBlacklistRepository.findOne.mockResolvedValue({
        id: 'blacklist-id',
        token: refreshToken,
      });

      await expect(service.refreshToken(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const accessToken = 'valid-token';
      const decoded = {
        sub: 'user-id',
        exp: Math.floor(Date.now() / 1000) + 900,
      };

      mockJwtService.decode.mockReturnValue(decoded);
      mockTokenBlacklistRepository.save.mockResolvedValue({});
      mockAuditService.log.mockResolvedValue({});

      await service.logout(accessToken);

      expect(mockTokenBlacklistRepository.save).toHaveBeenCalled();
      expect(mockAuditService.log).toHaveBeenCalled();
    });
  });
});

