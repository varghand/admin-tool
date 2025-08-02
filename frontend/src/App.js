import { useState } from "react";
import { Authenticator } from "@aws-amplify/ui-react";

import UserLookupPage from "./UserLookupPage";
import UsersByAdventurePage from "./UsersByAdventurePage";

function App() {
  const [activePage, setActivePage] = useState("user-lookup");

  const renderPage = () => {
    switch (activePage) {
      case "user-lookup":
        return <UserLookupPage />;
      case "users-by-adventure":
        return <UsersByAdventurePage />;
      default:
        return null;
    }
  };

  return (
    <Authenticator signUpAttributes={[]} variation="modal" hideSignUp={true}>
      <div className="flex min-h-screen bg-brand-gray-light text-black font-sans">
        <aside className="w-64 bg-brand-purple-dark text-white flex flex-col p-4">
          <img
            src="/3_SR_BrandLogo_White_TM.png"
            alt="Sound Realms Logo"
            className="w-50 mb-6 mx-auto"
          />
          <h1 className="text-xl font-bold mb-6">Admin Tool</h1>
          <nav className="space-y-2">
            <button
              onClick={() => setActivePage("user-lookup")}
              className={`w-full text-left px-3 py-2 rounded hover:bg-brand-purple ${
                activePage === "user-lookup" ? "bg-brand-purple" : ""
              }`}
            >
              User Lookup
            </button>
            <button
              onClick={() => setActivePage("users-by-adventure")}
              className={`w-full text-left px-3 py-2 rounded hover:bg-brand-purple ${
                activePage === "users-by-adventure" ? "bg-brand-purple" : ""
              }`}
            >
              List Users by Adventure
            </button>
          </nav>
        </aside>

        <main className="flex-1 p-8 overflow-auto">{renderPage()}</main>
      </div>
    </Authenticator>
  );
}

export default App;
