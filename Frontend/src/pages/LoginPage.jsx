import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import logo from "../images/logo.png";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const { login, error, loading } = useAuth();
  const navigate = useNavigate();

  // Validate email function
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Reset errors
    setEmailError("");
    setPasswordError("");

    // Validate inputs
    let hasError = false;

    if (!email.trim()) {
      setEmailError("Email is required");
      hasError = true;
    } else if (!validateEmail(email)) {
      setEmailError("Invalid email format");
      hasError = true;
    }

    if (!password) {
      setPasswordError("Password is required");
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      hasError = true;
    }

    if (hasError) return;

    try {
      // Call login function from AuthContext
      const user = await login(email, password);

      console.log("User data for redirection:", user);      // Redirect based on user role from API response
      if (user) {
        // The role should already be normalized to lowercase from AuthContext
        const userRole = user.role || '';
        console.log("Redirecting based on role:", userRole);

        switch (userRole) {
          case "admin":
            console.log("Redirecting to admin dashboard");
            navigate("/admin/dashboard");
            break;
          case "host":
            console.log("Redirecting to host dashboard");
            navigate("/host/dashboard");
            break;
          case "user":
            console.log("Redirecting to user dashboard");
            navigate("/user/dashboard");
            break;
          default:
            // If role is not defined, navigate to a default page
            console.warn(`Unknown user role: ${user.role}`);
            navigate("/");
        }
      }
    } catch (error) {
      // Error handling is done in the AuthContext
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 to-green-500 flex flex-col justify-center items-center px-4">
      <div className="text-white text-center mb-8">
        <div className="flex justify-center mb-4">
          <img src={logo} alt="Samku Logo" className="h-16 w-16" />
        </div>
        <h1 className="text-4xl font-bold mb-2 drop-shadow-md">Samku EV</h1>
        <p className="text-xl text-white text-opacity-90">
          Electric Vehicle Charging Management
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Login to Your Account
        </h2>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-gray-700 font-medium mb-2"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                emailError ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter your email"
            />
            {emailError && (
              <p className="mt-1 text-red-500 text-sm">{emailError}</p>
            )}
          </div>

          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-gray-700 font-medium mb-2"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                passwordError ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter your password"
            />
            {passwordError && (
              <p className="mt-1 text-red-500 text-sm">{passwordError}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-gradient-to-r from-blue-500 to-green-500 text-white font-medium rounded-lg transition hover:from-blue-600 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Logging In...
              </span>
            ) : (
              "Login"
            )}
          </button>

          <div className="mt-4 text-center">
            <a
              href="#"
              className="text-blue-500 hover:text-blue-700 text-sm"
              onClick={(e) => {
                e.preventDefault();
                // Add forgot password functionality here
              }}
            >
              Forgot Password?
            </a>
          </div>

          <div className="mt-4 text-center">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-blue-500 hover:text-blue-700 font-medium"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </form>
      </div>

      <div className="mt-8 text-white text-xl">
        Developed by{" "}
        <span className="font-bold text-blue-900">DevDotCom</span>
      </div>
    </div>
  );
};

export default LoginPage;
