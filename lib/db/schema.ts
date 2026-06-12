import { 
  pgTable, 
  uuid, 
  text, 
  varchar, 
  integer, 
  numeric, 
  timestamp, 
  pgEnum,
  boolean,
  index
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ==========================================
// ENUMS DE CONTROLE E ACESSO (RBAC & Estados)
// ==========================================

export const userRoleEnum = pgEnum('user_role', [
  'OWNER',      // Dono da rede/oficina, acesso total a todas as unidades e faturamento global
  'MANAGER',    // Gerente de uma unidade específica, controla estoque, financeiro local e OS
  'RECEPTOR',   // Responsável pelo check-in, abertura de OS e contato via WhatsApp com cliente
  'MECHANIC'    // Mecânico de pátio, focado em executar os serviços e atualizar status de rampa
]);

export const workStatusEnum = pgEnum('work_status', [
  'AVAILABLE',  // Disponível no pátio
  'BUSY',       // Executando serviço (carro na rampa)
  'AWAY'        // Ausente / Intervalo / Almoço
]);

export const orderStatusEnum = pgEnum('order_status', [
  'CHECK_IN',
  'AWAITING_BUDGET',
  'AWAITING_APPROVAL',
  'AWAITING_PARTS',
  'IN_PROGRESS',
  'TESTING_WASHING',
  'READY',
  'DELIVERED'
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'PENDING',
  'PAID',
  'LATE'
]);

// ==========================================
// CAMADA MULTI-TENANT E ESTRUTURA
// ==========================================

// 1. Tenants (A Conta Corporativa/Assinante do SaaS)
export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(), // Ex: "AutoCenter Car"
  slug: varchar('slug', { length: 100 }).unique().notNull(), // Para subdomínios ou identificação na URL
  planStatus: text('plan_status').default('ACTIVE').notNull(), // Controle de bloqueio do SaaS
  onboardingCompleted: boolean('onboarding_completed').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 2. Branches (Unidades Físicas / Oficinas)
export const branches = pgTable('branches', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(), // Ex: "Filial Nova Iguaçu Centro"
  phone: varchar('phone', { length: 20 }),
  address: text('address'),
  cnpj: varchar('cnpj', { length: 18 }),
  email: text('email'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('branches_tenant_idx').on(table.tenantId),
]);

// 3. Users (Usuários e Funcionários do Sistema)
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').unique().notNull(),
  emailVerified: boolean('email_verified').notNull(),
  image: text('image'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  isDev: boolean('is_dev').default(false).notNull(),
  
  // Custom multi-tenant fields
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  branchId: uuid('branch_id').references(() => branches.id, { onDelete: 'set null' }),
  role: userRoleEnum('role').default('MECHANIC').notNull(),
  commissionRate: numeric('commission_rate', { precision: 5, scale: 2 }).default('0.00'),
  isActive: integer('is_active').default(1).notNull(),
  phone: varchar('phone', { length: 20 }),
  specialties: text('specialties').array(),
  workStatus: workStatusEnum('work_status').default('AVAILABLE').notNull(),
  
  // Better Auth Admin fields
  banned: boolean('banned').default(false),
  banReason: text('ban_reason'),
  banExpires: timestamp('ban_expires'),
}, (table) => [
  index('user_tenant_idx').on(table.tenantId),
  index('user_branch_idx').on(table.branchId),
]);

export const session = pgTable("session", {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id").notNull().references(() => user.id),
    impersonatedBy: text("impersonated_by"),
}, (table) => [
  index('session_user_idx').on(table.userId),
]);

export const account = pgTable("account", {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id").notNull().references(() => user.id),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull()
}, (table) => [
  index('account_user_idx').on(table.userId),
]);

export const verification = pgTable("verification", {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at")
});

// ==========================================
// TABELAS OPERACIONAIS
// ==========================================

export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  document: varchar('document', { length: 18 }), 
  email: text('email'),
  address: text('address'),
  riskProfile: text('risk_profile').default('GOOD'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('customers_tenant_idx').on(table.tenantId),
]);

