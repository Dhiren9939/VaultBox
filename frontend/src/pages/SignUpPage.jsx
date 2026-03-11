import React, { useState } from "react";
import { User, Mail, ArrowRight, Lock, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import zxcvbn from "zxcvbn";
import axios from "axios";

const SignUpPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [touched, setTouched] = useState({
    firstName: false,
    lastName: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  const emptyErrors = {
    firstName: "First Name cannot be empty.",
    lastName: "Last Name cannot be empty.",
    email: "Email cannot be empty.",
    password: "Password cannot be empty.",
    confirmPassword: "Confirm Password cannot be empty.",
  };

  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    serverError: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  const clientErrors = new Set([
    ...Object.values(emptyErrors),
    'Password must reach "Strong" strength to proceed.',
    "Passwords do not match.",
  ]);

  const validateFormData = (data = formData, touchedFields = touched) => {
    const newErrors = { ...errors };
    let hasError = false;

    const clearIfClientError = (field) => {
      if (clientErrors.has(newErrors[field])) {
        newErrors[field] = "";
      }
    };

    if (touchedFields.firstName) {
      if (data.firstName.trim().length === 0) {
        newErrors.firstName = emptyErrors.firstName;
        hasError = true;
      } else {
        clearIfClientError("firstName");
      }
    }
    if (touchedFields.lastName) {
      if (data.lastName.trim().length === 0) {
        newErrors.lastName = emptyErrors.lastName;
        hasError = true;
      } else {
        clearIfClientError("lastName");
      }
    }

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
      } else if (passwordStrength(data.password) < 4) {
        newErrors.password =
          'Password must reach "Strong" strength to proceed.';
        hasError = true;
      } else {
        clearIfClientError("password");
      }
    }

    // Confirm password must not be empty and must match
    if (touchedFields.confirmPassword) {
      if (data.confirmPassword.trim().length === 0) {
        newErrors.confirmPassword = emptyErrors.confirmPassword;
        hasError = true;
      } else if (data.confirmPassword !== data.password) {
        newErrors.confirmPassword = "Passwords do not match.";
        hasError = true;
      } else {
        clearIfClientError("confirmPassword");
      }
    }

    setErrors(newErrors);
    return hasError;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedformData = {
      ...formData,
      [name]: value,
    };
    setFormData(updatedformData);

    validateFormData(updatedformData, touched);
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

  const passwordStrength = (password) => {
    const userInput = [
      formData.firstName,
      formData.lastName,
      formData.email,
      "VaultBox",
    ];
    return zxcvbn(password, userInput).score;
  };

  const getStrengthLabel = (score) => {
    switch (score) {
      case 0:
        return {
          label: "Very Weak",
          color: "bg-red-600",
          text: "text-red-500",
        };
      case 1:
        return {
          label: "Weak",
          color: "bg-orange-500",
          text: "text-orange-500",
        };
      case 2:
        return {
          label: "Fair",
          color: "bg-yellow-500",
          text: "text-yellow-500",
        };
      case 3:
        return { label: "Good", color: "bg-lime-500", text: "text-lime-500" };
      case 4:
        return {
          label: "Strong",
          color: "bg-green-500",
          text: "text-green-500",
        };
      default:
        return { label: "", color: "bg-gray-700", text: "text-gray-500" };
    }
  };

  const score = formData.password ? passwordStrength(formData.password) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all fields as touched
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
      const res = await axios.post("/api/auth/register", formData);
      navigate("/login");
    } catch (error) {
      const { data } = error.response;
      if (!data) {
        setErrors((prev) => ({ ...prev, serverError: "Something went wrong" }));
      }

      if (data.error) {
        setErrors((prev) => ({ ...prev, serverError: data.error }));
      }
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
            Already have an account?
          </span>
          <Link
            to="/login"
            className="px-4 py-2 hover:text-white text-gray-300 transition-colors"
          >
            Log In
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Create your account
            </h1>
            <p className="text-gray-400">
              Start securing your digital life today.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* First Name & Last Name */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="firstName"
                  className="text-sm font-medium text-gray-300"
                >
                  First Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    placeholder="John"
                    className={inputClass("firstName")}
                    value={formData.firstName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </div>
                {errors.firstName && (
                  <p className="text-xs text-red-400 mt-1">
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="lastName"
                  className="text-sm font-medium text-gray-300"
                >
                  Last Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    placeholder="Doe"
                    className={inputClass("lastName")}
                    value={formData.lastName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </div>
                {errors.lastName && (
                  <p className="text-xs text-red-400 mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>

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
              <label
                htmlFor="password"
                className="text-sm font-medium text-gray-300"
              >
                Password
              </label>
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

              {/* Password Strength Meter */}
              {formData.password && (
                <div className="mt-3 p-3 bg-gray-900/50 rounded-lg border border-gray-800">
                  <div className="flex justify-between text-xs text-gray-400 mb-2">
                    <span>Password Strength</span>
                    <span
                      className={`font-bold ${getStrengthLabel(score).text}`}
                    >
                      {getStrengthLabel(score).label}
                    </span>
                  </div>
                  <div className="flex gap-1 h-1.5">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-full flex-1 rounded-full transition-all duration-300 ${
                          i <= score && formData.password
                            ? getStrengthLabel(score).color
                            : "bg-gray-700"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Must reach &quot;Strong&quot; to proceed.
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-gray-300"
              >
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="••••••••"
                  className={inputClass("confirmPassword")}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-400 mt-1">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
            {errors.serverError && (
              <p className="text-md text-center text-red-400 mt-1">
                {errors.serverError}
              </p>
            )}

            <p className="text-xs text-center text-gray-500 max-w-xs mx-auto">
              By clicking &quot;Create Account&quot;, you agree to our Terms of
              Service and Privacy Policy.
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

export default SignUpPage;
