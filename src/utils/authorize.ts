import { Role } from "../../generated/prisma/enums";

// authorize( true, user.role, "ADMIN", "AUTHOR" )
// authorize( false, user.role, "USER" )
export const authorize = (
  permission: boolean,
  userRole: Role,
  ...roles: Role[]
): boolean => {
  const result = roles.includes(userRole); // true or false
  let grant = true;

  if (permission && !result) {
    grant = false;
  }

  if (!permission && result) {
    grant = false;
  }

  return grant; // true
};
