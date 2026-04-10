import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Заголовок курса для UI: если title пустой, показываем slug */
export function courseDisplayTitle(title: string | null | undefined, slug: string): string {
  const t = typeof title === "string" ? title.trim() : ""
  return t.length > 0 ? t : slug
}
