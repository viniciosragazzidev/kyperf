CREATE TABLE "part_price_overrides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"part_id" uuid NOT NULL,
	"car_name" varchar(100) NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_parts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"part_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_price_overrides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"car_name" varchar(100) NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"phone" varchar(20),
	"email" text,
	"cnpj" varchar(18),
	"address" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "work_orders" ALTER COLUMN "os_number" DROP IDENTITY;--> statement-breakpoint
ALTER TABLE "branches" ADD COLUMN "cnpj" varchar(18);--> statement-breakpoint
ALTER TABLE "branches" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "parts_inventory" ADD COLUMN "supplier_id" uuid;--> statement-breakpoint
ALTER TABLE "parts_inventory" ADD COLUMN "compatible_cars" text;--> statement-breakpoint
ALTER TABLE "parts_inventory" ADD COLUMN "dimension" varchar(100);--> statement-breakpoint
ALTER TABLE "parts_inventory" ADD COLUMN "size" varchar(50);--> statement-breakpoint
ALTER TABLE "parts_inventory" ADD COLUMN "weight" varchar(50);--> statement-breakpoint
ALTER TABLE "services_catalog" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "onboarding_completed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "mileage" integer;--> statement-breakpoint
ALTER TABLE "work_order_items" ADD COLUMN "custom_name" varchar(255);--> statement-breakpoint
ALTER TABLE "work_orders" ADD COLUMN "fuel_level" varchar(20);--> statement-breakpoint
ALTER TABLE "work_orders" ADD COLUMN "damages" text;--> statement-breakpoint
ALTER TABLE "work_orders" ADD COLUMN "checklist" text;--> statement-breakpoint
ALTER TABLE "work_orders" ADD COLUMN "warranty" varchar(100);--> statement-breakpoint
ALTER TABLE "work_orders" ADD COLUMN "discount" numeric(10, 2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE "work_orders" ADD COLUMN "surcharge" numeric(10, 2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE "work_orders" ADD COLUMN "payment_method" varchar(50);--> statement-breakpoint
ALTER TABLE "part_price_overrides" ADD CONSTRAINT "part_price_overrides_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "part_price_overrides" ADD CONSTRAINT "part_price_overrides_part_id_parts_inventory_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts_inventory"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_parts" ADD CONSTRAINT "service_parts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_parts" ADD CONSTRAINT "service_parts_service_id_services_catalog_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services_catalog"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_parts" ADD CONSTRAINT "service_parts_part_id_parts_inventory_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts_inventory"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_price_overrides" ADD CONSTRAINT "service_price_overrides_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_price_overrides" ADD CONSTRAINT "service_price_overrides_service_id_services_catalog_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services_catalog"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "part_overrides_tenant_idx" ON "part_price_overrides" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "part_overrides_part_idx" ON "part_price_overrides" USING btree ("part_id");--> statement-breakpoint
CREATE INDEX "service_parts_tenant_idx" ON "service_parts" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "service_parts_service_idx" ON "service_parts" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "service_parts_part_idx" ON "service_parts" USING btree ("part_id");--> statement-breakpoint
CREATE INDEX "service_overrides_tenant_idx" ON "service_price_overrides" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "service_overrides_service_idx" ON "service_price_overrides" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "suppliers_tenant_idx" ON "suppliers" USING btree ("tenant_id");--> statement-breakpoint
ALTER TABLE "parts_inventory" ADD CONSTRAINT "parts_inventory_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "branches_tenant_idx" ON "branches" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "customers_tenant_idx" ON "customers" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "parts_tenant_idx" ON "parts_inventory" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "parts_branch_idx" ON "parts_inventory" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "parts_supplier_idx" ON "parts_inventory" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "services_tenant_idx" ON "services_catalog" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_tenant_idx" ON "user" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "user_branch_idx" ON "user" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "vehicles_tenant_idx" ON "vehicles" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "vehicles_customer_idx" ON "vehicles" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "work_order_items_wo_idx" ON "work_order_items" USING btree ("work_order_id");--> statement-breakpoint
CREATE INDEX "work_order_items_part_idx" ON "work_order_items" USING btree ("part_id");--> statement-breakpoint
CREATE INDEX "work_order_items_service_idx" ON "work_order_items" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "work_orders_tenant_idx" ON "work_orders" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "work_orders_branch_idx" ON "work_orders" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "work_orders_customer_idx" ON "work_orders" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "work_orders_vehicle_idx" ON "work_orders" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "work_orders_mechanic_idx" ON "work_orders" USING btree ("mechanic_id");--> statement-breakpoint
CREATE INDEX "work_orders_status_idx" ON "work_orders" USING btree ("status");