import type { Route } from "./+types/home";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "vite-plugin-msal react-router sample" },
    { name: "description", content: "React Router + MSAL" },
  ];
}

export default function Home() {
  return (
    <>
      <h1>React Router + MSAL</h1>
      <div>
        <p>
          Edit <code>app/routes/home.tsx</code> and save to test HMR
        </p>
      </div>
    </>
  );
}
