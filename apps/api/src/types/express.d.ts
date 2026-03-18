import { OrgRole, PlanTier, User, Organization, Subscription } from '@prisma/client';

// Extend Express Request to carry auth + tenant context
declare global {
  namespace Express {
    interface Request {
      user?:   AuthUser;
      org?:    OrgContext;
      locale?: string;
    }
  }
}

export interface AuthUser {
  id:       string;
  email:    string;
  name:     string;
  isAdmin:  boolean;
  role:     OrgRole;
  orgId:    string;
  planTier: PlanTier;
}

export interface OrgContext {
  id:           string;
  name:         string;
  slug:         string;
  locale:       string;
  subscription: Subscription & { plan: { tier: PlanTier; [key: string]: unknown } };
}

export interface JwtPayload {
  sub:      string;
  orgId:    string;
  role:     OrgRole;
  planTier: PlanTier;
  isAdmin:  boolean;
  iat:      number;
  exp:      number;
}
