import { NextRequest, NextResponse } from 'next/server';
import Joi from 'joi';
import { prisma } from '@/prisma/client';

// Demo mode: No password hashing
function hashPassword(password: string): Promise<string> {
  // Demo mode - store passwords as plain text
  return Promise.resolve(password);
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

// Validation schema for user updates
const updateUserSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .optional()
    .messages({
      'string.email': 'Please provide a valid email address'
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
    .allow(null)
    .messages({
      'string.min': 'Name cannot be empty',
      'string.max': 'Name must be less than 100 characters'
    }),
  role: Joi.string()
    .valid('USER', 'ADMIN')
    .optional()
    .messages({
      'any.only': 'Role must be either USER or ADMIN'
    }),
  active: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'Active must be a boolean value'
    })
});

/**
 * GET /api/admin/users/[id]
 * Get a specific user by ID (Admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Find user
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        timestamp: new Date().toISOString()
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: user,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Get user error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * PUT /api/admin/users/[id]
 * Update a user (Admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

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
    const { error, value } = updateUserSchema.validate(body);
    if (error) {
      return NextResponse.json({
        success: false,
        error: error.details[0].message,
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    const { email, password, name, role, active } = value;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        timestamp: new Date().toISOString()
      }, { status: 404 });
    }

    // Check if email is being changed and if it conflicts with another user
    if (email && email.toLowerCase().trim() !== existingUser.email) {
      const emailConflict = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() }
      });

      if (emailConflict) {
        return NextResponse.json({
          success: false,
          error: 'User with this email already exists',
          timestamp: new Date().toISOString()
        }, { status: 409 });
      }
    }

    // Prepare update data
    const updateData: any = {};
    
    if (email !== undefined) {
      if (!isValidEmail(email)) {
        return NextResponse.json({
          success: false,
          error: 'Please provide a valid email address',
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }
      updateData.email = email.toLowerCase().trim();
    }
    
    if (name !== undefined) {
      updateData.name = name;
    }
    
    if (role !== undefined) {
      updateData.role = role;
    }
    
    if (active !== undefined) {
      updateData.active = active;
    }
    
    if (password !== undefined) {
      // Validate password strength
      const passwordValidation = isValidPassword(password);
      if (!passwordValidation.valid) {
        return NextResponse.json({
          success: false,
          error: `Password validation failed: ${passwordValidation.errors.join(', ')}`,
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }
      
      // Hash password
      const hashedPassword = await hashPassword(password);
      updateData.password = hashedPassword;
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        user: updatedUser,
        passwordChanged: password !== undefined
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('User update error:', error);
    
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
 * DELETE /api/admin/users/[id]
 * Delete a user (Admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true }
    });

    if (!existingUser) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        timestamp: new Date().toISOString()
      }, { status: 404 });
    }

    // Prevent deleting the current admin user (basic safety check)
    if (existingUser.id === authResult.user.id) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete your own account',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Delete user (Prisma will handle cascade deletes based on schema)
    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      data: {
        deletedUserId: id,
        message: 'User successfully deleted'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('User deletion error:', error);
    
    // Handle foreign key constraint errors
    if (error.code === 'P2003') {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete user due to existing related data. Consider deactivating the user instead.',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 