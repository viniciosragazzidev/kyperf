CREATE TABLE "work_order_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"work_order_id" uuid NOT NULL,
	"status" "order_status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"changed_by_id" text,
	"notes" text
);
--> statement-breakpoint
ALTER TABLE "work_order_status_history" ADD CONSTRAINT "work_order_status_history_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_order_status_history" ADD CONSTRAINT "work_order_status_history_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_order_status_history" ADD CONSTRAINT "work_order_status_history_changed_by_id_user_id_fk" FOREIGN KEY ("changed_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "wo_status_history_tenant_idx" ON "work_order_status_history" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "wo_status_history_wo_idx" ON "work_order_status_history" USING btree ("work_order_id");