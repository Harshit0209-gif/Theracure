import { NextResponse } from "next/server"
import { ZodSchema, ZodError } from "zod"

// Generic validation helper
export function validateRequest<T>(schema: ZodSchema<T>, data: any): {
  success: boolean
  data?: T
  error?: any
} {
  try {
    const validatedData = schema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        error: {
          message: "Validation failed",
          details: error.flatten().fieldErrors
        }
      }
    }
    return {
      success: false,
      error: { message: "Unknown validation error" }
    }
  }
}

// API response helper for validation errors
export function validationErrorResponse(error: any) {
  return NextResponse.json({
    success: false,
    error: error.message,
    details: error.details
  }, { status: 400 })
}

// Safe parse with custom error handling
export function safeValidate<T>(schema: ZodSchema<T>, data: any) {
  const result = schema.safeParse(data)
  
  if (!result.success) {
    return {
      success: false,
      error: {
        message: "Validation failed",
        details: result.error.flatten().fieldErrors,
        issues: result.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
          code: issue.code
        }))
      }
    }
  }
  
  return { success: true, data: result.data }
}