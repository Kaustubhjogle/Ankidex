import { Button, Card, CardBody, CardHeader, Input } from "@heroui/react";

type AuthPanelProps = {
  email: string;
  password: string;
  signInLoading: boolean;
  signUpLoading: boolean;
  error: string | null;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSignIn: () => void;
  onSignUp: () => void;
};

export default function AuthPanel({
  email,
  password,
  signInLoading,
  signUpLoading,
  error,
  onEmailChange,
  onPasswordChange,
  onSignIn,
  onSignUp,
}: AuthPanelProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.2),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(251,191,36,0.25),_transparent_42%),linear-gradient(145deg,#f8fafc_0%,#f8fafc_45%,#fff7ed_100%)] px-4 py-8 sm:px-6">
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center">
        <Card className="w-full border border-white/70 bg-white/90 shadow-xl shadow-sky-100/70 backdrop-blur">
          <CardHeader className="flex-col items-start gap-1">
            <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">Welcome Back</p>
            <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-zinc-900">
              Sign In To Anki Deck Lab
            </h1>
          </CardHeader>
          <CardBody>
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                onSignIn();
              }}
            >
              <Input
                type="email"
                label="Email"
                labelPlacement="outside"
                placeholder="you@example.com"
                value={email}
                onValueChange={onEmailChange}
                variant="bordered"
              />
              <Input
                type="password"
                label="Password"
                labelPlacement="outside"
                placeholder="Your password"
                value={password}
                onValueChange={onPasswordChange}
                variant="bordered"
              />
              {error ? <p className="text-sm text-danger">{error}</p> : null}
              <div className="grid gap-2 sm:grid-cols-2">
                <Button color="primary" type="submit" isLoading={signInLoading}>
                  Sign In
                </Button>
                <Button variant="flat" type="button" onPress={onSignUp} isLoading={signUpLoading}>
                  Create Account
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
