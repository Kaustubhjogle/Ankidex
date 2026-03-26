import { Button, Card, CardBody, CardHeader, Input } from "@heroui/react";
import { motion } from "framer-motion";

type AuthPanelProps = {
  username: string;
  email: string;
  password: string;
  mode: "signin" | "signup";
  loading: boolean;
  error: string | null;
  onUsernameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  onToggleMode: () => void;
};

export default function AuthPanel({
  username,
  email,
  password,
  mode,
  loading,
  error,
  onUsernameChange,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onToggleMode,
}: AuthPanelProps) {
  const isSignUp = mode === "signup";
  const authInputTextClass =
    "text-zinc-900 placeholder:text-zinc-500 [-webkit-text-fill-color:#18181b] autofill:[-webkit-text-fill-color:#18181b] dark:!text-white dark:placeholder:text-slate-400 dark:[-webkit-text-fill-color:#ffffff] dark:autofill:[-webkit-text-fill-color:#ffffff]";

  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-100 px-4 py-8 dark:bg-slate-950 sm:px-6 sm:py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-16 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl dark:bg-cyan-400/20" />
        <div className="absolute -right-20 bottom-16 h-80 w-80 rounded-full bg-emerald-400/15 blur-3xl dark:bg-emerald-300/15" />
        <motion.div
          className="absolute left-1/2 top-0 h-80 w-[34rem] -translate-x-1/2 rounded-full bg-indigo-500/10 blur-3xl dark:bg-indigo-400/10"
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative mx-auto flex min-h-[84vh] max-w-2xl items-center">
        <Card className="w-full rounded-[28px] border border-zinc-200/80 bg-white/75 shadow-2xl shadow-cyan-200/40 backdrop-blur-2xl dark:border-white/20 dark:bg-slate-900/70 dark:shadow-cyan-950/40">
          <CardHeader className="flex-col items-start gap-2 px-6 pt-7 sm:px-10 sm:pt-10">
            <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500 dark:text-slate-400">
              {isSignUp ? "Start Learning" : "Welcome Back"}
            </p>
            <h1 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-bold text-zinc-900 dark:text-white sm:text-4xl">
              {isSignUp ? "Create Your Ankidex Account" : "Sign In To Ankidex"}
            </h1>
            <p className="text-sm text-zinc-600 dark:text-slate-300/90">
              {isSignUp
                ? "Build your spaced-repetition workspace in seconds."
                : "Pick up where you left off and continue your review flow."}
            </p>
          </CardHeader>
          <CardBody className="px-6 pb-8 pt-2 sm:px-10 sm:pb-10">
            <form
              className="mx-auto w-full max-w-xl space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                onSubmit();
              }}
            >
              {isSignUp ? (
                <div className="w-full space-y-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-slate-200">Username</label>
                  <Input
                    type="text"
                    placeholder="choose a unique username"
                    value={username}
                    onValueChange={onUsernameChange}
                    variant="bordered"
                    className="w-full"
                    classNames={{
                      inputWrapper:
                        "h-12 rounded-xl border-zinc-300 bg-white/90 hover:border-zinc-400 focus-within:border-cyan-500 dark:border-slate-700/80 dark:bg-slate-900/60 dark:hover:border-slate-500 dark:focus-within:border-cyan-400",
                      input: authInputTextClass,
                    }}
                  />
                </div>
              ) : null}
              <div className="w-full space-y-2">
                <label className="block text-sm font-medium text-zinc-700 dark:text-slate-200">Email</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onValueChange={onEmailChange}
                  variant="bordered"
                  className="w-full"
                  classNames={{
                    inputWrapper:
                      "h-12 rounded-xl border-zinc-300 bg-white/90 hover:border-zinc-400 focus-within:border-cyan-500 dark:border-slate-700/80 dark:bg-slate-900/60 dark:hover:border-slate-500 dark:focus-within:border-cyan-400",
                    input: authInputTextClass,
                  }}
                />
              </div>
              <div className="w-full space-y-2 pt-2">
                <label className="block text-sm font-medium text-zinc-700 dark:text-slate-200">Password</label>
                <Input
                  type="password"
                  placeholder="Your password"
                  value={password}
                  onValueChange={onPasswordChange}
                  variant="bordered"
                  className="w-full"
                  classNames={{
                    inputWrapper:
                      "h-12 rounded-xl border-zinc-300 bg-white/90 hover:border-zinc-400 focus-within:border-cyan-500 dark:border-slate-700/80 dark:bg-slate-900/60 dark:hover:border-slate-500 dark:focus-within:border-cyan-400",
                    input: authInputTextClass,
                  }}
                />
              </div>
              {error ? <p className="text-sm text-rose-500 dark:text-rose-300">{error}</p> : null}
              <div className="space-y-3 pt-1">
                <Button
                  color="primary"
                  type="submit"
                  isLoading={loading}
                  className="h-10 w-full rounded-xl bg-cyan-500 font-semibold text-slate-950 hover:bg-cyan-400"
                >
                  {isSignUp ? "Create Account" : "Sign In"}
                </Button>
                <Button
                  variant="bordered"
                  type="button"
                  onPress={onToggleMode}
                  className="h-10 w-full rounded-xl border-zinc-300/90 bg-transparent px-3 py-1 text-sm text-zinc-700 dark:border-slate-600/90 dark:text-slate-200"
                >
                  {isSignUp ? "Already A User? Sign In" : "New To Ankidex? Create Account"}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
