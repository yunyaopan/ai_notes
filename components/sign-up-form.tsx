"use client";

import { cn, getBaseUrl } from "@/lib/utils";
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
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

type SignUpFormProps = React.ComponentProps<"form"> & {
  signupAction?: (formData: FormData) => Promise<void>;
};

function FormInputs({
  email,
  password,
  repeatPassword,
  setEmail,
  setPassword,
  setRepeatPassword,
}: {
  email: string;
  password: string;
  repeatPassword: string;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setRepeatPassword: (value: string) => void;
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
        <FieldDescription>
          We&apos;ll use this to contact you. We will not share your email
          with anyone else.
        </FieldDescription>
      </Field>
      <Field>
        <FieldLabel htmlFor="password">Password</FieldLabel>
        <Input
          id="password"
          type="password"
          required
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={pending}
        />
        <FieldDescription>
          Must be at least 8 characters long.
        </FieldDescription>
      </Field>
      <Field>
        <FieldLabel htmlFor="repeat-password">Confirm Password</FieldLabel>
        <Input
          id="repeat-password"
          type="password"
          required
          name="repeat-password"
          value={repeatPassword}
          onChange={(e) => setRepeatPassword(e.target.value)}
          disabled={pending}
        />
        <FieldDescription>Please confirm your password.</FieldDescription>
      </Field>
    </>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Field>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating an account...
          </>
        ) : (
          "Create Account"
        )}
      </Button>
    </Field>
  );
}

export function SignUpForm({
  className,
  signupAction,
  ...props
}: SignUpFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const baseUrl = getBaseUrl();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Send verification emails to our callback handler, then bounce to /protected
          emailRedirectTo: `${baseUrl}/auth/callback?next=/protected`,
        },
      });
      if (error) throw error;
      router.push("/auth/sign-up-success");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const formProps = signupAction
    ? { action: signupAction, className: cn("flex flex-col gap-6", className) }
    : { onSubmit: handleSignUp, className: cn("flex flex-col gap-6", className) };

  return (
    <form {...formProps} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Fill in the form below to create your account
          </p>
        </div>
        {signupAction ? (
          <FormInputs
            email={email}
            password={password}
            repeatPassword={repeatPassword}
            setEmail={setEmail}
            setPassword={setPassword}
            setRepeatPassword={setRepeatPassword}
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
              <FieldDescription>
                We&apos;ll use this to contact you. We will not share your email
                with anyone else.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                required
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
              <FieldDescription>
                Must be at least 8 characters long.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="repeat-password">Confirm Password</FieldLabel>
              <Input
                id="repeat-password"
                type="password"
                required
                name="repeat-password"
                value={repeatPassword}
                onChange={(e) => setRepeatPassword(e.target.value)}
                disabled={isLoading}
              />
              <FieldDescription>Please confirm your password.</FieldDescription>
            </Field>
          </>
        )}
        {error && (
          <Field>
            <p className="text-sm text-red-500">{error}</p>
          </Field>
        )}
        {signupAction ? (
          <SubmitButton />
        ) : (
          <Field>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating an account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </Field>
        )}
        <Field>
          <FieldDescription className="text-center">
            Already have an account?{" "}
            <Link href="/auth/login" className="underline underline-offset-4">
              Sign in
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
