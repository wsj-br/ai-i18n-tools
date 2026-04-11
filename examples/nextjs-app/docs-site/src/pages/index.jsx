import React from "react";
import { Redirect } from "@docusaurus/router";
import useBaseUrl from "@docusaurus/useBaseUrl";

/** root `/` redirects to the main doc (see `documentation/src/pages/index.tsx`). */
export default function Home() {
  const to = useBaseUrl("getting-started");
  return <Redirect to={to} />;
}