export const vehicles = pgTable('vehicles', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'cascade' }).notNull(),
  plate: varchar('plate', { length: 10 }).unique().notNull(),
  brand: varchar('brand', { length: 50 }).notNull(),
  model: varchar('model', { length: 100 }).notNull(),
  year: integer('year'),
  engine: varchar('engine', { length: 50 }),
  mileage: integer('mileage'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('vehicles_tenant_idx').on(table.tenantId),
  index('vehicles_customer_idx').on(table.customerId),
]);

// 4. Fornecedores (Novidade)
export const suppliers = pgTable('suppliers', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  phone: varchar('phone', { length: 20 }),
  email: text('email'),
  cnpj: varchar('cnpj', { length: 18 }),
  address: text('address'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('suppliers_tenant_idx').on(table.tenantId),
]);

export const partsInventory = pgTable('parts_inventory', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  branchId: uuid('branch_id').references(() => branches.id, { onDelete: 'cascade' }).notNull(),
  supplierId: uuid('supplier_id').references(() => suppliers.id, { onDelete: 'set null' }),
  sku: varchar('sku', { length: 100 }),
  name: text('name').notNull(),
  brand: varchar('brand', { length: 50 }),
  quantity: integer('quantity').default(0).notNull(),
  minQuantity: integer('min_quantity').default(2).notNull(),
  costPrice: numeric('cost_price', { precision: 10, scale: 2 }).notNull(),
  salePrice: numeric('sale_price', { precision: 10, scale: 2 }).notNull(),
  location: varchar('location', { length: 50 }),
  compatibleCars: text('compatible_cars'),
  dimension: varchar('dimension', { length: 100 }),
  size: varchar('size', { length: 50 }),
  weight: varchar('weight', { length: 50 }),
}, (table) => [
  index('parts_tenant_idx').on(table.tenantId),
  index('parts_branch_idx').on(table.branchId),
  index('parts_supplier_idx').on(table.supplierId),
]);

export const servicesCatalog = pgTable('services_catalog', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  estimatedTimeMinutes: integer('estimated_time_minutes').notNull(),
  basePrice: numeric('base_price', { precision: 10, scale: 2 }).notNull(),
}, (table) => [
  index('services_tenant_idx').on(table.tenantId),
]);

export const workOrders = pgTable('work_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  branchId: uuid('branch_id').references(() => branches.id, { onDelete: 'set null' }), // nullable: Lite mode sem filial
  osNumber: integer('os_number').notNull(), // Mudado de generatedAlwaysAsIdentity para controle de sequência por tenant
  
  customerId: uuid('customer_id').references(() => customers.id).notNull(),
  vehicleId: uuid('vehicle_id').references(() => vehicles.id).notNull(),
  mechanicId: text('mechanic_id').references(() => user.id), 
  
  status: orderStatusEnum('status').default('CHECK_IN').notNull(),
  paymentStatus: paymentStatusEnum('payment_status').default('PENDING').notNull(),
  
  currentMileage: integer('current_mileage').notNull(),
  allocatedBox: varchar('allocated_box', { length: 20 }),
  
  fuelLevel: varchar('fuel_level', { length: 20 }),
  damages: text('damages'),
  checklist: text('checklist'),
  warranty: varchar('warranty', { length: 100 }),
  discount: numeric('discount', { precision: 10, scale: 2 }).default('0.00'),
  surcharge: numeric('surcharge', { precision: 10, scale: 2 }).default('0.00'),
  paymentMethod: varchar('payment_method', { length: 50 }),
  budgetAccessCode: varchar('budget_access_code', { length: 10 }),

  notes: text('notes'),
  diagnostic: text('diagnostic'),
  photoUrls: text('photo_urls').array(),
  
  statusChangedAt: timestamp('status_changed_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('work_orders_tenant_idx').on(table.tenantId),
  index('work_orders_branch_idx').on(table.branchId),
  index('work_orders_customer_idx').on(table.customerId),
  index('work_orders_vehicle_idx').on(table.vehicleId),
  index('work_orders_mechanic_idx').on(table.mechanicId),
  index('work_orders_status_idx').on(table.status),
]);

