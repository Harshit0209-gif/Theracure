import { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { Session } from "@/types/session";

// Cache for session validation to improve performance
const sessionCache = new Map<string, { session: Session; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getSession(req: NextRequest): Promise<Session | null> {
  try {
    // Get JWT token from cookies
    const jwtToken = req.cookies.get("token")?.value;

    if (!jwtToken) {
      return null;
    }

    // Check cache first
    const cached = sessionCache.get(jwtToken);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      // Check if cached session is still valid
      if (Date.now() < cached.session.tokenExpiry) {
        return cached.session;
      } else {
        // Remove expired session from cache
        sessionCache.delete(jwtToken);
      }
    }

    // Verify the JWT token
    const decoded = verifyToken<{
      id: string;
      email: string;
      role: string;
      iat: number;
      exp: number;
    }>(jwtToken);

    if (!decoded || !decoded.id) {
      return null;
    }

    // Validate required fields
    if (!decoded.email || !decoded.role) {
      console.warn("Invalid token payload: missing required fields");
      return null;
    }

    // Check if token is expired
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp && currentTime >= decoded.exp) {
      console.warn("JWT token has expired");
      return null;
    }

    // Create a session object
    const session: Session = {
      user: {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      tokenExpiry: decoded.exp ? decoded.exp * 1000 : Date.now() + 3600 * 1000,
    };

    // Cache the session
    sessionCache.set(jwtToken, { session, timestamp: Date.now() });

    return session;
  } catch (error) {
    console.error("Session provider error:", error);
    return null;
  }
}

// Utility function to require authentication
export function requireAuth(session: Session | null): Session {
  if (!session?.user?.id) {
    throw new Error("Authentication required");
  }

  // Check if token is about to expire (within 5 minutes)
  const fiveMinutesFromNow = Date.now() + 5 * 60 * 1000;
  if (session.tokenExpiry && session.tokenExpiry <= fiveMinutesFromNow) {
    throw new Error("Token expiring soon");
  }

  return session;
}

// Utility function to check role-based access
export function requireRole(
  session: Session | null,
  allowedRoles: string[]
): Session {
  const authSession = requireAuth(session);

  if (!allowedRoles.includes(authSession.user.role)) {
    throw new Error("Insufficient permissions");
  }

  return authSession;
}

// Check if session is about to expire
export function isSessionExpiringSoon(session: Session | null): boolean {
  if (!session?.tokenExpiry) return false;

  const fiveMinutesFromNow = Date.now() + 5 * 60 * 1000;
  return session.tokenExpiry <= fiveMinutesFromNow;
}

// Get time until session expires (in minutes)
export function getTimeUntilExpiry(session: Session | null): number {
  if (!session?.tokenExpiry) return 0;

  const timeLeft = session.tokenExpiry - Date.now();
  return Math.max(0, Math.floor(timeLeft / (60 * 1000)));
}

// Clear cache (useful for logout)
export function clearSessionCache(token?: string) {
  if (token) {
    sessionCache.delete(token);
  } else {
    sessionCache.clear();
  }
}
