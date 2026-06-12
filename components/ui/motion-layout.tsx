"use client"

import React from "react"
import { motion, HTMLMotionProps } from "framer-motion"
import { varClickSqueeze, varStaggerContainer, varStaggerItem, varFadeInScale } from "@/lib/motion-presets"

interface MotionCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode
}

export function MotionCard({ children, className, ...props }: MotionCardProps) {
  return (
    <motion.div
      variants={varClickSqueeze}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

interface MotionButtonProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode
}

export function MotionButton({ children, className, ...props }: MotionButtonProps) {
  return (
    <motion.button
      variants={varClickSqueeze}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  )
}

interface MotionContainerProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode
  staggerChildren?: number
  delayChildren?: number
}

export function MotionContainer({ 
  children, 
  staggerChildren = 0.05, 
  delayChildren = 0,
  ...props 
}: MotionContainerProps) {
  return (
    <motion.div
      variants={varStaggerContainer(staggerChildren, delayChildren)}
      initial="hidden"
      animate="visible"
      exit="exit"
      {...props}
    >
      {children}
    </motion.div>
  )
}

interface MotionItemProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode
}

export function MotionItem({ children, ...props }: MotionItemProps) {
  return (
    <motion.div
      variants={varStaggerItem}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function MotionFadeScale({ children, ...props }: MotionItemProps) {
  return (
    <motion.div
      variants={varFadeInScale}
      initial="hidden"
      animate="visible"
      exit="exit"
      {...props}
    >
      {children}
    </motion.div>
  )
}
