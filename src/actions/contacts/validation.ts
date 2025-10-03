'use server'

import { z } from 'zod'
import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import {
  ActionResult,
  Prisma,
  checkContactUniquenessSchema
} from './types'

/**
 * Check if an email is already in use
 * - Used for form validation
 */
export async function checkContactUniqueness(
  input: z.infer<typeof checkContactUniquenessSchema>
): Promise<ActionResult<{ isUnique: boolean }>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Validate input
    const validated = checkContactUniquenessSchema.parse(input)
    const { email, excludeId } = validated

    if (!email) {
      return { success: true, data: { isUnique: true } }
    }

    const where: Prisma.ContactWhereInput = { email }
    if (excludeId) {
      where.NOT = { id: excludeId }
    }

    const existing = await prisma.contact.findFirst({ where })

    return {
      success: true,
      data: { isUnique: !existing }
    }
  } catch (_error) {
    if (_error instanceof z.ZodError) {
      const firstError = _error.issues[0]
      return {
        success: false,
        error: `Validation error: ${firstError.path.join('.')} - ${firstError.message}`,
      }
    }

    return {
      success: false,
      error: 'Failed to check contact uniqueness',
    }
  }
}