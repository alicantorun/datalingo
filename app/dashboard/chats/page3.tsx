"use client";

import { Chat } from "./chat";

export default function Page() {
  return (
    <main>
      <div className="flex flex-col md:flex-row md:flex-wrap">
        <div className="md:w-1/2 w-full h-full">DASHBOARD</div>
        <div className="w-1/2">
          <Chat />
        </div>
      </div>
    </main>
  );
}
