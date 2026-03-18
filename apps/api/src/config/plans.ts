export type PlanTier = 'BASIC' | 'FREELANCER' | 'AGENCY';

export interface PlanConfig {
  maxBusinesses:       number;  // -1 = unlimited
  maxImportsPerMonth:  number;
  maxTeamMembers:      number;
  maxTemplates:        number;
  canExportCsv:        boolean;
  canUseEmailjs:       boolean;
  canUseReminders:     boolean;
  canUseAdvancedStats: boolean;
  canUseBulkActions:   boolean;
  canUseApiAccess:     boolean;
}

// Single source of truth for all plan limits
export const PLAN_LIMITS: Record<PlanTier, PlanConfig> = {
  BASIC: {
    maxBusinesses:       100,
    maxImportsPerMonth:  3,
    maxTeamMembers:      1,
    maxTemplates:        2,
    canExportCsv:        false,
    canUseEmailjs:       false,
    canUseReminders:     false,
    canUseAdvancedStats: false,
    canUseBulkActions:   false,
    canUseApiAccess:     false,
  },
  FREELANCER: {
    maxBusinesses:       2_000,
    maxImportsPerMonth:  30,
    maxTeamMembers:      1,
    maxTemplates:        20,
    canExportCsv:        true,
    canUseEmailjs:       true,
    canUseReminders:     true,
    canUseAdvancedStats: true,
    canUseBulkActions:   true,
    canUseApiAccess:     false,
  },
  AGENCY: {
    maxBusinesses:       -1,
    maxImportsPerMonth:  -1,
    maxTeamMembers:      25,
    maxTemplates:        -1,
    canExportCsv:        true,
    canUseEmailjs:       true,
    canUseReminders:     true,
    canUseAdvancedStats: true,
    canUseBulkActions:   true,
    canUseApiAccess:     true,
  },
};

// Plan seed data for database
export const PLAN_SEED_DATA = [
  {
    tier:                 'BASIC' as PlanTier,
    name:                 'Basic',
    monthlyPriceUsd:      0,
    maxBusinesses:        100,
    maxImportsPerMonth:   3,
    maxTeamMembers:       1,
    maxTemplates:         2,
    canExportCsv:         false,
    canUseEmailjs:        false,
    canUseReminders:      false,
    canUseAdvancedStats:  false,
    canUseBulkActions:    false,
    canUseApiAccess:      false,
  },
  {
    tier:                 'FREELANCER' as PlanTier,
    name:                 'Freelancer',
    monthlyPriceUsd:      1900, // $19.00
    maxBusinesses:        2000,
    maxImportsPerMonth:   30,
    maxTeamMembers:       1,
    maxTemplates:         20,
    canExportCsv:         true,
    canUseEmailjs:        true,
    canUseReminders:      true,
    canUseAdvancedStats:  true,
    canUseBulkActions:    true,
    canUseApiAccess:      false,
  },
  {
    tier:                 'AGENCY' as PlanTier,
    name:                 'Agency',
    monthlyPriceUsd:      4900, // $49.00
    maxBusinesses:        -1,
    maxImportsPerMonth:   -1,
    maxTeamMembers:       25,
    maxTemplates:         -1,
    canExportCsv:         true,
    canUseEmailjs:        true,
    canUseReminders:      true,
    canUseAdvancedStats:  true,
    canUseBulkActions:    true,
    canUseApiAccess:      true,
  },
];
