import Link from "next/link";
import { Wordmark } from "./Logo";

export function BrandMark({ href = "/", variant = "dark" }: { href?: string; variant?: "dark" | "light" }) {
  return (
    <Link href={href}>
      <Wordmark variant={variant} />
    </Link>
  );
}