export const workOrderItems = pgTable('work_order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  workOrderId: uuid('work_order_id').references(() => workOrders.id, { onDelete: 'cascade' }).notNull(),
  
  type: varchar('type', { length: 10 }).notNull(), // 'PART' ou 'SERVICE'
  partId: uuid('part_id').references(() => partsInventory.id),
  serviceId: uuid('service_id').references(() => servicesCatalog.id),
  customName: varchar('custom_name', { length: 255 }),
  
  quantity: integer('quantity').default(1).notNull(),
  unitCostPrice: numeric('unit_cost_price', { precision: 10, scale: 2 }).notNull(),
  unitSalePrice: numeric('unit_sale_price', { precision: 10, scale: 2 }).notNull(),
  isApproved: integer('is_approved').default(0).notNull(),
}, (table) => [
  index('work_order_items_wo_idx').on(table.workOrderId),
  index('work_order_items_part_idx').on(table.partId),
  index('work_order_items_service_idx').on(table.serviceId),
]);

export const servicePriceOverrides = pgTable('service_price_overrides', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  serviceId: uuid('service_id').references(() => servicesCatalog.id, { onDelete: 'cascade' }).notNull(),
  carName: varchar('car_name', { length: 100 }).notNull(), // ex: "Civic"
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('service_overrides_tenant_idx').on(table.tenantId),
  index('service_overrides_service_idx').on(table.serviceId),
]);

export const partPriceOverrides = pgTable('part_price_overrides', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  partId: uuid('part_id').references(() => partsInventory.id, { onDelete: 'cascade' }).notNull(),
  carName: varchar('car_name', { length: 100 }).notNull(), // ex: "Corolla"
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('part_overrides_tenant_idx').on(table.tenantId),
  index('part_overrides_part_idx').on(table.partId),
]);

export const serviceParts = pgTable('service_parts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  serviceId: uuid('service_id').references(() => servicesCatalog.id, { onDelete: 'cascade' }).notNull(),
  partId: uuid('part_id').references(() => partsInventory.id, { onDelete: 'cascade' }).notNull(),
  quantity: integer('quantity').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('service_parts_tenant_idx').on(table.tenantId),
  index('service_parts_service_idx').on(table.serviceId),
  index('service_parts_part_idx').on(table.partId),
]);

export const whatsappConfig = pgTable('whatsapp_config', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).unique().notNull(),
  apiUrl: text('api_url').notNull(),
  apiToken: text('api_token'),
  sessionName: text('session_name'),
  status: text('status').default('DISCONNECTED').notNull(), // 'DISCONNECTED' | 'CONNECTED' | 'CONNECTING'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('whatsapp_config_tenant_idx').on(table.tenantId),
]);

// ==========================================
// RELACIONAMENTOS (Drizzle Relations)
// ==========================================

export const tenantsRelations = relations(tenants, ({ many, one }) => ({
  branches: many(branches),
  users: many(user),
  customers: many(customers),
  vehicles: many(vehicles),
  partsInventory: many(partsInventory),
  servicesCatalog: many(servicesCatalog),
  workOrders: many(workOrders),
  suppliers: many(suppliers),
  whatsappConfig: one(whatsappConfig),
  statusHistories: many(workOrderStatusHistory),
}));

export const whatsappConfigRelations = relations(whatsappConfig, ({ one }) => ({
  tenant: one(tenants, { fields: [whatsappConfig.tenantId], references: [tenants.id] }),
}));

export const branchesRelations = relations(branches, ({ one, many }) => ({
  tenant: one(tenants, { fields: [branches.tenantId], references: [tenants.id] }),
  users: many(user),
  workOrders: many(workOrders),
  partsInventory: many(partsInventory),
}));

