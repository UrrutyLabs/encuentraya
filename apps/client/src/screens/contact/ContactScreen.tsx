"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mail, CheckCircle2 } from "lucide-react";
import { useSubmitContact } from "@/hooks/contact/useSubmitContact";
import { ContactForm } from "@/components/forms/ContactForm";
import { Text } from "@repo/ui";
import { Card } from "@repo/ui";
import { Button } from "@repo/ui";

export function ContactScreen() {
  const router = useRouter();
  const { submitContact, isPending, error, data, isSuccess } =
    useSubmitContact();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  // Reset form on successful submission
  useEffect(() => {
    if (data?.success) {
      // Reset form after showing success message
      const timer = setTimeout(() => {
        setName("");
        setEmail("");
        setSubject("");
        setMessage("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await submitContact({
        name,
        email,
        subject,
        message,
      });
      // Success state is handled by checking data?.success below
    } catch {
      // Error is handled by mutation state (error variable from hook)
      // The form will remain visible with error message
    }
  };

  // Show success state - check both data.success and isSuccess to ensure state is updated
  const showSuccess = (data?.success || isSuccess) && !isPending;

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg p-4 animate-[fadeIn_0.5s_ease-in-out]">
        <Card className="max-w-md w-full p-8 animate-[slideUp_0.5s_ease-in-out]">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center animate-[zoomIn_0.5s_ease-in-out_0.1s_both]">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <div className="space-y-2 animate-[fadeInUp_0.5s_ease-in-out_0.2s_both]">
              <Text variant="h2" className="text-text">
                ¡Mensaje enviado!
              </Text>
              <Text variant="body" className="text-muted">
                {data?.message ??
                  "Tu mensaje ha sido enviado exitosamente. Te responderemos pronto."}
              </Text>
            </div>
            <Button
              variant="primary"
              onClick={() => router.push("/")}
              className="mt-4 animate-[fadeInUp_0.5s_ease-in-out_0.3s_both] hover:scale-105 transition-transform"
            >
              Volver al inicio
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Extract error message
  const errorMessage =
    error?.message ||
    (error?.data?.code === "TOO_MANY_REQUESTS"
      ? "Has enviado demasiados mensajes. Por favor espera unos minutos antes de intentar nuevamente."
      : error?.data?.code === "BAD_REQUEST"
        ? "Por favor verifica que todos los campos estén completos correctamente."
        : error
          ? "Ocurrió un error al enviar tu mensaje. Por favor intenta nuevamente."
          : null);

  return (
    <div className="min-h-screen bg-bg py-12 px-4 animate-[fadeIn_0.5s_ease-in-out]">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 animate-[fadeInDown_0.5s_ease-in-out]">
          <div className="flex items-center justify-center gap-2">
            <Mail className="w-8 h-8 text-primary animate-[zoomIn_0.5s_ease-in-out_0.1s_both]" />
            <Text variant="h1" className="text-text">
              Contacto
            </Text>
          </div>
          <Text
            variant="body"
            className="text-muted max-w-lg mx-auto animate-[fadeIn_0.5s_ease-in-out_0.2s_both]"
          >
            ¿Tenés alguna pregunta o necesitás ayuda? Envíanos un mensaje y te
            responderemos lo antes posible.
          </Text>
        </div>

        {/* Form Card */}
        <Card className="p-6 md:p-8 animate-[slideUp_0.5s_ease-in-out_0.3s_both]">
          <ContactForm
            name={name}
            email={email}
            subject={subject}
            message={message}
            onNameChange={setName}
            onEmailChange={setEmail}
            onSubjectChange={setSubject}
            onMessageChange={setMessage}
            onSubmit={handleSubmit}
            loading={isPending}
            error={errorMessage}
          />
        </Card>

        {/* Additional Info */}
        <div className="text-center animate-[fadeIn_0.5s_ease-in-out_0.5s_both]">
          <Text variant="small" className="text-muted">
            También podés contactarnos por email en{" "}
            <a
              href="mailto:support@encuentraya.com"
              className="text-primary hover:underline transition-colors hover:text-secondary"
            >
              support@encuentraya.com
            </a>
          </Text>
        </div>
      </div>
    </div>
  );
}
