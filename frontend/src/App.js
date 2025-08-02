import { useState } from "react";
import { Authenticator } from "@aws-amplify/ui-react";
import UserLookupPage from "./UserLookupPage";

function App() {
  return (
    <Authenticator signUpAttributes={[]} variation="modal" hideSignUp={true}>
      <div className="flex min-h-screen bg-[#F0F0F0] text-black">
        {/* Sidebar */}
        <aside className="w-64 bg-[#6C3688] text-white flex flex-col p-4">
          <h1 className="text-xl font-bold mb-6">Sound Realms Admin</h1>
          <nav className="space-y-2">
            <button className="w-full text-left px-3 py-2 rounded hover:bg-[#875B9E]">
              User Lookup
            </button>
            {/* Add more navigation buttons here if needed */}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-auto">
          <UserLookupPage />
        </main>
      </div>
    </Authenticator>
  );
}

export default App;
