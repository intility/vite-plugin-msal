import {
  createRootRoute,
  HeadContent,
  Scripts,
  useRouter,
} from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const MsalRoot = lazy(() => import("../auth/MsalRoot"));

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "vite-plugin-msal tanstack-start sample" },
    ],
  }),
  shellComponent: RootDocument,
  component: RootComponent,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const router = useRouter();

  if (router.isShell()) {
    return <h1>Loading...</h1>;
  }

  return (
    <Suspense fallback={<h1>Loading...</h1>}>
      <MsalRoot />
    </Suspense>
  );
}
