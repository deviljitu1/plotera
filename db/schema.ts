import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(), owner: text("owner").notNull(),
  name: text("name").notNull(), data: text("data").notNull(),
  version: integer("version").notNull().default(1),
  published: text("published"), shareToken: text("share_token").unique(),
  plan: text("plan").notNull().default("launch"), invoiceStatus: text("invoice_status").notNull().default("unbilled"),
  invoiceAmount: integer("invoice_amount").notNull().default(4999),
  created: integer("created").notNull(), updated: integer("updated").notNull(),
}, t => [index("projects_owner").on(t.owner)]);
export const leads = sqliteTable("leads", {
  id: text("id").primaryKey(), project: text("project").notNull().references(() => projects.id),
  name: text("name").notNull(), email: text("email").notNull(), phone: text("phone").notNull(),
  plot: text("plot"), message: text("message").notNull(), stage: text("stage").notNull().default("New"), created: integer("created").notNull(),
});
export const events = sqliteTable("events", {
  id: text("id").primaryKey(), project: text("project").notNull(), type: text("type").notNull(), plot: text("plot"), created: integer("created").notNull(),
}, t => [index("events_project_time").on(t.project, t.created)]);
export const activity = sqliteTable("activity", {
  id: text("id").primaryKey(), project: text("project").notNull(), actor: text("actor").notNull(), action: text("action").notNull(), created: integer("created").notNull(),
});
