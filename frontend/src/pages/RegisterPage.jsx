import { useState } from "react";
import { useDispatch } from "react-redux";
import { setAuth } from "../store/auth-slice";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { addUser } from "../util/api/auth.mjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const RegistrationForm = () => {
  const [error, setError] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { mutate } = useMutation({
    mutationKey: ["register"],
    mutationFn: addUser,
    onSuccess: (data) => {
      dispatch(setAuth({ user: data.user }));
      navigate("/login");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    const { password, confirmPassword, email } = data;

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordPattern = /^(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    if (!emailPattern.test(email)) { setError("Invalid email format"); return; }
    if (!passwordPattern.test(password)) {
      setError("Password must be at least 8 characters and include one special character");
      return;
    }

    mutate(data);
    e.target.reset();
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-md p-8">
        <h1 className="text-xl font-bold text-center mb-5">Register</h1>

        {error && (
          <div className="mb-4 px-3 py-2.5 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input name="name" placeholder="Full Name" required />
          <Input name="email" type="email" placeholder="Email" required />
          <Input name="password" type="password" placeholder="Password" required />
          <Input name="confirmPassword" type="password" placeholder="Confirm Password" required />
          <Button type="submit" className="mt-1 w-full">Register</Button>
          <div className="text-center mt-2">
            <Link
              to="/"
              className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
            >
              Already have an account? Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegistrationForm;
