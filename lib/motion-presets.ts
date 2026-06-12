import { Variants } from "framer-motion"

// Coeficientes físicos de molas (Spring Presets)
export const transitionSpring = {
  type: "spring",
  stiffness: 300,
  damping: 20,
  mass: 0.8
} as const

export const transitionSpringBouncy = {
  type: "spring",
  stiffness: 400,
  damping: 15,
  mass: 1
} as const

export const transitionSpringSmooth = {
  type: "spring",
  stiffness: 180,
  damping: 24,
  mass: 1.2
} as const

export const transitionSpringStiff = {
  type: "spring",
  stiffness: 500,
  damping: 30,
  mass: 0.5
} as const

// Variantes de Micro-Interações (Hover & Clique/Squeeze)
export const varClickSqueeze: Variants = {
  initial: { scale: 1, y: 0 },
  hover: { 
    scale: 1.02, 
    y: -2,
    transition: transitionSpring 
  },
  tap: { 
    scale: 0.97, 
    y: 0,
    transition: { type: "spring", stiffness: 600, damping: 12 } 
  }
}

// Variantes de Entrada Macro
export const varFadeInScale: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    transition: transitionSpring 
  },
  exit: { 
    opacity: 0, 
    scale: 0.98, 
    transition: { duration: 0.15, ease: "easeIn" } 
  }
}

// Variantes de Entrada em Cascata (Staggered Children)
export const varStaggerContainer = (staggerChildren = 0.05, delayChildren = 0): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren,
      delayChildren
    }
  }
})

export const varStaggerItem: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitionSpring
  }
}
