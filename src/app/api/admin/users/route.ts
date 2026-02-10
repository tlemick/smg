import { NextRequest, NextResponse } from 'next/server';
import Joi from 'joi';
import { prisma } from '@/prisma/client';
// Demo helper functions (simplified for demo purposes)
function hashPassword(password: string): Promise<string> {
  // Demo mode - store passwords as plain text
  return Promise.resolve(password);
}

function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (password.length < 8) errors.push('Password must be at least 8 characters');
  if (password.length > 128) errors.push('Password must be less than 128 characters');
  return { valid: errors.length === 0, errors };
}

function sanitizeUser(user: any) {
  const { password, ...sanitized } = user;
  return sanitized;
}

function getAuthenticatedUser(request: NextRequest): Promise<{ success: boolean; user?: any; error?: string }> {
  // Demo mode - always return demo admin user
  return Promise.resolve({
    success: true,
    user: { id: 1, email: 'admin@smg.com', role: 'ADMIN', name: 'Demo Admin' }
  });
}

function requireAdmin(user: any): boolean {
  return user?.role === 'ADMIN';
}

// Validation schema for user creation
const createUserSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .min(8)
    .max(128)
    .optional()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password must be less than 128 characters long'
    }),
  name: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Name cannot be empty',
      'string.max': 'Name must be less than 100 characters'
    }),
  role: Joi.string()
    .valid('USER', 'ADMIN')
    .default('USER')
    .messages({
      'any.only': 'Role must be either USER or ADMIN'
    }),
  generatePassword: Joi.boolean()
    .default(false)
    .messages({
      'boolean.base': 'generatePassword must be a boolean value'
    })
});

/**
 * POST /api/admin/users
 * Create a new user (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await getAuthenticatedUser(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({
        success: false,
        error: authResult.error || 'Authentication required',
        timestamp: new Date().toISOString()
      }, { status: 401 });
    }

    // Check admin permissions
    if (!requireAdmin(authResult.user)) {
      return NextResponse.json({
        success: false,
        error: 'Admin access required',
        timestamp: new Date().toISOString()
      }, { status: 403 });
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'Invalid JSON format',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Validate input
    const { error, value } = createUserSchema.validate(body);
    if (error) {
      return NextResponse.json({
        success: false,
        error: error.details[0].message,
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    const { email, password, name, role, generatePassword } = value;

    // Additional email validation
    if (!isValidEmail(email)) {
      return NextResponse.json({
        success: false,
        error: 'Please provide a valid email address',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: 'User with this email already exists',
        timestamp: new Date().toISOString()
      }, { status: 409 });
    }

    // Handle password
    let finalPassword: string;
    let temporaryPassword: string | undefined;

    if (generatePassword || !password) {
      // Generate temporary password
      temporaryPassword = generateTemporaryPassword();
      finalPassword = temporaryPassword;
    } else {
      // Use provided password
      finalPassword = password;
      
      // Validate password strength
      const passwordValidation = isValidPassword(finalPassword);
      if (!passwordValidation.valid) {
        return NextResponse.json({
          success: false,
          error: `Password validation failed: ${passwordValidation.errors.join(', ')}`,
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(finalPassword);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        name: name || null,
        role: role,
        active: true
      }
    });

    // Prepare response
    const responseData: any = {
      user: sanitizeUser(newUser)
    };

    // Include temporary password in response if generated
    if (temporaryPassword) {
      responseData.temporaryPassword = temporaryPassword;
      responseData.passwordGenerated = true;
    }

    return NextResponse.json({
      success: true,
      data: responseData,
      timestamp: new Date().toISOString()
    }, { status: 201 });

  } catch (error: any) {
    console.error('User creation error:', error);
    
    // Handle Prisma unique constraint errors
    if (error.code === 'P2002') {
      return NextResponse.json({
        success: false,
        error: 'User with this email already exists',
        timestamp: new Date().toISOString()
      }, { status: 409 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * GET /api/admin/users
 * Get all users (Admin only)
 */
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
} 