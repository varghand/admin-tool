import { Authenticator } from "@aws-amplify/ui-react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import UserLookupPage from "./UserLookupPage";

function App() {
  return (
    <Authenticator signUpAttributes={[]} variation="modal" hideSignUp={true}>
      <Router>
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <div className="w-64 bg-gray-800 text-white p-6 space-y-4">
            <h1 className="text-xl font-bold">Admin Tool</h1>
            <nav className="space-y-2">
              <Link
                to="/"
                className="block px-3 py-2 rounded hover:bg-gray-700"
              >
                User Lookup
              </Link>
              {/* Add more links here */}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 bg-gray-100 p-6">
            <Routes>
              <Route path="/" element={<UserLookupPage />} />
              {/* Add other <Route> components here for other pages */}
            </Routes>
          </div>
        </div>
      </Router>
    </Authenticator>
  );
}

export default App;
