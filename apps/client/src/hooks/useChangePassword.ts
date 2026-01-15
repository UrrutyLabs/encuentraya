import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { useAuth } from "./useAuth";

export function useChangePassword() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const changePasswordMutation = trpc.auth.changePassword.useMutation({
    onSuccess: async () => {
      // Supabase invalidates the session when password is changed via Admin API
      // We need to sign out and redirect to login so user can sign in with new password
      await signOut();
      router.push("/login?passwordChanged=true");
    },
    onError: (error) => {
      console.error("Error changing password:", error);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      changePasswordMutation.reset();
      // We'll handle this in the component
      return;
    }

    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
    });
  };

  return {
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    handleSubmit,
    isPending: changePasswordMutation.isPending,
    error: changePasswordMutation.error,
    isSuccess: changePasswordMutation.isSuccess,
  };
}
