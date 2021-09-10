export class Team {
  _id: string;
  name: string;
  services: Array<{ service: string, role: string }>;

  constructor(name?: string) {
    this.name = name;
    this.services = [];
  }
}
