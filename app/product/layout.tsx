import { AuthButtons } from "@/components/AuthButtons";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { StoreUser } from "@/components/StoreUser";
import { cn } from "@/lib/utils";
import { ChatBubbleIcon, HomeIcon, ReaderIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { ReactNode } from "react";

export default function ProductLayout({ children }: { children: ReactNode }) {
  return (
    <ConvexClientProvider>
      <StoreUser />
      <div className="flex min-h-screen w-full">
        <ProductMenu />
        <div className="flex w-full flex-col">
          <header className="sticky top-0 z-10 flex h-20 items-center justify-end border-b bg-background/80 px-4 backdrop-blur md:px-6">
            <AuthButtons />
          </header>
          {children}
        </div>
      </div>
    </ConvexClientProvider>
  );
}

function ProductMenu() {
  return (
    <aside className="w-48 border-r bg-muted/40 p-2">
      <nav className="flex h-full max-h-screen flex-col gap-2">
        <MenuLink href="/product" active>
          <ChatBubbleIcon className="h-4 w-4" />
          Chat
        </MenuLink>

        <MenuLink href="https://docs.convex.dev">
          <ReaderIcon className="h-4 w-4" />
          Docs
        </MenuLink>
        <MenuLink href="/">
          <HomeIcon className="h-4 w-4" />
          Home
        </MenuLink>
      </nav>
    </aside>
  );
}

function MenuLink({
  active,
  href,
  children,
}: {
  active?: boolean;
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium  text-muted-foreground transition-all hover:text-primary",
        active && "bg-muted text-primary",
      )}
    >
      {children}
    </Link>
  );
}
