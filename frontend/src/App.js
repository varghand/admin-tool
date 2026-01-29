import { useState } from "react";
import { Authenticator } from "@aws-amplify/ui-react";

import UserLookupPage from "./UserLookupPage";
import UsersByAdventurePage from "./UsersByAdventurePage";
import SalesReport from "./SalesReport";
import RoyaltyReport from "./RoyaltyReport";
import ActivationCodeStatsPage from "./ActivationCodeStatsPage";
import AdventuresListPage from "./AdventuresPage";

function App() {
  const [activePage, setActivePage] = useState("user-lookup");
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNav = (page) => {
    setActivePage(page);
    setMenuOpen(false); // close mobile menu after navigation
  };

  const renderPage = () => {
    switch (activePage) {
      case "user-lookup":
        return <UserLookupPage />;
      case "users-by-adventure":
        return <UsersByAdventurePage />;
      case "stripe-sales":
        return <SalesReport />;
      case "activation-codes":
        return <ActivationCodeStatsPage />;
      case "royalty-report":
        return <RoyaltyReport />;
      case "adventures":
        return <AdventuresListPage />;
      default:
        return null;
    }
  };

  const NavButtons = ({ mobile = false }) => (
    <nav className={`space-y-2 ${mobile ? "" : ""}`}>
      <button
        onClick={() => handleNav("user-lookup")}
        className={`w-full text-left px-3 py-2 rounded hover:bg-brand-purple ${
          activePage === "user-lookup" ? "bg-brand-purple" : ""
        }`}
      >
        User Lookup
      </button>

      <button
        onClick={() => handleNav("users-by-adventure")}
        className={`w-full text-left px-3 py-2 rounded hover:bg-brand-purple ${
          activePage === "users-by-adventure" ? "bg-brand-purple" : ""
        }`}
      >
        List Users by Adventure
      </button>

      <button
        onClick={() => handleNav("stripe-sales")}
        className={`w-full text-left px-3 py-2 rounded hover:bg-brand-purple ${
          activePage === "stripe-sales" ? "bg-brand-purple" : ""
        }`}
      >
        Sales Report
      </button>

      <button
        onClick={() => handleNav("activation-codes")}
        className={`w-full text-left px-3 py-2 rounded hover:bg-brand-purple ${
          activePage === "activation-codes" ? "bg-brand-purple" : ""
        }`}
      >
        Activation Codes
      </button>

      <button
        onClick={() => handleNav("royalty-report")}
        className={`w-full text-left px-3 py-2 rounded hover:bg-brand-purple ${
          activePage === "royalty-report" ? "bg-brand-purple" : ""
        }`}
      >
        Royalty Report
      </button>

      <button
        onClick={() => handleNav("adventures")}
        className={`w-full text-left px-3 py-2 rounded hover:bg-brand-purple ${
          activePage === "adventures" ? "bg-brand-purple" : ""
        }`}
      >
        Adventures
      </button>
    </nav>
  );

  return (
    <Authenticator signUpAttributes={[]} variation="modal" hideSignUp={true}>
      <div className="flex min-h-screen bg-brand-gray-light text-black font-sans">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-64 bg-brand-purple-dark text-white flex-col p-4">
          <img
            src="/3_SR_BrandLogo_White_TM.png"
            alt="Sound Realms Logo"
            className="w-50 mb-6 mx-auto"
          />
          <h1 className="text-xl font-bold mb-6">Admin Tool</h1>
          <NavButtons />
        </aside>

        {/* Mobile header */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-brand-purple-dark text-white flex items-center justify-between p-3">
          <div className="flex items-center">
            <button
              aria-label="Open menu"
              onClick={() => setMenuOpen(true)}
              className="mr-3 p-2"
            >
              {/* simple hamburger */}
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                className="text-white"
              >
                <path
                  d="M3 6h18M3 12h18M3 18h18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <img
              src="/3_SR_BrandLogo_White_TM.png"
              alt="Sound Realms Logo"
              className="w-36"
            />
          </div>
        </div>

        {/* Mobile overlay menu */}
        {menuOpen && (
          <>
            <div
              className="fixed inset-0 bg-black bg-opacity-40 z-30"
              onClick={() => setMenuOpen(false)}
            />
            <aside className="fixed top-0 left-0 h-full w-64 bg-brand-purple-dark text-white p-4 z-40">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">Admin Tool</h2>
                <button
                  aria-label="Close menu"
                  onClick={() => setMenuOpen(false)}
                  className="p-2"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="text-white"
                  >
                    <path
                      d="M6 6l12 12M18 6L6 18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>

              <NavButtons mobile />
            </aside>
          </>
        )}

        {/* Main content area (add top padding on mobile to avoid the fixed header) */}
        <main className="flex-1 p-8 overflow-auto md:pl-8 md:pt-8 pt-20">
          {renderPage()}
        </main>
      </div>
    </Authenticator>
  );
}

export default App;
