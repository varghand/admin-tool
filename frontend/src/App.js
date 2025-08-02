import { useState } from "react";
import { Authenticator } from "@aws-amplify/ui-react";
import UserLookupPage from "./UserLookupPage";
import UsersByAdventurePage from "./UsersByAdventurePage";

function App() {
  return (
    <Authenticator signUpAttributes={[]} variation="modal" hideSignUp={true}>
      <div className="flex min-h-screen bg-brand-gray-light text-black">
        <aside className="w-64 bg-brand-purple-dark text-white flex flex-col p-4">
          <h1 className="text-xl font-bold mb-6">Sound Realms Admin</h1>
          <nav className="space-y-2">
            <button className="w-full text-left px-3 py-2 rounded hover:bg-brand-purple">
              User Lookup
            </button>
          </nav>
        </aside>

        <main className="flex-1 p-8 overflow-auto">
          <UsersByAdventurePage />
        </main>
      </div>
    </Authenticator>
  );
}

export default App;
