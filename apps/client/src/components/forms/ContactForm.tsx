import {
  Mail,
  User,
  MessageSquare,
  FileText,
  Send,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@repo/ui";
import { Input } from "@repo/ui";
import { Text } from "@repo/ui";

interface ContactFormProps {
  name: string;
  email: string;
  subject: string;
  message: string;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
  onMessageChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading?: boolean;
  error?: string | null;
}

export function ContactForm({
  name,
  email,
  subject,
  message,
  onNameChange,
  onEmailChange,
  onSubjectChange,
  onMessageChange,
  onSubmit,
  loading = false,
  error,
}: ContactFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-text mb-1">
          <User className="w-4 h-4 text-muted" />
          Nombre <span className="text-danger">*</span>
        </label>
        <Input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          required
          placeholder="Tu nombre completo"
          className="transition-all duration-200 focus:scale-[1.01]"
        />
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-text mb-1">
          <Mail className="w-4 h-4 text-muted" />
          Email <span className="text-danger">*</span>
        </label>
        <Input
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          required
          placeholder="tu@email.com"
          className="transition-all duration-200 focus:scale-[1.01]"
        />
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-text mb-1">
          <FileText className="w-4 h-4 text-muted" />
          Asunto <span className="text-danger">*</span>
        </label>
        <Input
          type="text"
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
          required
          placeholder="¿En qué podemos ayudarte?"
          className="transition-all duration-200 focus:scale-[1.01]"
        />
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-text mb-1">
          <MessageSquare className="w-4 h-4 text-muted" />
          Mensaje <span className="text-danger">*</span>
        </label>
        <textarea
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          rows={6}
          required
          minLength={10}
          className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-y transition-all duration-200 focus:scale-[1.01]"
          placeholder="Contanos tu consulta o problema..."
        />
        <Text variant="small" className="text-muted mt-1">
          Mínimo 10 caracteres
        </Text>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-danger/10 border border-danger/20 rounded-md animate-[slideDown_0.3s_ease-in-out]">
          <AlertCircle className="w-4 h-4 text-danger shrink-0 animate-[zoomIn_0.3s_ease-in-out]" />
          <Text variant="small" className="text-danger">
            {error}
          </Text>
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        className="w-full flex items-center gap-2 justify-center transition-all duration-200 hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-50"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Enviando mensaje...
          </>
        ) : (
          <>
            <Send className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            Enviar mensaje
          </>
        )}
      </Button>
    </form>
  );
}
