"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

type LoginFormProps = React.ComponentProps<"form"> & {
  loginAction?: (formData: FormData) => Promise<void>;
};

function FormInputs({ email, password, setEmail, setPassword }: {
  email: string;
  password: string;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
}) {
  const { pending } = useFormStatus();
  
  return (
    <>
      <Field>
        <FieldLabel htmlFor="email">Email</FieldLabel>
        <Input
          id="email"
          type="email"
          placeholder="m@example.com"
          required
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={pending}
        />
      </Field>
      <Field>
        <div className="flex items-center">
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Link
            href="/auth/forgot-password"
            className="ml-auto text-sm underline-offset-4 hover:underline"
          >
            Forgot your password?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          required
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={pending}
        />
      </Field>
    </>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Logging in...
        </>
      ) : (
        "Login"
      )}
    </Button>
  );
}

export function LoginForm({
  className,
  loginAction,
  ...props
}: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      router.push("/protected");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const formProps = loginAction 
    ? { action: loginAction } 
    : { onSubmit: handleLogin };

  return (
    <form className={cn("flex flex-col gap-6", className)} {...formProps} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Login to your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter your email below to login to your account
          </p>
        </div>
        {loginAction ? (
          <FormInputs 
            email={email} 
            password={password} 
            setEmail={setEmail} 
            setPassword={setPassword} 
          />
        ) : (
          <>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </Field>
            <Field>
              <div className="flex items-center">
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Link
                  href="/auth/forgot-password"
                  className="ml-auto text-sm underline-offset-4 hover:underline"
                >
                  Forgot your password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                required
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </Field>
          </>
        )}
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Field>
          {loginAction ? (
            <SubmitButton />
          ) : (
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>
          )}
        </Field>
        <FieldDescription className="text-center">
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/sign-up"
            className="underline underline-offset-4"
          >
            Sign up
          </Link>
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}
