export type PrototypeStatus = "in-progress" | "complete" | "archived";

export interface PrototypeMeta {
  title: string;
  description: string;
  author: string;
  date: string;
  tags?: string[];
  status?: PrototypeStatus;
  thumbnail?: string;
}

export interface Prototype {
  meta: PrototypeMeta;
  designer: string;
  slug: string;
  path: string;
  type: "local";
}

export interface ExternalPrototype {
  title: string;
  description: string;
  author: string;
  date: string;
  tags?: string[];
  url: string;
  platform: "figma" | "v0" | "codepen" | "codesandbox" | "other";
  thumbnail?: string;
  type: "external";
}

export type PrototypeEntry = Prototype | ExternalPrototype;

export interface DesignerGroup {
  designer: string;
  prototypes: PrototypeEntry[];
}

export interface CommentAuthor {
  name: string | null;
  image: string | null;
}
