export class UserRole {
  organization: string;
  role: string;
  teams: Array<string>;
  services: Array<{ service: string, role: string }>;

  constructor(role: string, organizationId: string) {
    this.role = role;
    this.organization = organizationId;
    this.services = [];
    this.teams = [];
  }
}
