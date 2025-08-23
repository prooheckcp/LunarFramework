export class Crater {
  name: string;
  version: string;
  registry: string;
  dependencies: Record<string, any>;
  pointers: {
    client: string;
    server: string;
    shared: string;
  };

  // default values
  private static defaults = {
    name: "default-name",
    version: "0.0.1",
    registry: "default-registry",
    dependencies: {} as Record<string, any>,
    pointers: {
      client: "default-client",
      server: "default-server",
      shared: "default-shared",
    },
  };

  constructor(init: Partial<Crater> = {}) {
    this.name = init.name ?? Crater.defaults.name;
    this.version = init.version ?? Crater.defaults.version;
    this.registry = init.registry ?? Crater.defaults.registry;
    this.dependencies = init.dependencies ?? Crater.defaults.dependencies;
    this.pointers = { ...Crater.defaults.pointers, ...(init.pointers ?? {}) };
  }
}
