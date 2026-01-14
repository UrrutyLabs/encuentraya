import {
  Mail,
  Lock,
  User,
  Phone,
  LogIn,
  UserPlus,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@repo/ui";
import { Input } from "@repo/ui";
import { Text } from "@repo/ui";

interface AuthFormProps {
  mode: "login" | "signup";
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onFirstNameChange?: (value: string) => void;
  onLastNameChange?: (value: string) => void;
  onPhoneChange?: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading?: boolean;
  error?: string | null;
  footerLink?: {
    text: string;
    linkText: string;
    href: string;
  };
}

export function AuthForm({
  mode,
  email,
  password,
  firstName = "",
  lastName = "",
  phone = "",
  onEmailChange,
  onPasswordChange,
  onFirstNameChange,
  onLastNameChange,
  onPhoneChange,
  onSubmit,
  loading = false,
  error,
  footerLink,
}: AuthFormProps) {
  const isLogin = mode === "login";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {!isLogin && (
        <>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-text mb-1">
              <User className="w-4 h-4 text-muted" />
              Nombre
            </label>
            <Input
              type="text"
              value={firstName}
              onChange={(e) => onFirstNameChange?.(e.target.value)}
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-text mb-1">
              <User className="w-4 h-4 text-muted" />
              Apellido
            </label>
            <Input
              type="text"
              value={lastName}
              onChange={(e) => onLastNameChange?.(e.target.value)}
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-text mb-1">
              <Phone className="w-4 h-4 text-muted" />
              Teléfono
            </label>
            <Input
              type="tel"
              placeholder="+598..."
              value={phone}
              onChange={(e) => onPhoneChange?.(e.target.value)}
            />
          </div>
        </>
      )}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-text mb-1">
          <Mail className="w-4 h-4 text-muted" />
          Email
        </label>
        <Input
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-text mb-1">
          <Lock className="w-4 h-4 text-muted" />
          Contraseña
        </label>
        <Input
          type="password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          required
        />
      </div>
      {error && (
        <div className="flex items-center gap-2 p-3 bg-danger/10 border border-danger/20 rounded-md">
          <AlertCircle className="w-4 h-4 text-danger shrink-0" />
          <Text variant="small" className="text-danger">
            {error}
          </Text>
        </div>
      )}
      <Button
        type="submit"
        variant="primary"
        className="w-full flex items-center gap-2 justify-center"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {isLogin ? "Iniciando sesión..." : "Registrando..."}
          </>
        ) : (
          <>
            {isLogin ? (
              <LogIn className="w-4 h-4" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            {isLogin ? "Ingresar" : "Crear cuenta"}
          </>
        )}
      </Button>
      {footerLink && (
        <Text variant="small" className="text-center text-muted">
          {footerLink.text}{" "}
          <a href={footerLink.href} className="text-primary hover:underline">
            {footerLink.linkText}
          </a>
        </Text>
      )}
    </form>
  );
}
