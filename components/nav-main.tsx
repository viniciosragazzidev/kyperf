"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { usePathname } from "next/navigation"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon } from "@hugeicons/core-free-icons"

export function NavMain({
  items,
  label = "Platform",
}: {
  items: {
    title: string
    url: string
    icon: React.ReactNode
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
  label?: string
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const pathname = usePathname()

  return (
    <SidebarGroup onMouseLeave={() => setHoveredIndex(null)}>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item, index) => {
          // Dynamic active state detection
          const isDirectlyActive = pathname === item.url
          const hasActiveChild = item.items?.some(sub => pathname === sub.url)
          const isActive = isDirectlyActive || hasActiveChild

          return (
            <Collapsible
              key={item.title}
              defaultOpen={isActive || item.isActive}
              render={<SidebarMenuItem onMouseEnter={() => setHoveredIndex(index)} />}
            >
              <div className="relative w-full group/main-item">
                <AnimatePresence>
                  {hoveredIndex === index && !isActive && (
                    <motion.div
                      layoutId={`hover-bg-${label}`}
                      className="absolute inset-0 z-0 rounded-md bg-sidebar-accent"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.4
                      }}
                    />
                  )}
                </AnimatePresence>
                
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={isActive}
                  className="target-hover-effect target-hover-trigger hover:bg-transparent! w-full relative z-10"
                  render={item.items?.length ? <CollapsibleTrigger /> : <a href={item.url} />}
                >
                  {item.icon}
                  <span>{item.title}</span>
                  {item.items?.length ? (
                    <div className="ml-auto px-2 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90">
                      <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-4" />
                      <span className="sr-only">Toggle</span>
                    </div>
                  ) : null}
                </SidebarMenuButton>
              </div>
              {item.items?.length ? (
                <CollapsibleContent className="w-full">
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => {
                      const isSubActive = pathname === subItem.url
                      return (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton 
                            render={<a href={subItem.url} />}
                            data-active={isSubActive}
                            className="data-active:bg-sidebar-accent/50 data-active:text-sidebar-accent-foreground"
                          >
                            <span>{subItem.title}</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              ) : null}
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
