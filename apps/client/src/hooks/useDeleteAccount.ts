import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { useAuth } from "./useAuth";

export function useDeleteAccount() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [password, setPassword] = useState("");

  const deleteAccountMutation = trpc.auth.deleteAccount.useMutation({
    onSuccess: async () => {
      // Sign out and redirect to home
      await signOut();
      router.push("/");
    },
    onError: (error) => {
      console.error("Error deleting account:", error);
    },
  });

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();

    deleteAccountMutation.mutate({
      password,
    });
  };

  return {
    password,
    setPassword,
    handleDelete,
    isPending: deleteAccountMutation.isPending,
    error: deleteAccountMutation.error,
  };
}