export const usersRelations = relations(user, ({ one, many }) => ({
  tenant: one(tenants, { fields: [user.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [user.branchId], references: [branches.id] }),
  workOrdersAsMechanic: many(workOrders),
}));

export const workOrdersRelations = relations(workOrders, ({ one, many }) => ({
  tenant: one(tenants, { fields: [workOrders.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [workOrders.branchId], references: [branches.id] }),
  customer: one(customers, { fields: [workOrders.customerId], references: [customers.id] }),
  vehicle: one(vehicles, { fields: [workOrders.vehicleId], references: [vehicles.id] }),
  mechanic: one(user, { fields: [workOrders.mechanicId], references: [user.id] }),
  items: many(workOrderItems),
  statusHistory: many(workOrderStatusHistory),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  tenant: one(tenants, { fields: [customers.tenantId], references: [tenants.id] }),
  vehicles: many(vehicles),
  workOrders: many(workOrders),
}));

export const vehiclesRelations = relations(vehicles, ({ one, many }) => ({
  tenant: one(tenants, { fields: [vehicles.tenantId], references: [tenants.id] }),
  customer: one(customers, { fields: [vehicles.customerId], references: [customers.id] }),
  workOrders: many(workOrders),
}));

export const partsInventoryRelations = relations(partsInventory, ({ one, many }) => ({
  tenant: one(tenants, { fields: [partsInventory.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [partsInventory.branchId], references: [branches.id] }),
  supplier: one(suppliers, { fields: [partsInventory.supplierId], references: [suppliers.id] }),
  workOrderItems: many(workOrderItems),
  serviceParts: many(serviceParts),
  overrides: many(partPriceOverrides),
}));

export const servicesCatalogRelations = relations(servicesCatalog, ({ one, many }) => ({
  tenant: one(tenants, { fields: [servicesCatalog.tenantId], references: [tenants.id] }),
  workOrderItems: many(workOrderItems),
  serviceParts: many(serviceParts),
  overrides: many(servicePriceOverrides),
}));

export const workOrderItemsRelations = relations(workOrderItems, ({ one }) => ({
  workOrder: one(workOrders, { fields: [workOrderItems.workOrderId], references: [workOrders.id] }),
  part: one(partsInventory, { fields: [workOrderItems.partId], references: [partsInventory.id] }),
  service: one(servicesCatalog, { fields: [workOrderItems.serviceId], references: [servicesCatalog.id] }),
}));

export const suppliersRelations = relations(suppliers, ({ one, many }) => ({
  tenant: one(tenants, { fields: [suppliers.tenantId], references: [tenants.id] }),
  parts: many(partsInventory),
}));

export const servicePriceOverridesRelations = relations(servicePriceOverrides, ({ one }) => ({
  tenant: one(tenants, { fields: [servicePriceOverrides.tenantId], references: [tenants.id] }),
  service: one(servicesCatalog, { fields: [servicePriceOverrides.serviceId], references: [servicesCatalog.id] }),
}));

export const partPriceOverridesRelations = relations(partPriceOverrides, ({ one }) => ({
  tenant: one(tenants, { fields: [partPriceOverrides.tenantId], references: [tenants.id] }),
  part: one(partsInventory, { fields: [partPriceOverrides.partId], references: [partsInventory.id] }),
}));

export const servicePartsRelations = relations(serviceParts, ({ one }) => ({
  tenant: one(tenants, { fields: [serviceParts.tenantId], references: [tenants.id] }),
  service: one(servicesCatalog, { fields: [serviceParts.serviceId], references: [servicesCatalog.id] }),
  part: one(partsInventory, { fields: [serviceParts.partId], references: [partsInventory.id] }),
}));

// ==========================================
// HISTÓRICO DE STATUS E LOGS DA OS
// ==========================================

export const workOrderStatusHistory = pgTable('work_order_status_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  workOrderId: uuid('work_order_id').references(() => workOrders.id, { onDelete: 'cascade' }).notNull(),
  status: orderStatusEnum('status').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  changedById: text('changed_by_id').references(() => user.id, { onDelete: 'set null' }),
  notes: text('notes'),
}, (table) => [
  index('wo_status_history_tenant_idx').on(table.tenantId),
  index('wo_status_history_wo_idx').on(table.workOrderId),
]);

export const workOrderStatusHistoryRelations = relations(workOrderStatusHistory, ({ one }) => ({
  tenant: one(tenants, { fields: [workOrderStatusHistory.tenantId], references: [tenants.id] }),
  workOrder: one(workOrders, { fields: [workOrderStatusHistory.workOrderId], references: [workOrders.id] }),
  changedBy: one(user, { fields: [workOrderStatusHistory.changedById], references: [user.id] }),
}));

