interface PMPAuthResponse {
  access_token: string;
  refresh_token: string;
}

interface PMPRefreshResponse {
  access_token: string;
}

interface PMPUserWhitelist {
  email: string;
  active?: boolean;
  regions?: string[];
}

class PMPClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private baseUrl: string;
  private username: string;
  private password: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_PMP_BASE_URL || "http://localhost:5000";
    this.username =
      import.meta.env.VITE_PMP_USERNAME || "service-account-audrey";
    this.password = import.meta.env.VITE_PMP_PASSWORD || "admin";
  }

  async authenticate(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/security/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: this.password,
          provider: "db",
          refresh: true,
          username: this.username,
        }),
      });

      if (!response.ok) {
        throw new Error(`PMP authentication failed: ${response.status}`);
      }

      const data: PMPAuthResponse = await response.json();
      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token;
    } catch (error) {
  console.error("[PMP] Failed to authenticate with PMP:", error);
      throw error;
    }
  }

  async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error("No refresh token available");
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/security/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.refreshToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const data: PMPRefreshResponse = await response.json();
      this.accessToken = data.access_token;
    } catch (error) {
  console.error("[PMP] Failed to refresh PMP token:", error);
      // If refresh fails, try to re-authenticate
      await this.authenticate();
    }
  }

  async getWhitelist(): Promise<string[]> {
    if (!this.accessToken) {
      await this.authenticate();
    }

    try {
      const response = await fetch(`${this.baseUrl}/audrey/v1/user_whitelist`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (response.status === 401) {
        // Token might be expired, try to refresh
        await this.refreshAccessToken();
        return this.getWhitelist();
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch whitelist: ${response.status}`);
      }

      const data: PMPUserWhitelist[] = await response.json();
      // Return only active emails or all emails if no active field
      return data
        .filter((user) => user.active !== false)
        .map((user) => user.email);
    } catch (error) {
  console.error("[PMP] Failed to fetch whitelist from PMP:", error);
      throw error;
    }
  }

  async getUserRegions(
    email: string,
    fetchFn?: typeof fetch,
  ): Promise<string[]> {
    if (!this.accessToken) {
      await this.authenticate();
    }

    try {
      const _fetch = fetchFn || fetch;
      const response = await _fetch(
        `${this.baseUrl}/audrey/v1/user_whitelist`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
  },
      );

      if (response.status === 401) {
        // Token might be expired, try to refresh
        await this.refreshAccessToken();
        return this.getUserRegions(email, fetchFn);
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch whitelist: ${response.status}`);
      }

      const data: PMPUserWhitelist[] = await response.json();
      const normalizedEmail = email.toLowerCase().trim();

      // Find user and return their regions
      const user = data.find(
        (u) =>
          u.email.toLowerCase().trim() === normalizedEmail &&
          u.active !== false,
      );

      return user?.regions || [];
    } catch (error) {
  console.error("[PMP] Failed to fetch user regions from PMP:", error);
      throw error;
    }
  }
}

// Singleton instance
let pmpClient: PMPClient | null = null;

export function getPMPClient(): PMPClient {
  if (!pmpClient) {
    pmpClient = new PMPClient();
  }
  return pmpClient;
}

export async function isEmailWhitelisted(email: string): Promise<boolean> {
  try {
    const client = getPMPClient();
    const whitelist = await client.getWhitelist();
    const normalizedEmail = email.toLowerCase().trim();
    const isWhitelisted = whitelist.includes(normalizedEmail);

    console.log(
      `[PMP] Whitelist check for ${normalizedEmail}: ${isWhitelisted ? "ALLOWED" : "DENIED"}`,
    );
    return isWhitelisted;
  } catch (error) {
  console.error("[PMP] Error checking email whitelist:", error);

    // In case of PMP unavailability, or NNetlify previews with dynamic domains
    // We want to allow access in development but deny in production.
    // For security, we default to denying access.
    if (import.meta.env.DEV) {
  console.warn("[PMP] Development mode: PMP unavailable, allowing access");
      return true;
    }

    // In production, deny access for security
    return false;
  }
}

export async function getUserAllowedRegions(
  email: string,
  fetchFn?: typeof fetch,
): Promise<string[]> {
  try {
    const client = getPMPClient();
    // If client.getUserRegions uses fetch, pass fetchFn if provided
    if (
      fetchFn &&
      typeof client.getUserRegions === "function" &&
      client.getUserRegions.length > 1
    ) {
      const result = await client.getUserRegions(email, fetchFn);
      return result;
    }
    const result = await client.getUserRegions(email);
    return result;
  } catch (error) {
  console.error("[PMP] Error fetching user regions:", error);

    // In development mode, return all available regions
    if (import.meta.env.DEV) {
  console.warn("[PMP] Development mode: PMP unavailable, returning all regions");
      // This would need to be imported from api.ts, but for now return empty array
      return [];
    }

    // In production, return empty array for security
    return [];
  }
}
