import { MailWarningIcon } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useRequestEmailVerificationMutation } from "@/features/auth/api/useAuthMutations";

export function EmailVerificationBanner() {
  const requestVerification = useRequestEmailVerificationMutation();

  function handleClick() {
    requestVerification.mutate(undefined, {
      onSuccess: (data) => toast.success(data.message),
      onError: (error) => {
        toast.error(
          error instanceof Error ? error.message : "Impossible d'envoyer l'email de vérification.",
        );
      },
    });
  }

  return (
    <Alert
      variant="warning"
      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-2">
        <MailWarningIcon className="mt-0.5 size-4 shrink-0" />
        <AlertDescription>Votre adresse email n'est pas encore vérifiée.</AlertDescription>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={handleClick}
        disabled={requestVerification.isPending}
      >
        {requestVerification.isPending ? "Envoi…" : "Renvoyer l'email de vérification"}
      </Button>
    </Alert>
  );
}
