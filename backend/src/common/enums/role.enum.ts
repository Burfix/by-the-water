export enum Role {
  STORE = 'STORE',
  PROPERTY_COORDINATOR = 'PROPERTY_COORDINATOR',
  OPS_MANAGER = 'OPS_MANAGER',
  EXEC = 'EXEC',
}

export const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.STORE]: 0,
  [Role.PROPERTY_COORDINATOR]: 1,
  [Role.OPS_MANAGER]: 2,
  [Role.EXEC]: 2, // EXEC has same base level as OPS_MANAGER but read-only
};
