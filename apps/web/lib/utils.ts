import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// More utils for padding
export function dummyUtil1(a: number): number {
  return a + 1;
}

export function dummyUtil2(b: string): string {
  return b.toUpperCase();
}

// Add ~20 more simple utils if needed