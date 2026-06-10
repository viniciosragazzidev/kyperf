import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding text-xs/relaxed font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 hover:text-primary active:bg-primary/30",
        none: "",
        outline:
          "border-border/60 bg-foreground/[0.02] text-foreground hover:bg-foreground/[0.06] hover:text-foreground active:bg-foreground/[0.1]",
        secondary:
          "bg-secondary/40 text-secondary-foreground border-secondary/20 hover:bg-secondary/60 hover:text-secondary-foreground active:bg-secondary/80",
        ghost:
          "hover:bg-foreground/[0.05] hover:text-foreground active:bg-foreground/[0.1] border-transparent",
        destructive:
          "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20 hover:text-destructive active:bg-destructive/30",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-7 gap-1 px-2 text-xs/relaxed has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        xs: "h-5 gap-1 rounded-sm px-2 text-[0.625rem] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-2.5",
        sm: "h-6 gap-1 px-2 text-xs/relaxed has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        lg: "h-8 gap-1 px-2.5 text-xs/relaxed has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-4",
        icon: "size-7 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-xs": "size-5 rounded-sm [&_svg:not([class*='size-'])]:size-2.5",
        "icon-sm": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-lg": "size-8 [&_svg:not([class*='size-'])]:size-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const transformToBadgeStyle = (className: string): string => {
  let classes = className.split(/\s+/);
  
  let hasSolidBg = false;
  for (const c of classes) {
    if (c.startsWith("bg-") && 
        !c.includes("/") &&
        !c.startsWith("bg-clip-") && 
        !c.startsWith("bg-origin-") &&
        !c.startsWith("bg-blend-") &&
        c !== "bg-cover" && 
        c !== "bg-contain" && 
        c !== "bg-center" && 
        c !== "bg-no-repeat" && 
        c !== "bg-repeat" &&
        c !== "bg-local" &&
        c !== "bg-scroll" &&
        c !== "bg-fixed" &&
        c !== "bg-auto" &&
        c !== "bg-transparent") {
      hasSolidBg = true;
      break;
    }
  }

  if (!hasSolidBg) {
    return className;
  }

  classes = classes.map(c => {
    // Transform bg-[color]
    const bgMatch = c.match(/^bg-(emerald|green|red|amber|orange|blue|indigo|purple|pink|yellow|zinc|gray|neutral|slate)-?([0-9]*)$/);
    if (bgMatch) {
      const color = bgMatch[1];
      const weight = bgMatch[2] || "500";
      return `bg-${color}-${weight}/10 border border-${color}-${weight}/20 text-${color}-600 dark:text-${color}-400`;
    }

    if (c === "bg-primary") {
      return "bg-primary/10 border border-primary/20 text-primary";
    }
    
    if (c === "bg-secondary") {
      return "bg-secondary/40 border border-secondary/20 text-secondary-foreground";
    }

    if (c === "bg-muted") {
      return "bg-muted/50 border border-border/40 text-foreground";
    }

    // Transform hover:bg-[color]
    const hoverMatch = c.match(/^hover:bg-(emerald|green|red|amber|orange|blue|indigo|purple|pink|yellow|zinc|gray|neutral|slate)-?([0-9]*)$/);
    if (hoverMatch) {
      const color = hoverMatch[1];
      const weight = hoverMatch[2] || "500";
      return `hover:bg-${color}-${weight}/20`;
    }

    if (c === "hover:bg-primary/80" || c === "hover:bg-primary") {
      return "hover:bg-primary/20";
    }

    if (c === "hover:bg-secondary/80" || c === "hover:bg-secondary") {
      return "hover:bg-secondary/60";
    }

    if (c === "hover:bg-muted/80" || c === "hover:bg-muted") {
      return "hover:bg-muted/80";
    }

    // Remove text-white / text-black / text-primary-foreground / text-secondary-foreground if we transformed a custom background
    if (c === "text-white" || c === "text-black" || c === "text-primary-foreground" || c === "text-secondary-foreground") {
      return "";
    }

    // Remove existing borders that might clash
    if (c.startsWith("border-emerald-") || 
        c.startsWith("border-green-") || 
        c.startsWith("border-red-") || 
        c.startsWith("border-amber-") || 
        c.startsWith("border-blue-") || 
        c.startsWith("border-primary") || 
        c.startsWith("border-secondary")) {
      return "";
    }

    return c;
  });

  return classes.filter(Boolean).join(" ");
};

const hasCustomBgOrHover = (className?: string | ((state: any) => string | undefined)) => {
  if (!className || typeof className !== "string") return false;
  const classes = className.split(/\s+/);
  return classes.some(c => 
    (c.startsWith("bg-") || c.startsWith("hover:bg-") || c.startsWith("dark:hover:bg-") || c.startsWith("focus:bg-")) && 
    !c.startsWith("bg-clip-") && 
    !c.startsWith("bg-origin-") &&
    !c.startsWith("bg-blend-") &&
    c !== "bg-cover" && 
    c !== "bg-contain" && 
    c !== "bg-center" && 
    c !== "bg-no-repeat" && 
    c !== "bg-repeat" &&
    c !== "bg-local" &&
    c !== "bg-scroll" &&
    c !== "bg-fixed" &&
    c !== "bg-auto"
  );
};

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  const transformedClassName = typeof className === "string" ? transformToBadgeStyle(className) : className;
  const resolvedVariant = variant === "default" && hasCustomBgOrHover(transformedClassName) ? "none" : variant;
  
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant: resolvedVariant, size, className: transformedClassName }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
