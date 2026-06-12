ALTER TABLE "work_orders" DROP CONSTRAINT "work_orders_branch_id_branches_id_fk";
--> statement-breakpoint
ALTER TABLE "work_orders" ALTER COLUMN "branch_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "is_dev" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE set null ON UPDATE no action;