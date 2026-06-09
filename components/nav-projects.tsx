"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import { MoreHorizontalCircle01Icon, FolderIcon, Share03Icon, Delete02Icon } from "@hugeicons/core-free-icons"

export function NavProjects({
  projects,
}: {
  projects: {
    name: string
    url: string
    icon: React.ReactNode
  }[]
}) {
  const { isMobile } = useSidebar()
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <SidebarGroup 
      className="group-data-[collapsible=icon]:hidden"
      onMouseLeave={() => setHoveredIndex(null)}
    >
      <SidebarGroupLabel>Projetos</SidebarGroupLabel>
      <SidebarMenu>
        {projects.map((item, index) => (
          <SidebarMenuItem 
            key={item.name}
            onMouseEnter={() => setHoveredIndex(index)}
          >
            <AnimatePresence>
              {hoveredIndex === index && (
                <motion.div
                  layoutId="hover-bg-projects"
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
              render={<a href={item.url} />}
              className="relative z-10 hover:bg-transparent!"
            >
              {item.icon}
              <span>{item.name}</span>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuAction
                    showOnHover
                    className="relative z-10 aria-expanded:bg-sidebar-accent aria-expanded:text-sidebar-accent-foreground"
                  />
                }
              >
                <HugeiconsIcon icon={MoreHorizontalCircle01Icon} strokeWidth={2} />
                <span className="sr-only">More</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-48"
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}
              >
                <DropdownMenuItem>
                  <HugeiconsIcon icon={FolderIcon} strokeWidth={2} className="text-muted-foreground" />
                  <span>View Project</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <HugeiconsIcon icon={Share03Icon} strokeWidth={2} className="text-muted-foreground" />
                  <span>Share Project</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="text-muted-foreground" />
                  <span>Delete Project</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
        <SidebarMenuItem onMouseEnter={() => setHoveredIndex(99)}>
          <AnimatePresence>
            {hoveredIndex === 99 && (
              <motion.div
                layoutId="hover-bg-projects"
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
          <SidebarMenuButton className="relative z-10 hover:bg-transparent!">
            <HugeiconsIcon icon={MoreHorizontalCircle01Icon} strokeWidth={2} />
            <span>More</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}
