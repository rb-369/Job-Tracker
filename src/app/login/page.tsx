import { LoginForm } from '@/components/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black tracking-tighter uppercase italic">
            Pipeline
          </h1>
          <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground mt-2">
            Secure Access
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
