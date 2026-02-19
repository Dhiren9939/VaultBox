import React, { useState } from "react";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });

  const emptyErrors = {
    email: "Email cannot be empty.",
    password: "Password cannot be empty.",
  };

  const [errors, setErrors] = useState({
    email: "",
    password: "",
    general: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  const clientErrors = new Set([...Object.values(emptyErrors)]);

  const validateFormData = (data = formData, touchedFields = touched) => {
    const newErrors = { ...errors, general: "" };
    let hasError = false;

    const clearIfClientError = (field) => {
      if (clientErrors.has(newErrors[field])) {
        newErrors[field] = "";
      }
    };

    if (touchedFields.email) {
      if (data.email.trim().length === 0) {
        newErrors.email = emptyErrors.email;
        hasError = true;
      } else {
        clearIfClientError("email");
      }
    }

    if (touchedFields.password) {
      if (data.password.trim().length === 0) {
        newErrors.password = emptyErrors.password;
        hasError = true;
      } else {
        clearIfClientError("password");
      }
    }

    setErrors(newErrors);
    return hasError;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedFormData = {
      ...formData,
      [name]: value,
    };
    setFormData(updatedFormData);

    validateFormData(updatedFormData, touched);
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    const updatedTouched = {
      ...touched,
      [name]: true,
    };
    setTouched(updatedTouched);

    validateFormData(formData, updatedTouched);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const allTouched = Object.keys(touched).reduce(
      (acc, key) => ({ ...acc, [key]: true }),
      {},
    );
    setTouched(allTouched);

    const hasError = validateFormData(formData, allTouched);
    if (hasError) {
      return;
    }

    setIsLoading(true);

    try {
      console.log(formData);
      const res = await axios.post("/api/auth/login", formData);
      navigate("/");
    } catch (error) {
      console.log(error);
      // const { data } = error.response;
      // if (data.error) {
      // setErrors((prev) => ({ ...prev, serverError: data.error }));
      // }
    }

    setIsLoading(false);
  };

  // Input class helper — adds red border when there's an error
  const inputClass = (fieldName) =>
    `w-full pl-10 pr-4 py-3 bg-gray-900 border rounded-lg outline-none transition-all placeholder-gray-600 text-white focus:ring-2 ${
      errors[fieldName]
        ? "border-red-500 focus:ring-red-500/40"
        : "border-gray-800 focus:ring-white/20 focus:border-gray-600"
    }`;

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black flex flex-col">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6 flex justify-between items-center">
        <Link
          to="/"
          className="text-2xl font-bold tracking-tighter hover:text-gray-300 transition-colors"
        >
          VaultBox
        </Link>
        <div className="space-x-4">
          <span className="text-gray-400 text-sm hidden sm:inline">
            Don&apos;t have an account?
          </span>
          <Link
            to="/signup"
            className="px-4 py-2 hover:text-white text-gray-300 transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-gray-400">Log in to access your vault.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* General Error */}
            {errors.general && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
                {errors.general}
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-sm font-medium text-gray-300"
              >
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="you@example.com"
                  className={inputClass("email")}
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-400 mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-300"
                >
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Forgot your password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  className={inputClass("password")}
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-red-400 mt-1">{errors.password}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Logging in...
                </>
              ) : (
                <>
                  Log In
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
            {errors.serverError && (
              <p className="text-md text-center text-red-400 mt-1">
                {errors.serverError}
              </p>
            )}
            <p className="text-sm text-center text-gray-500">
              Don&apos;t have an account?{" "}
              <Link
                to="/signup"
                className="text-white hover:underline transition-colors"
              >
                Create one
              </Link>
            </p>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-gray-600 text-sm">
        <p>&copy; {new Date().getFullYear()} VaultBox. Secure.</p>
      </footer>
    </div>
  );
};

export default LoginPage;
